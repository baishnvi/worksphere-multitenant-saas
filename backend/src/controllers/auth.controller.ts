import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { generateAccessToken, generateRefreshToken, hashToken } from '../utils/jwt';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { sendCreated, sendSuccess } from '../utils/response';
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    organizationName: z.string().min(2).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, organizationName } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new BadRequestError('User with this email already exists');
      }

      const passwordHash = await bcrypt.hash(password, 10);

      // Execute user creation and initial organization in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            firstName,
            lastName,
          },
        });

        let org = null;
        if (organizationName) {
          const slug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);
          org = await tx.organization.create({
            data: {
              name: organizationName,
              slug,
              members: {
                create: {
                  userId: user.id,
                  role: 'OWNER',
                },
              },
            },
          });
        }

        return { user, org };
      });

      const accessToken = generateAccessToken({
        userId: result.user.id,
        email: result.user.email,
        isPlatformAdmin: result.user.isPlatformAdmin,
      });

      const { token: rawRefreshToken, hash: refreshHash, expiresAt } = generateRefreshToken();
      await prisma.refreshToken.create({
        data: {
          userId: result.user.id,
          tokenHash: refreshHash,
          expiresAt,
        },
      });

      return sendCreated(res, {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          organization: result.org,
        },
        tokens: {
          accessToken,
          refreshToken: rawRefreshToken,
        },
      }, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          memberships: {
            include: { organization: true },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        isPlatformAdmin: user.isPlatformAdmin,
      });

      const { token: rawRefreshToken, hash: refreshHash, expiresAt } = generateRefreshToken();
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: refreshHash,
          expiresAt,
        },
      });

      return sendSuccess(res, {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isPlatformAdmin: user.isPlatformAdmin,
          organizations: user.memberships.map(m => ({
            id: m.organization.id,
            name: m.organization.name,
            slug: m.organization.slug,
            role: m.role,
          })),
        },
        tokens: {
          accessToken,
          refreshToken: rawRefreshToken,
        },
      }, 'Logged in successfully');
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken: rawToken } = req.body;
      const hashed = hashToken(rawToken);

      const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash: hashed },
        include: { user: true },
      });

      if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      // Rotate Refresh Token
      const { token: newRawRefreshToken, hash: newRefreshHash, expiresAt: newExpiresAt } = generateRefreshToken();

      await prisma.$transaction([
        prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: {
            revokedAt: new Date(),
            replacedByToken: newRefreshHash,
          },
        }),
        prisma.refreshToken.create({
          data: {
            userId: storedToken.userId,
            tokenHash: newRefreshHash,
            expiresAt: newExpiresAt,
          },
        }),
      ]);

      const accessToken = generateAccessToken({
        userId: storedToken.user.id,
        email: storedToken.user.email,
        isPlatformAdmin: storedToken.user.isPlatformAdmin,
      });

      return sendSuccess(res, {
        accessToken,
        refreshToken: newRawRefreshToken,
      }, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken: rawToken } = req.body;
      if (rawToken) {
        const hashed = hashToken(rawToken);
        await prisma.refreshToken.updateMany({
          where: { tokenHash: hashed },
          data: { revokedAt: new Date() },
        });
      }
      return sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          isPlatformAdmin: true,
          createdAt: true,
          memberships: {
            include: {
              organization: true,
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      return sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { sendCreated, sendSuccess } from '../utils/response';
import crypto from 'crypto';
import { z } from 'zod';

export const createOrgSchema = z.object({
  body: z.object({
    name: z.string().min(2),
  }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email(),
    role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'MEMBER', 'AUDITOR']),
  }),
});

export class OrganizationController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);

      const org = await prisma.organization.create({
        data: {
          name,
          slug,
          members: {
            create: {
              userId: req.user!.userId,
              role: 'OWNER',
            },
          },
        },
        include: {
          members: true,
        },
      });

      return sendCreated(res, org, 'Organization created');
    } catch (error) {
      next(error);
    }
  }

  static async getMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const members = await prisma.organizationMember.findMany({
        where: { organizationId: req.organizationId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      });

      return sendSuccess(res, members);
    } catch (error) {
      next(error);
    }
  }

  static async inviteMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, role } = req.body;
      const orgId = req.organizationId!;

      // Check if user is already a member
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        const existingMember = await prisma.organizationMember.findUnique({
          where: {
            organizationId_userId: {
              organizationId: orgId,
              userId: existingUser.id,
            },
          },
        });
        if (existingMember) {
          throw new BadRequestError('User is already a member of this organization');
        }
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invitation = await prisma.invitation.create({
        data: {
          organizationId: orgId,
          email,
          role,
          token,
          expiresAt,
          invitedById: req.user!.userId,
        },
      });

      return sendCreated(res, invitation, 'Invitation created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getOrgSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const [org, projectCount, taskCount, memberCount] = await Promise.all([
        prisma.organization.findUnique({ where: { id: orgId } }),
        prisma.project.count({ where: { organizationId: orgId } }),
        prisma.task.count({ where: { organizationId: orgId } }),
        prisma.organizationMember.count({ where: { organizationId: orgId } }),
      ]);

      if (!org) throw new NotFoundError('Organization not found');

      return sendSuccess(res, {
        organization: org,
        stats: {
          projects: projectCount,
          tasks: taskCount,
          members: memberCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

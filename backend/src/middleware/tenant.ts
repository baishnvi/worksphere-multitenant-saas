import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors';

export const requireTenant = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    // Tenant ID can come from 'x-organization-id' header or route parameter ':orgId'
    const orgId = (req.headers['x-organization-id'] as string) || req.params.orgId;
    if (!orgId) {
      return next(new ForbiddenError('Organization context required. Pass x-organization-id header.'));
    }

    // Platform admin has superuser tenant bypass
    if (req.user.isPlatformAdmin) {
      const org = await prisma.organization.findUnique({ where: { id: orgId } });
      if (!org) return next(new NotFoundError('Organization not found'));
      req.organizationId = orgId;
      req.userRole = 'PLATFORM_ADMIN';
      return next();
    }

    // Verify user membership in this organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: req.user.userId,
        },
      },
    });

    if (!membership || membership.isSuspended) {
      return next(new ForbiddenError('You do not have active access to this organization'));
    }

    req.organizationId = orgId;
    req.userRole = membership.role;
    next();
  } catch (error) {
    next(error);
  }
};

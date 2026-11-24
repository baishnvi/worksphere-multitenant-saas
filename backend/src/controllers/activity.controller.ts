import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { sendSuccess } from '../utils/response';

export class ActivityController {
  static async getProjectActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const orgId = req.organizationId!;

      const activities = await prisma.activityLog.findMany({
        where: {
          organizationId: orgId,
          projectId,
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return sendSuccess(res, activities);
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const { limit = '50', targetType } = req.query;

      const where: any = { organizationId: orgId };
      if (targetType) where.targetType = String(targetType);

      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: parseInt(String(limit), 10),
      });

      return sendSuccess(res, logs);
    } catch (error) {
      next(error);
    }
  }
}

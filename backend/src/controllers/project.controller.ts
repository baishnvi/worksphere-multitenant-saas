import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { NotFoundError } from '../utils/errors';
import { sendCreated, sendSuccess } from '../utils/response';
import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    key: z.string().min(2).max(10).toUpperCase(),
    description: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    startDate: z.string().datetime().optional(),
    targetEndDate: z.string().datetime().optional(),
  }),
});

export class ProjectController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, search } = req.query;
      const orgId = req.organizationId!;

      const where: any = { organizationId: orgId };
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { name: { contains: String(search), mode: 'insensitive' } },
          { key: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      const projects = await prisma.project.findMany({
        where,
        include: {
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: {
            select: { tasks: true, milestones: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return sendSuccess(res, projects);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const orgId = req.organizationId!;

      const project = await prisma.project.findFirst({
        where: { id, organizationId: orgId },
        include: {
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          milestones: true,
          tasks: {
            include: {
              assignee: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
            orderBy: { position: 'asc' },
          },
        },
      });

      if (!project) throw new NotFoundError('Project not found in this organization');

      return sendSuccess(res, project);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const { name, key, description, priority, startDate, targetEndDate } = req.body;

      const project = await prisma.project.create({
        data: {
          organizationId: orgId,
          name,
          key,
          description,
          priority,
          startDate: startDate ? new Date(startDate) : undefined,
          targetEndDate: targetEndDate ? new Date(targetEndDate) : undefined,
          ownerId: req.user!.userId,
        },
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          organizationId: orgId,
          actorId: req.user!.userId,
          action: 'PROJECT_CREATED',
          targetType: 'PROJECT',
          targetId: project.id,
          newState: project as any,
        },
      });

      return sendCreated(res, project, 'Project created successfully');
    } catch (error) {
      next(error);
    }
  }
}

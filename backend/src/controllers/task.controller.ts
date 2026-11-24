import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { ConflictError, NotFoundError } from '../utils/errors';
import { sendCreated, sendSuccess } from '../utils/response';
import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    projectId: z.string().uuid(),
    milestoneId: z.string().uuid().optional(),
    title: z.string().min(2),
    description: z.string().optional(),
    status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).default('TODO'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    assigneeId: z.string().uuid().optional(),
    dueDate: z.string().datetime().optional(),
    estimatedHours: z.number().optional(),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    dueDate: z.string().datetime().nullable().optional(),
    estimatedHours: z.number().nullable().optional(),
    actualHours: z.number().nullable().optional(),
    position: z.number().optional(),
    expectedVersion: z.number({ required_error: 'expectedVersion is mandatory for concurrency control' }),
  }),
});

export class TaskController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, status, priority, assigneeId } = req.query;
      const orgId = req.organizationId!;

      const where: any = { organizationId: orgId };
      if (projectId) where.projectId = String(projectId);
      if (status) where.status = String(status);
      if (priority) where.priority = String(priority);
      if (assigneeId) where.assigneeId = String(assigneeId);

      const tasks = await prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
          reporter: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { comments: true, subtasks: true, attachments: true } },
        },
        orderBy: { position: 'asc' },
      });

      return sendSuccess(res, tasks);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const orgId = req.organizationId!;

      const task = await prisma.task.findFirst({
        where: { id, organizationId: orgId },
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
          reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
          subtasks: { orderBy: { position: 'asc' } },
          comments: {
            include: { author: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: { createdAt: 'desc' },
          },
          attachments: true,
          activityLogs: {
            include: { user: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!task) throw new NotFoundError('Task not found');

      return sendSuccess(res, task);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const {
        projectId,
        milestoneId,
        title,
        description,
        status,
        priority,
        assigneeId,
        dueDate,
        estimatedHours,
      } = req.body;

      // Ensure project belongs to same org
      const project = await prisma.project.findFirst({
        where: { id: projectId, organizationId: orgId },
      });
      if (!project) throw new NotFoundError('Project does not exist in this organization');

      // Get max position for column
      const lastTask = await prisma.task.findFirst({
        where: { projectId, status },
        orderBy: { position: 'desc' },
      });
      const position = lastTask ? lastTask.position + 1000 : 1000;

      const task = await prisma.task.create({
        data: {
          organizationId: orgId,
          projectId,
          milestoneId,
          title,
          description,
          status,
          priority,
          assigneeId,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          estimatedHours,
          position,
          reporterId: req.user!.userId,
          version: 1, // Base version
        },
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      // Record Activity
      await prisma.activityLog.create({
        data: {
          organizationId: orgId,
          projectId,
          taskId: task.id,
          userId: req.user!.userId,
          action: 'TASK_CREATED',
          entityType: 'TASK',
          entityId: task.id,
          details: { title: task.title, status: task.status },
        },
      });

      return sendCreated(res, task, 'Task created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Domain-Specific Capstone Challenge:
   * Optimistic Concurrency Control (OCC) update
   * Prevents silent overwrites when two users edit the same task simultaneously
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const orgId = req.organizationId!;
      const {
        title,
        description,
        status,
        priority,
        assigneeId,
        dueDate,
        estimatedHours,
        actualHours,
        position,
        expectedVersion,
      } = req.body;

      const currentTask = await prisma.task.findFirst({
        where: { id, organizationId: orgId },
      });

      if (!currentTask) throw new NotFoundError('Task not found');

      // Concurrency check
      if (currentTask.version !== expectedVersion) {
        throw new ConflictError(
          'Task has been modified by another user. Please refresh and review latest changes before editing.',
          {
            currentVersion: currentTask.version,
            expectedVersion,
            latestTask: currentTask,
          }
        );
      }

      // Execute update with version increment in transaction
      const updatedTask = await prisma.$transaction(async (tx) => {
        const updated = await tx.task.update({
          where: { id },
          data: {
            title,
            description,
            status,
            priority,
            assigneeId,
            dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
            estimatedHours,
            actualHours,
            position,
            version: { increment: 1 },
          },
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true } },
          },
        });

        // Log audit and activity
        await tx.activityLog.create({
          data: {
            organizationId: orgId,
            projectId: currentTask.projectId,
            taskId: updated.id,
            userId: req.user!.userId,
            action: status && status !== currentTask.status ? 'TASK_STATUS_CHANGED' : 'TASK_UPDATED',
            entityType: 'TASK',
            entityId: updated.id,
            details: {
              oldStatus: currentTask.status,
              newStatus: updated.status,
              oldVersion: currentTask.version,
              newVersion: updated.version,
            },
          },
        });

        return updated;
      });

      return sendSuccess(res, updatedTask, 'Task updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: taskId } = req.params;
      const { content } = req.body;
      const orgId = req.organizationId!;

      const task = await prisma.task.findFirst({
        where: { id: taskId, organizationId: orgId },
      });
      if (!task) throw new NotFoundError('Task not found');

      const comment = await prisma.comment.create({
        data: {
          taskId,
          authorId: req.user!.userId,
          content,
        },
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      await prisma.activityLog.create({
        data: {
          organizationId: orgId,
          projectId: task.projectId,
          taskId: task.id,
          userId: req.user!.userId,
          action: 'COMMENT_ADDED',
          entityType: 'COMMENT',
          entityId: comment.id,
        },
      });

      return sendCreated(res, comment, 'Comment added');
    } catch (error) {
      next(error);
    }
  }
}

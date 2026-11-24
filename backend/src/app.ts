import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import orgRoutes from './routes/organization.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import activityRoutes from './routes/activity.routes';
import webhookRoutes from './routes/webhook.routes';
import { errorHandler } from './middleware/errorHandler';
import prisma from './utils/prisma';

export const createApp = (): Application => {
  const app = express();

  // Security Middleware
  app.use(helmet());
  app.use(cors({
    origin: '*', // Allow frontend client origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id', 'X-Requested-With'],
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Observability & Health/Readiness Endpoints (Assessment 05/06/09)
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'worksphere-core-backend',
    });
  });

  app.get('/readiness', async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        status: 'READY',
        database: 'CONNECTED',
      });
    } catch (err: any) {
      res.status(503).json({
        status: 'NOT_READY',
        database: 'DISCONNECTED',
        error: err.message,
      });
    }
  });

  // API Routes
  const prefix = config.apiPrefix;
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/organizations`, orgRoutes);
  app.use(`${prefix}/projects`, projectRoutes);
  app.use(`${prefix}/tasks`, taskRoutes);
  app.use(`${prefix}/activities`, activityRoutes);
  app.use(`${prefix}/webhooks`, webhookRoutes);

  // Fallback 404
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Endpoint does not exist',
      },
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp;

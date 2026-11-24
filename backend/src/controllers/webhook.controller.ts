import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import { sendCreated, sendSuccess } from '../utils/response';
import { z } from 'zod';

export const registerWebhookSchema = z.object({
  body: z.object({
    url: z.string().url(),
    events: z.array(z.string()).min(1),
  }),
});

export class WebhookController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { url, events } = req.body;
      const orgId = req.organizationId!;

      // Generate secret key for HMAC SHA256 signature verification
      const secret = 'whsec_' + crypto.randomBytes(24).toString('hex');

      const webhook = await prisma.webhookEndpoint.create({
        data: {
          organizationId: orgId,
          url,
          events,
          secret,
        },
      });

      return sendCreated(res, webhook, 'Webhook endpoint registered successfully');
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.organizationId!;
      const endpoints = await prisma.webhookEndpoint.findMany({
        where: { organizationId: orgId },
        include: {
          deliveries: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return sendSuccess(res, endpoints);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Helper to generate HMAC SHA256 signature for payload verification
   */
  static generateSignature(payload: string, secret: string): string {
    return 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }
}

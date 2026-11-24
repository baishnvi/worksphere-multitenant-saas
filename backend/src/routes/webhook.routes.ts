import { Router } from 'express';
import { WebhookController, registerWebhookSchema } from '../controllers/webhook.controller';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { requireRole, forbidAuditorWrite } from '../middleware/rbac';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', WebhookController.list);
router.post('/', forbidAuditorWrite, requireRole(['OWNER', 'ADMIN']), validate(registerWebhookSchema), WebhookController.register);

export default router;

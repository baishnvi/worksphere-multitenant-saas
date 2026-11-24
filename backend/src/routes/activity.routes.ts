import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/project/:projectId', ActivityController.getProjectActivity);
router.get('/audit-logs', requireRole(['OWNER', 'ADMIN', 'AUDITOR']), ActivityController.getAuditLogs);

export default router;

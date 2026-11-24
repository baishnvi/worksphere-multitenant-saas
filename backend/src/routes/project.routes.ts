import { Router } from 'express';
import { ProjectController, createProjectSchema } from '../controllers/project.controller';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { requireRole, forbidAuditorWrite } from '../middleware/rbac';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', ProjectController.list);
router.get('/:id', ProjectController.getById);
router.post(
  '/',
  forbidAuditorWrite,
  requireRole(['OWNER', 'ADMIN', 'PROJECT_MANAGER']),
  validate(createProjectSchema),
  ProjectController.create
);

export default router;

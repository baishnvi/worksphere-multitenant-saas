import { Router } from 'express';
import { TaskController, createTaskSchema, updateTaskSchema } from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { forbidAuditorWrite } from '../middleware/rbac';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', TaskController.list);
router.get('/:id', TaskController.getById);
router.post('/', forbidAuditorWrite, validate(createTaskSchema), TaskController.create);
router.patch('/:id', forbidAuditorWrite, validate(updateTaskSchema), TaskController.update);
router.post('/:id/comments', forbidAuditorWrite, TaskController.addComment);

export default router;

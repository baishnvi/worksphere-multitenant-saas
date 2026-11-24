import { Router } from 'express';
import { OrganizationController, createOrgSchema, inviteMemberSchema } from '../controllers/organization.controller';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { requireRole, forbidAuditorWrite } from '../middleware/rbac';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate);

// Create new organization
router.post('/', validate(createOrgSchema), OrganizationController.create);

// Scoped to current tenant
router.use(requireTenant);
router.get('/summary', OrganizationController.getOrgSummary);
router.get('/members', OrganizationController.getMembers);
router.post(
  '/invite',
  forbidAuditorWrite,
  requireRole(['OWNER', 'ADMIN']),
  validate(inviteMemberSchema),
  OrganizationController.inviteMember
);

export default router;

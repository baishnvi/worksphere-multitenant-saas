import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors';

const ROLE_HIERARCHY: Record<string, number> = {
  PLATFORM_ADMIN: 100,
  OWNER: 90,
  ADMIN: 80,
  PROJECT_MANAGER: 60,
  MEMBER: 40,
  AUDITOR: 20,
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return next(new ForbiddenError('Role context not resolved'));
    }

    if (req.userRole === 'PLATFORM_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.userRole)) {
      return next(new ForbiddenError(`Action forbidden. Requires one of roles: [${allowedRoles.join(', ')}]`));
    }

    next();
  };
};

export const forbidAuditorWrite = (req: Request, _res: Response, next: NextFunction) => {
  // Auditors have strictly read-only capabilities
  if (req.userRole === 'AUDITOR' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next(new ForbiddenError('Auditor role is strictly read-only'));
  }
  next();
};

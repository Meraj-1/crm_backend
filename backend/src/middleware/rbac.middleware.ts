import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { UserRole } from '../constants';
import { AppError } from '../utils/AppError';

export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const hasRole = allowedRoles.includes(req.user.role as UserRole);
    if (!hasRole) {
      return next(
        new AppError(
          `Permission denied. Required role: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`,
          403
        )
      );
    }

    next();
  };
};

export const isOwnerOrAdmin = requireRoles(UserRole.OWNER, UserRole.ADMIN);
export const isManagerOrAbove = requireRoles(UserRole.OWNER, UserRole.ADMIN, UserRole.MANAGER);

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/token';
import { AppError } from '../utils/AppError';
import { User } from '../models/User';
import mongoose from 'mongoose';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    organizationId: string;
    name?: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please provide a Bearer token.', 401));
    }

    const decoded = verifyAccessToken(token);

    // Verify user still exists & is active
    const user = await User.findById(decoded.userId).select('isActive name email role organizationId');
    if (!user || !user.isActive) {
      return next(new AppError('User belonging to this token no longer exists or is deactivated.', 401));
    }

    req.user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId.toString(),
      name: user.name
    };

    next();
  } catch (error) {
    return next(new AppError('Invalid or expired authentication token', 401));
  }
};

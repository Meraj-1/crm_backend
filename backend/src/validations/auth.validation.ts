import { z } from 'zod';
import { UserRole, PlanTier } from '../constants';

export const registerSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
    plan: z.nativeEnum(PlanTier).optional(),
    currency: z.string().optional()
  })
};

export const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
};

export const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
  })
};

export const updateProfileSchema = {
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    avatar: z.string().url().or(z.string().length(0)).optional()
  })
};

export const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters')
  })
};

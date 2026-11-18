import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  changePasswordSchema
} from '../validations/auth.validation';

const router = Router();

router.post('/register', authRateLimiter, validateRequest(registerSchema), AuthController.register);
router.post('/login', authRateLimiter, validateRequest(loginSchema), AuthController.login);
router.post('/refresh-token', validateRequest(refreshTokenSchema), AuthController.refreshToken);
router.get('/me', authenticate, AuthController.getMe);
router.patch('/profile', authenticate, validateRequest(updateProfileSchema), AuthController.updateProfile);
router.post('/change-password', authenticate, validateRequest(changePasswordSchema), AuthController.changePassword);

export default router;

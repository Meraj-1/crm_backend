import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { Pipeline } from '../models/Pipeline';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token';
import { AppError } from '../utils/AppError';
import { sendSuccess, sendCreated } from '../utils/responseHandler';
import { UserRole, PlanTier } from '../constants';
import { emailService } from '../services/email.service';

export class AuthController {
  public static async register(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, email, password, organizationName, plan = PlanTier.STARTER, currency = 'INR' } = req.body;

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return next(new AppError('User with this email already exists', 400));
      }

      // Generate unique slug
      const baseSlug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Create Organization
      const org = await Organization.create({
        name: organizationName,
        slug,
        plan,
        currency,
        currencySymbol: currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : '$',
        maxUsers: plan === PlanTier.FREE ? 2 : plan === PlanTier.STARTER ? 5 : plan === PlanTier.PRO ? 15 : 100,
        maxLeads: plan === PlanTier.FREE ? 200 : plan === PlanTier.STARTER ? 2000 : plan === PlanTier.PRO ? 10000 : 100000
      });

      // 2. Create Default Pipeline
      const defaultPipeline = await Pipeline.create({
        organizationId: org._id,
        name: 'Sales Pipeline',
        isDefault: true,
        stages: [
          { id: 'stg-1', name: 'Discovery / Lead', order: 0, color: '#94a3b8', probability: 10 },
          { id: 'stg-2', name: 'Demo / Qualified', order: 1, color: '#3b82f6', probability: 30 },
          { id: 'stg-3', name: 'Proposal / Quote Sent', order: 2, color: '#8b5cf6', probability: 60 },
          { id: 'stg-4', name: 'Negotiation', order: 3, color: '#f59e0b', probability: 80 },
          { id: 'stg-5', name: 'Closed Won 🎉', order: 4, color: '#10b981', probability: 100 },
          { id: 'stg-6', name: 'Closed Lost ❌', order: 5, color: '#ef4444', probability: 0 }
        ]
      });

      org.settings.defaultPipelineId = defaultPipeline._id as any;
      await org.save();

      // 3. Create Admin/Owner User
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role: UserRole.OWNER,
        organizationId: org._id,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
      });

      // Send Welcome Email
      emailService.sendEmail({
        to: user.email,
        subject: 'Welcome to Nexus CRM!',
        html: emailService.getWelcomeTemplate(user.name, org.name)
      }).catch(err => console.error('Welcome email error:', err));

      const accessToken = generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        organizationId: org._id.toString()
      });

      const refreshToken = generateRefreshToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        organizationId: org._id.toString()
      });

      return sendCreated(res, {
        user,
        organization: org,
        accessToken,
        refreshToken
      }, 'Account registered successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user) {
        return next(new AppError('Invalid email or password credentials', 401));
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return next(new AppError('Invalid email or password credentials', 401));
      }

      if (!user.isActive) {
        return next(new AppError('Your account has been deactivated. Please contact your administrator.', 403));
      }

      user.lastLoginAt = new Date();
      await user.save();

      const organization = await Organization.findById(user.organizationId);

      const accessToken = generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        organizationId: user.organizationId.toString()
      });

      const refreshToken = generateRefreshToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        organizationId: user.organizationId.toString()
      });

      return sendSuccess(res, {
        user,
        organization,
        accessToken,
        refreshToken
      }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  public static async refreshToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const decoded = verifyRefreshToken(refreshToken);

      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return next(new AppError('User not found or deactivated', 401));
      }

      const newAccessToken = generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        organizationId: user.organizationId.toString()
      });

      return sendSuccess(res, { accessToken: newAccessToken }, 'Token refreshed');
    } catch (error) {
      return next(new AppError('Invalid or expired refresh token', 401));
    }
  }

  public static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.user!.userId);
      const organization = await Organization.findById(req.user!.organizationId);
      return sendSuccess(res, { user, organization }, 'User profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, phone, avatar } = req.body;
      const user = await User.findByIdAndUpdate(
        req.user!.userId,
        { ...(name && { name }), ...(phone !== undefined && { phone }), ...(avatar && { avatar }) },
        { new: true }
      );
      return sendSuccess(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user!.userId).select('+password');
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return next(new AppError('Incorrect current password', 400));
      }

      user.password = newPassword;
      await user.save();

      return sendSuccess(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}

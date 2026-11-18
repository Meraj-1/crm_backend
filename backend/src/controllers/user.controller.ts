import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { AppError } from '../utils/AppError';
import { sendSuccess, sendCreated } from '../utils/responseHandler';
import { UserRole } from '../constants';

export class UserController {
  public static async listTeam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const users = await User.find({ organizationId: req.user!.organizationId }).sort({ createdAt: -1 });
      return sendSuccess(res, users, 'Team members fetched');
    } catch (error) {
      next(error);
    }
  }

  public static async inviteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, email, password = 'Password@123', role = UserRole.SALES_REP, phone } = req.body;
      const orgId = req.user!.organizationId;

      // Check Plan Limit
      const [org, currentCount] = await Promise.all([
        Organization.findById(orgId),
        User.countDocuments({ organizationId: orgId })
      ]);

      if (org && currentCount >= org.maxUsers) {
        return next(
          new AppError(
            `User limit reached (${org.maxUsers} max users for ${org.plan} plan). Please upgrade your subscription plan.`,
            400
          )
        );
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return next(new AppError('User with this email already exists', 400));
      }

      const newUser = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role,
        phone,
        organizationId: orgId,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
      });

      return sendCreated(res, newUser, 'Team member added successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, role, phone, isActive } = req.body;

      const user = await User.findOneAndUpdate(
        { _id: id, organizationId: req.user!.organizationId },
        {
          ...(name && { name }),
          ...(role && { role }),
          ...(phone !== undefined && { phone }),
          ...(isActive !== undefined && { isActive })
        },
        { new: true }
      );

      if (!user) {
        return next(new AppError('User not found', 404));
      }

      return sendSuccess(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (id === req.user!.userId) {
        return next(new AppError('You cannot delete your own account', 400));
      }

      const user = await User.findOneAndDelete({
        _id: id,
        organizationId: req.user!.organizationId
      });

      if (!user) {
        return next(new AppError('User not found', 404));
      }

      return sendSuccess(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export class OrganizationController {
  public static async getOrganization(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const org = await Organization.findById(req.user!.organizationId);
      if (!org) {
        return next(new AppError('Organization not found', 404));
      }
      return sendSuccess(res, org);
    } catch (error) {
      next(error);
    }
  }

  public static async updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, logo, currency, currencySymbol, plan, settings } = req.body;

      const org = await Organization.findById(req.user!.organizationId);
      if (!org) {
        return next(new AppError('Organization not found', 404));
      }

      if (name) org.name = name;
      if (logo !== undefined) org.logo = logo;
      if (currency) org.currency = currency;
      if (currencySymbol) org.currencySymbol = currencySymbol;
      if (plan) {
        org.plan = plan;
        org.maxUsers = plan === 'FREE' ? 2 : plan === 'STARTER' ? 5 : plan === 'PRO' ? 15 : 100;
        org.maxLeads = plan === 'FREE' ? 200 : plan === 'STARTER' ? 2000 : plan === 'PRO' ? 10000 : 100000;
      }
      if (settings) {
        org.settings = { ...org.settings, ...settings };
      }

      await org.save();
      return sendSuccess(res, org, 'Organization settings updated');
    } catch (error) {
      next(error);
    }
  }
}

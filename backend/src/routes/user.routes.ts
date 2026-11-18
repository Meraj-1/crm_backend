import { Router } from 'express';
import { UserController, OrganizationController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isOwnerOrAdmin, isManagerOrAbove } from '../middleware/rbac.middleware';

export const userRoutes = Router();

userRoutes.use(authenticate);
userRoutes.get('/team', UserController.listTeam);
userRoutes.post('/invite', isManagerOrAbove, UserController.inviteUser);
userRoutes.patch('/:id', isManagerOrAbove, UserController.updateUser);
userRoutes.delete('/:id', isOwnerOrAdmin, UserController.deleteUser);

export const organizationRoutes = Router();

organizationRoutes.use(authenticate);
organizationRoutes.get('/', OrganizationController.getOrganization);
organizationRoutes.patch('/settings', isOwnerOrAdmin, OrganizationController.updateSettings);

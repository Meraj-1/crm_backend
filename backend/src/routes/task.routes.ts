import { Router } from 'express';
import { TaskController, ActivityController } from '../controllers/task.controller';
import { AutomationController, CommunicationController, AnalyticsController } from '../controllers/automation.controller';
import { ExportImportController } from '../controllers/exportImport.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createTaskSchema, updateTaskSchema } from '../validations/task.validation';
import { createAutomationSchema, updateAutomationSchema, sendCommunicationSchema } from '../validations/automation.validation';

// Tasks Router
export const taskRoutes = Router();
taskRoutes.use(authenticate);
taskRoutes.get('/', TaskController.listTasks);
taskRoutes.post('/', validateRequest(createTaskSchema), TaskController.createTask);
taskRoutes.patch('/:id', validateRequest(updateTaskSchema), TaskController.updateTask);
taskRoutes.patch('/:id/toggle', TaskController.toggleTaskStatus);
taskRoutes.delete('/:id', TaskController.deleteTask);

// Activity Router
export const activityRoutes = Router();
activityRoutes.use(authenticate);
activityRoutes.get('/', ActivityController.listActivities);
activityRoutes.post('/log', ActivityController.logActivity);

// Automation Router
export const automationRoutes = Router();
automationRoutes.use(authenticate);
automationRoutes.get('/', AutomationController.listRules);
automationRoutes.post('/', validateRequest(createAutomationSchema), AutomationController.createRule);
automationRoutes.patch('/:id/toggle', AutomationController.toggleActive);
automationRoutes.delete('/:id', AutomationController.deleteRule);

// Communication Router
export const communicationRoutes = Router();
communicationRoutes.use(authenticate);
communicationRoutes.get('/history', CommunicationController.listHistory);
communicationRoutes.post('/send', validateRequest(sendCommunicationSchema), CommunicationController.sendMessage);

// Analytics Router
export const analyticsRoutes = Router();
analyticsRoutes.use(authenticate);
analyticsRoutes.get('/dashboard', AnalyticsController.getDashboardStats);

// Export & Import Router
export const exportRoutes = Router();
exportRoutes.use(authenticate);
exportRoutes.get('/leads/csv', ExportImportController.exportLeads);
exportRoutes.get('/contacts/csv', ExportImportController.exportContacts);

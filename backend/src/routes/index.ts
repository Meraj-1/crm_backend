import { Router } from 'express';
import authRoutes from './auth.routes';
import { userRoutes, organizationRoutes } from './user.routes';
import leadRoutes from './lead.routes';
import dealRoutes from './deal.routes';
import pipelineRoutes from './pipeline.routes';
import { contactRoutes, companyRoutes } from './contact.routes';
import {
  taskRoutes,
  activityRoutes,
  automationRoutes,
  communicationRoutes,
  analyticsRoutes,
  exportRoutes
} from './task.routes';
import aiRoutes from './ai.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    service: 'Nexus CRM Backend API'
  });
});

// Mount modular sub-routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/organizations', organizationRoutes);
router.use('/leads', leadRoutes);
router.use('/deals', dealRoutes);
router.use('/pipelines', pipelineRoutes);
router.use('/contacts', contactRoutes);
router.use('/companies', companyRoutes);
router.use('/tasks', taskRoutes);
router.use('/activities', activityRoutes);
router.use('/automations', automationRoutes);
router.use('/communications', communicationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/export', exportRoutes);
router.use('/ai', aiRoutes);

export default router;

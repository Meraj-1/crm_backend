import { Router } from 'express';
import { LeadController } from '../controllers/lead.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  createLeadSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
  convertLeadSchema
} from '../validations/lead.validation';

const router = Router();

router.use(authenticate);

router.get('/', LeadController.listLeads);
router.post('/', validateRequest(createLeadSchema), LeadController.createLead);
router.get('/:id', LeadController.getLeadById);
router.patch('/:id', validateRequest(updateLeadSchema), LeadController.updateLead);
router.patch('/:id/status', validateRequest(updateLeadStatusSchema), LeadController.updateLeadStatus);
router.post('/:id/convert', validateRequest(convertLeadSchema), LeadController.convertLead);
router.delete('/:id', LeadController.deleteLead);

export default router;

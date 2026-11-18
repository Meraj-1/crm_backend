import { Router } from 'express';
import { PipelineController } from '../controllers/deal.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isOwnerOrAdmin } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createPipelineSchema, updatePipelineSchema } from '../validations/pipeline.validation';

const router = Router();

router.use(authenticate);

router.get('/', PipelineController.listPipelines);
router.post('/', isOwnerOrAdmin, validateRequest(createPipelineSchema), PipelineController.createPipeline);
router.patch('/:id', isOwnerOrAdmin, validateRequest(updatePipelineSchema), PipelineController.updatePipeline);

export default router;

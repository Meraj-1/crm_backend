import { Router } from 'express';
import { DealController } from '../controllers/deal.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createDealSchema, updateDealSchema, moveDealStageSchema } from '../validations/deal.validation';

const router = Router();

router.use(authenticate);

router.get('/', DealController.listDeals);
router.post('/', validateRequest(createDealSchema), DealController.createDeal);
router.get('/:id', DealController.getDealById);
router.patch('/:id', validateRequest(updateDealSchema), DealController.updateDeal);
router.post('/:id/stage', validateRequest(moveDealStageSchema), DealController.moveStage);
router.delete('/:id', DealController.deleteDeal);

export default router;

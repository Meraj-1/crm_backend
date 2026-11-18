import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Deal } from '../models/Deal';
import { Pipeline } from '../models/Pipeline';
import { Activity } from '../models/Activity';
import { AppError } from '../utils/AppError';
import { sendSuccess, sendCreated } from '../utils/responseHandler';
import { AutomationEngine } from '../services/automationEngine.service';
import { TriggerType, EntityType, ActivityType } from '../constants';
import { emailService } from '../services/email.service';

export class DealController {
  public static async listDeals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { pipelineId, stageId, priority, assignedToId, search } = req.query;
      const orgId = req.user!.organizationId;

      const filter: any = { organizationId: orgId };
      if (pipelineId) filter.pipelineId = pipelineId;
      if (stageId) filter.stageId = stageId;
      if (priority) filter.priority = priority;
      if (assignedToId) filter.assignedToId = assignedToId;

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { contactName: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } }
        ];
      }

      const deals = await Deal.find(filter)
        .sort({ updatedAt: -1 })
        .populate('assignedToId', 'name email avatar');

      return sendSuccess(res, deals, 'Deals fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async getDealById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const orgId = req.user!.organizationId;

      const deal = await Deal.findOne({ _id: id, organizationId: orgId })
        .populate('assignedToId', 'name email avatar')
        .populate('contactId');

      if (!deal) {
        return next(new AppError('Deal not found', 404));
      }

      const activities = await Activity.find({
        organizationId: orgId,
        entityId: deal._id
      }).sort({ createdAt: -1 });

      return sendSuccess(res, { deal, activities });
    } catch (error) {
      next(error);
    }
  }

  public static async createDeal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const dealData = req.body;
      const orgId = req.user!.organizationId;

      const newDeal = await Deal.create({
        ...dealData,
        organizationId: orgId,
        assignedToId: dealData.assignedToId || req.user!.userId
      });

      await Activity.create({
        organizationId: orgId,
        type: ActivityType.DEAL_CREATED,
        title: 'New Deal Created',
        description: `Deal "${newDeal.title}" created with value ${newDeal.currency} ${newDeal.value}`,
        entityType: EntityType.DEAL,
        entityId: newDeal._id,
        entityName: newDeal.title,
        performedById: req.user!.userId,
        performedByName: req.user!.name || 'System'
      });

      // High value deal trigger check (> 100,000)
      if (newDeal.value >= 100000) {
        AutomationEngine.evaluateAndExecute({
          organizationId: orgId,
          trigger: TriggerType.HIGH_VALUE_DEAL,
          entityType: EntityType.DEAL,
          entityId: newDeal._id,
          entityData: newDeal.toObject(),
          performedByUserId: req.user!.userId,
          performedByName: req.user!.name
        });
      }

      return sendCreated(res, newDeal, 'Deal created successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async updateDeal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const orgId = req.user!.organizationId;
      const updates = req.body;

      const deal = await Deal.findOneAndUpdate(
        { _id: id, organizationId: orgId },
        updates,
        { new: true }
      );

      if (!deal) {
        return next(new AppError('Deal not found', 404));
      }

      return sendSuccess(res, deal, 'Deal updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async moveStage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { stageId } = req.body;
      const orgId = req.user!.organizationId;

      const deal = await Deal.findOne({ _id: id, organizationId: orgId });
      if (!deal) {
        return next(new AppError('Deal not found', 404));
      }

      const pipeline = await Pipeline.findById(deal.pipelineId);
      const targetStage = pipeline?.stages.find(s => s.id === stageId);

      const oldStageId = deal.stageId;
      deal.stageId = stageId;
      if (targetStage) {
        deal.probability = targetStage.probability;
      }
      await deal.save();

      // Log Activity
      await Activity.create({
        organizationId: orgId,
        type: ActivityType.STAGE_CHANGE,
        title: `Deal Stage Moved to ${targetStage?.name || stageId}`,
        description: `Deal "${deal.title}" moved stage`,
        entityType: EntityType.DEAL,
        entityId: deal._id,
        entityName: deal.title,
        performedById: req.user!.userId,
        performedByName: req.user!.name || 'System'
      });

      // Automation Trigger
      AutomationEngine.evaluateAndExecute({
        organizationId: orgId,
        trigger: TriggerType.DEAL_STAGE_CHANGED,
        entityType: EntityType.DEAL,
        entityId: deal._id,
        entityData: deal.toObject(),
        performedByUserId: req.user!.userId,
        performedByName: req.user!.name
      });

      // If Won (probability 100 or stage name won)
      if (targetStage && (targetStage.probability === 100 || targetStage.id.includes('won'))) {
        AutomationEngine.evaluateAndExecute({
          organizationId: orgId,
          trigger: TriggerType.DEAL_WON,
          entityType: EntityType.DEAL,
          entityId: deal._id,
          entityData: deal.toObject(),
          performedByUserId: req.user!.userId,
          performedByName: req.user!.name
        });

        // Broadcast celebration notification
        emailService.sendEmail({
          to: req.user!.email,
          subject: `🎉 Deal Won: ${deal.title}!`,
          html: emailService.getDealWonTemplate(deal.title, deal.value, deal.currency, req.user!.name || 'Rep')
        }).catch(err => console.error('Deal won email notification error:', err));
      }

      return sendSuccess(res, deal, 'Deal moved to stage successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async deleteDeal(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deal = await Deal.findOneAndDelete({
        _id: id,
        organizationId: req.user!.organizationId
      });

      if (!deal) {
        return next(new AppError('Deal not found', 404));
      }

      return sendSuccess(res, null, 'Deal deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export class PipelineController {
  public static async listPipelines(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pipelines = await Pipeline.find({ organizationId: req.user!.organizationId });
      return sendSuccess(res, pipelines, 'Pipelines retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async createPipeline(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, stages, isDefault = false } = req.body;
      const orgId = req.user!.organizationId;

      if (isDefault) {
        await Pipeline.updateMany({ organizationId: orgId }, { isDefault: false });
      }

      const pipeline = await Pipeline.create({
        organizationId: orgId,
        name,
        isDefault,
        stages
      });

      return sendCreated(res, pipeline, 'Pipeline created');
    } catch (error) {
      next(error);
    }
  }

  public static async updatePipeline(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const pipeline = await Pipeline.findOneAndUpdate(
        { _id: id, organizationId: req.user!.organizationId },
        updates,
        { new: true }
      );

      if (!pipeline) {
        return next(new AppError('Pipeline not found', 404));
      }

      return sendSuccess(res, pipeline, 'Pipeline updated');
    } catch (error) {
      next(error);
    }
  }
}

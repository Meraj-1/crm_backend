import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Lead } from '../models/Lead';
import { Contact } from '../models/Contact';
import { Deal } from '../models/Deal';
import { Pipeline } from '../models/Pipeline';
import { Activity } from '../models/Activity';
import { AppError } from '../utils/AppError';
import { sendSuccess, sendCreated } from '../utils/responseHandler';
import { AutomationEngine } from '../services/automationEngine.service';
import { TriggerType, EntityType, ActivityType, LeadStatus } from '../constants';
import mongoose from 'mongoose';

export class LeadController {
  public static async listLeads(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const {
        search,
        status,
        source,
        priority,
        assignedToId,
        page = 1,
        limit = 100,
        sortBy = 'createdAt',
        order = 'desc'
      } = req.query;

      const filter: any = { organizationId: req.user!.organizationId };

      if (status) filter.status = status;
      if (source) filter.source = source;
      if (priority) filter.priority = priority;
      if (assignedToId) filter.assignedToId = assignedToId;

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const sortDirection = order === 'asc' ? 1 : -1;

      const [leads, total] = await Promise.all([
        Lead.find(filter)
          .sort({ [sortBy as string]: sortDirection })
          .skip(skip)
          .limit(Number(limit))
          .populate('assignedToId', 'name email avatar'),
        Lead.countDocuments(filter)
      ]);

      return sendSuccess(res, leads, 'Leads retrieved successfully', 200, {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getLeadById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const lead = await Lead.findOne({
        _id: id,
        organizationId: req.user!.organizationId
      }).populate('assignedToId', 'name email avatar');

      if (!lead) {
        return next(new AppError('Lead not found', 404));
      }

      const activities = await Activity.find({
        organizationId: req.user!.organizationId,
        entityId: lead._id
      }).sort({ createdAt: -1 });

      return sendSuccess(res, { lead, activities });
    } catch (error) {
      next(error);
    }
  }

  public static async createLead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const leadData = req.body;
      const orgId = req.user!.organizationId;

      const newLead = await Lead.create({
        ...leadData,
        organizationId: orgId,
        assignedToId: leadData.assignedToId || req.user!.userId
      });

      // Log Activity
      await Activity.create({
        organizationId: orgId,
        type: ActivityType.LEAD_CREATED,
        title: 'New Lead Created',
        description: `Lead ${newLead.name} (${newLead.company || 'Individual'}) was added via ${newLead.source}`,
        entityType: EntityType.LEAD,
        entityId: newLead._id,
        entityName: newLead.name,
        performedById: req.user!.userId,
        performedByName: req.user!.name || 'System'
      });

      // Automation Trigger
      AutomationEngine.evaluateAndExecute({
        organizationId: orgId,
        trigger: TriggerType.LEAD_CREATED,
        entityType: EntityType.LEAD,
        entityId: newLead._id,
        entityData: newLead.toObject(),
        performedByUserId: req.user!.userId,
        performedByName: req.user!.name
      });

      return sendCreated(res, newLead, 'Lead created successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async updateLead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const orgId = req.user!.organizationId;
      const updates = req.body;

      const lead = await Lead.findOne({ _id: id, organizationId: orgId });
      if (!lead) {
        return next(new AppError('Lead not found', 404));
      }

      const oldStatus = lead.status;
      Object.assign(lead, updates);
      await lead.save();

      // Trigger status automation if changed
      if (updates.status && updates.status !== oldStatus) {
        await Activity.create({
          organizationId: orgId,
          type: ActivityType.STAGE_CHANGE,
          title: `Lead Status Changed to ${lead.status}`,
          description: `Lead status updated from ${oldStatus} to ${lead.status}`,
          entityType: EntityType.LEAD,
          entityId: lead._id,
          entityName: lead.name,
          performedById: req.user!.userId,
          performedByName: req.user!.name || 'System'
        });

        AutomationEngine.evaluateAndExecute({
          organizationId: orgId,
          trigger: TriggerType.LEAD_STATUS_CHANGED,
          entityType: EntityType.LEAD,
          entityId: lead._id,
          entityData: lead.toObject(),
          performedByUserId: req.user!.userId,
          performedByName: req.user!.name
        });
      }

      return sendSuccess(res, lead, 'Lead updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async updateLeadStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const orgId = req.user!.organizationId;

      const lead = await Lead.findOne({ _id: id, organizationId: orgId });
      if (!lead) {
        return next(new AppError('Lead not found', 404));
      }

      const oldStatus = lead.status;
      lead.status = status;
      lead.lastContactedAt = new Date();
      await lead.save();

      await Activity.create({
        organizationId: orgId,
        type: ActivityType.STAGE_CHANGE,
        title: `Lead Status Changed to ${status}`,
        description: `Lead status updated from ${oldStatus} to ${status}`,
        entityType: EntityType.LEAD,
        entityId: lead._id,
        entityName: lead.name,
        performedById: req.user!.userId,
        performedByName: req.user!.name || 'System'
      });

      AutomationEngine.evaluateAndExecute({
        organizationId: orgId,
        trigger: TriggerType.LEAD_STATUS_CHANGED,
        entityType: EntityType.LEAD,
        entityId: lead._id,
        entityData: lead.toObject(),
        performedByUserId: req.user!.userId,
        performedByName: req.user!.name
      });

      return sendSuccess(res, lead, 'Lead status updated');
    } catch (error) {
      next(error);
    }
  }

  public static async deleteLead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const lead = await Lead.findOneAndDelete({
        _id: id,
        organizationId: req.user!.organizationId
      });

      if (!lead) {
        return next(new AppError('Lead not found', 404));
      }

      return sendSuccess(res, null, 'Lead deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async convertLead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { createDeal = true, dealTitle, dealValue, pipelineId, stageId } = req.body;
      const orgId = req.user!.organizationId;

      const lead = await Lead.findOne({ _id: id, organizationId: orgId });
      if (!lead) {
        return next(new AppError('Lead not found', 404));
      }

      // 1. Create or Find Contact
      let contact = await Contact.findOne({ email: lead.email, organizationId: orgId });
      if (!contact) {
        contact = await Contact.create({
          organizationId: orgId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          companyName: lead.company || '',
          designation: lead.title || 'Contact',
          leadSource: lead.source,
          totalDealsValue: lead.estimatedValue || 0
        });
      }

      let createdDeal = null;
      if (createDeal) {
        let pipId = pipelineId;
        let stgId = stageId;

        if (!pipId || !stgId) {
          const defaultPip = await Pipeline.findOne({ organizationId: orgId, isDefault: true });
          pipId = defaultPip?._id;
          stgId = defaultPip?.stages[0]?.id || 'stg-1';
        }

        createdDeal = await Deal.create({
          organizationId: orgId,
          pipelineId: pipId,
          stageId: stgId,
          title: dealTitle || `${lead.name} - Deal`,
          value: dealValue !== undefined ? dealValue : lead.estimatedValue,
          contactId: contact._id,
          contactName: contact.name,
          companyName: lead.company || '',
          assignedToId: lead.assignedToId || req.user!.userId,
          priority: lead.priority,
          probability: 20
        });
      }

      // Mark Lead as Converted & Won
      lead.status = LeadStatus.WON;
      lead.isConverted = true;
      lead.convertedContactId = contact._id as any;
      if (createdDeal) {
        lead.convertedDealId = createdDeal._id as any;
      }
      await lead.save();

      await Activity.create({
        organizationId: orgId,
        type: ActivityType.STAGE_CHANGE,
        title: 'Lead Converted Successfully',
        description: `Lead converted to Contact "${contact.name}"${createdDeal ? ` & Deal "${createdDeal.title}"` : ''}`,
        entityType: EntityType.LEAD,
        entityId: lead._id,
        entityName: lead.name,
        performedById: req.user!.userId,
        performedByName: req.user!.name || 'System'
      });

      return sendSuccess(res, { lead, contact, deal: createdDeal }, 'Lead converted successfully');
    } catch (error) {
      next(error);
    }
  }
}

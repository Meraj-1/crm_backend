import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AIConversation, AILeadScore, AISentiment, AIUsageLog } from '../models/AI';
import { Lead } from '../models/Lead';
import { Deal } from '../models/Deal';
import { Task } from '../models/Task';
import { Pipeline } from '../models/Pipeline';
import { AIService } from '../services/ai.service';
import { AppError } from '../utils/AppError';
import { sendSuccess, sendCreated } from '../utils/responseHandler';
import { ENV } from '../config/env';

export class AIController {
  private static async enforceDailyLimit(req: AuthenticatedRequest) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const count = await AIUsageLog.countDocuments({
      organizationId: req.user!.organizationId,
      userId: req.user!.userId,
      createdAt: { $gte: start }
    });
    if (count >= ENV.AI_DAILY_LIMIT) {
      throw new AppError('Your daily AI usage limit has been reached.', 429);
    }
  }

  public static async chat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await AIController.enforceDailyLimit(req);
      let conversation = req.body.conversationId
        ? await AIConversation.findOne({
            _id: req.body.conversationId,
            organizationId: req.user!.organizationId,
            userId: req.user!.userId
          })
        : null;
      if (!conversation) {
        conversation = await AIConversation.create({
          organizationId: req.user!.organizationId,
          userId: req.user!.userId,
          title: req.body.message.slice(0, 60)
        });
      }

      conversation.messages.push({ role: 'user', content: req.body.message, createdAt: new Date() });
      const answer = await AIService.chatContext(req.user!, req.body.message);
      conversation.messages.push({ role: 'assistant', content: answer, createdAt: new Date() });
      await conversation.save();

      return sendSuccess(res, { conversationId: conversation._id.toString(), answer, messages: conversation.messages });
    } catch (error) {
      next(error);
    }
  }

  public static async listConversations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, Number(req.query.page || 1));
      const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
      const filter = { organizationId: req.user!.organizationId, userId: req.user!.userId };
      const [items, total] = await Promise.all([
        AIConversation.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit)
          .select('title messages updatedAt createdAt'),
        AIConversation.countDocuments(filter)
      ]);
      return sendSuccess(res, items, 'Conversations retrieved', 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
    } catch (error) {
      next(error);
    }
  }

  public static async getConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const conversation = await AIConversation.findOne({
        _id: req.params.id,
        organizationId: req.user!.organizationId,
        userId: req.user!.userId
      });
      if (!conversation) return next(new AppError('Conversation not found', 404));
      return sendSuccess(res, conversation);
    } catch (error) {
      next(error);
    }
  }

  public static async deleteConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const deleted = await AIConversation.findOneAndDelete({
        _id: req.params.id,
        organizationId: req.user!.organizationId,
        userId: req.user!.userId
      });
      if (!deleted) return next(new AppError('Conversation not found', 404));
      return sendSuccess(res, null, 'Conversation deleted');
    } catch (error) {
      next(error);
    }
  }

  public static async scoreLead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await AIController.enforceDailyLimit(req);
      const result = await AIService.leadScore(req.user!, req.params.leadId);
      const lead = await Lead.findOne({ _id: req.params.leadId, organizationId: req.user!.organizationId });
      if (!lead) return next(new AppError('Lead not found', 404));
      lead.score = result.score;
      await lead.save();
      const history = await AILeadScore.create({
        organizationId: req.user!.organizationId,
        leadId: lead._id,
        ...result,
        createdById: req.user!.userId
      });
      return sendCreated(res, history);
    } catch (error) {
      next(error);
    }
  }

  public static async getLeadScore(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const history = await AILeadScore.find({
        organizationId: req.user!.organizationId,
        leadId: req.params.leadId
      }).sort({ createdAt: -1 }).limit(20);
      return sendSuccess(res, history);
    } catch (error) {
      next(error);
    }
  }

  public static async insights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orgId = new mongoose.Types.ObjectId(req.user!.organizationId);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const [leads, deals, tasks, pipeline] = await Promise.all([
        Lead.find({ organizationId: orgId }).lean(),
        Deal.find({ organizationId: orgId }).lean(),
        Task.find({ organizationId: orgId }).lean(),
        Pipeline.findOne({ organizationId: orgId, isDefault: true }).lean()
      ]);
      const wonDeals = deals.filter(deal => deal.stageId.toLowerCase().includes('won') || deal.probability === 100);
      const lostDeals = deals.filter(deal => deal.stageId.toLowerCase().includes('lost'));
      const activeDeals = deals.filter(deal => !deal.stageId.toLowerCase().includes('won') && !deal.stageId.toLowerCase().includes('lost'));
      const monthWonRevenue = wonDeals.filter(deal => deal.createdAt >= monthStart).reduce((sum, deal) => sum + deal.value, 0);
      const hotLeads = leads.filter(lead => (lead.score || 0) >= 80).length;
      const coldLeads = leads.filter(lead => (lead.score || 0) < 40).length;
      const withoutFollowUp = leads.filter(lead => !lead.lastContactedAt).length;
      const closedLeadCount = leads.filter(lead => lead.status === 'WON' || lead.status === 'LOST').length;
      const wonLeadCount = leads.filter(lead => lead.status === 'WON').length;

      const metrics = {
        totalRevenue: wonDeals.reduce((sum, deal) => sum + deal.value, 0),
        monthlyRevenue: monthWonRevenue,
        activeDeals: activeDeals.length,
        lostDeals: lostDeals.length,
        pipelineValue: activeDeals.reduce((sum, deal) => sum + deal.value, 0),
        totalLeads: leads.length,
        newLeads: leads.filter(lead => lead.status === 'NEW').length,
        hotLeads,
        coldLeads,
        leadConversionRate: closedLeadCount ? Math.round((wonLeadCount / closedLeadCount) * 100) : 0,
        leadsWithoutFollowUp: withoutFollowUp,
        pendingTasks: tasks.filter(task => task.status !== 'COMPLETED').length
      };

      let summary = 'No AI summary was generated.';
      if (ENV.OPENAI_API_KEY) {
        await AIController.enforceDailyLimit(req);
        summary = await AIService.complete(
          req.user!,
          'insights',
          'Interpret supplied CRM metrics. Do not calculate or invent figures. Give 3-5 concise actionable observations.',
          JSON.stringify(metrics)
        );
      }
      return sendSuccess(res, { metrics, summary, pipelineStages: pipeline?.stages || [] });
    } catch (error) {
      next(error);
    }
  }

  public static async generateMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await AIController.enforceDailyLimit(req);
      const result = await AIService.generateMessage(req.user!, req.body);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public static async analyzeSentiment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await AIController.enforceDailyLimit(req);
      const result = await AIService.sentiment(req.user!, req.body);
      const record = await AISentiment.create({
        organizationId: req.user!.organizationId,
        entityType: req.body.entityType,
        entityId: req.body.entityId,
        ...result,
        sourceText: req.body.text,
        createdById: req.user!.userId
      });
      return sendCreated(res, record);
    } catch (error) {
      next(error);
    }
  }

  public static async voiceSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!ENV.OPENAI_API_KEY) return next(new AppError('OPENAI_API_KEY is not configured.', 503));
    return sendSuccess(res, {
      model: ENV.OPENAI_REALTIME_MODEL,
      instructions: 'Use only the CRM context and authorized tools supplied by the server. Never expose credentials.'
    }, 'Voice session configuration is available');
  }
}

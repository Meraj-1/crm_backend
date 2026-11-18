import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AutomationRule } from '../models/AutomationRule';
import { CommunicationLog } from '../models/CommunicationLog';
import { Activity } from '../models/Activity';
import { emailService } from '../services/email.service';
import { AnalyticsService } from '../services/analytics.service';
import { AppError } from '../utils/AppError';
import { sendSuccess, sendCreated } from '../utils/responseHandler';
import { CommunicationChannel, ActivityType } from '../constants';

export class AutomationController {
  public static async listRules(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const rules = await AutomationRule.find({ organizationId: req.user!.organizationId }).sort({ createdAt: -1 });
      return sendSuccess(res, rules, 'Automation rules retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async createRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ruleData = req.body;
      const rule = await AutomationRule.create({
        ...ruleData,
        organizationId: req.user!.organizationId,
        createdById: req.user!.userId
      });
      return sendCreated(res, rule, 'Automation rule created');
    } catch (error) {
      next(error);
    }
  }

  public static async toggleActive(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const rule = await AutomationRule.findOne({ _id: id, organizationId: req.user!.organizationId });
      if (!rule) {
        return next(new AppError('Rule not found', 404));
      }
      rule.isActive = !rule.isActive;
      await rule.save();
      return sendSuccess(res, rule, `Automation ${rule.isActive ? 'activated' : 'paused'}`);
    } catch (error) {
      next(error);
    }
  }

  public static async deleteRule(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const rule = await AutomationRule.findOneAndDelete({ _id: id, organizationId: req.user!.organizationId });
      if (!rule) {
        return next(new AppError('Rule not found', 404));
      }
      return sendSuccess(res, null, 'Automation rule deleted');
    } catch (error) {
      next(error);
    }
  }
}

export class CommunicationController {
  public static async listHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId, channel } = req.query;
      const filter: any = { organizationId: req.user!.organizationId };
      if (entityType) filter.entityType = entityType;
      if (entityId) filter.entityId = entityId;
      if (channel) filter.channel = channel;

      const logs = await CommunicationLog.find(filter).sort({ sentAt: -1 });
      return sendSuccess(res, logs, 'Communication history retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { channel, recipient, subject, body, entityType, entityId, entityName } = req.body;
      const orgId = req.user!.organizationId;

      let sendResult: { success: boolean; messageId?: string } = { success: true, messageId: `msg-${Date.now()}` };

      if (channel === CommunicationChannel.EMAIL) {
        sendResult = await emailService.sendEmail({
          to: recipient,
          subject: subject || 'Message from Nexus CRM',
          html: `<div style="font-family: Arial; padding: 15px;">${body}</div>`
        });
      } else if (channel === CommunicationChannel.WHATSAPP) {
        // WhatsApp delivery is not enabled until a real provider is configured.
        sendResult = { success: false };
      } else {
        sendResult = { success: false };
      }

      const log = await CommunicationLog.create({
        organizationId: orgId,
        channel,
        recipient,
        sender: req.user!.email,
        subject,
        body,
        status: sendResult.success ? 'SENT' : 'FAILED',
        entityType,
        entityId,
        entityName,
        loggedById: req.user!.userId,
        loggedByName: req.user!.name || 'Rep',
        externalMessageId: sendResult.messageId
      });

      // Also register as an Activity
      await Activity.create({
        organizationId: orgId,
        type: channel === CommunicationChannel.EMAIL ? ActivityType.EMAIL : channel === CommunicationChannel.WHATSAPP ? ActivityType.WHATSAPP : ActivityType.CALL,
        title: `${channel} Sent: ${subject || recipient}`,
        description: body.substring(0, 120),
        entityType,
        entityId,
        entityName,
        performedById: req.user!.userId,
        performedByName: req.user!.name || 'System'
      });

      return sendCreated(res, log, `${channel} sent and logged successfully`);
    } catch (error) {
      next(error);
    }
  }
}

export class AnalyticsController {
  public static async getDashboardStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const metrics = await AnalyticsService.getDashboardMetrics(req.user!.organizationId);
      return sendSuccess(res, metrics, 'Dashboard analytics fetched');
    } catch (error) {
      next(error);
    }
  }
}

import mongoose from 'mongoose';
import { AutomationRule } from '../models/AutomationRule';
import { Task } from '../models/Task';
import { Activity } from '../models/Activity';
import { User } from '../models/User';
import { emailService } from './email.service';
import { TriggerType, ActionType, Priority, TaskStatus, EntityType, ActivityType } from '../constants';

interface TriggerContext {
  organizationId: mongoose.Types.ObjectId | string;
  trigger: TriggerType;
  entityType: EntityType;
  entityId: mongoose.Types.ObjectId | string;
  entityData: any;
  performedByUserId?: mongoose.Types.ObjectId | string;
  performedByName?: string;
}

export class AutomationEngine {
  public static async evaluateAndExecute(context: TriggerContext): Promise<void> {
    try {
      const activeRules = await AutomationRule.find({
        organizationId: context.organizationId,
        trigger: context.trigger,
        isActive: true
      });

      if (!activeRules || activeRules.length === 0) {
        return;
      }

      for (const rule of activeRules) {
        try {
          // Check condition if present
          let conditionPassed = true;
          if (rule.triggerCondition) {
            try {
              const cond = JSON.parse(rule.triggerCondition);
              for (const [key, expectedValue] of Object.entries(cond)) {
                if (context.entityData[key] !== expectedValue) {
                  conditionPassed = false;
                  break;
                }
              }
            } catch (e) {
              // Plain string comparison fallback
              if (!JSON.stringify(context.entityData).includes(rule.triggerCondition)) {
                conditionPassed = false;
              }
            }
          }

          if (!conditionPassed) continue;

          // Execute configured action
          await AutomationEngine.executeAction(rule, context);

          // Update execution stats
          rule.executionCount += 1;
          rule.lastExecutedAt = new Date();
          await rule.save();
        } catch (ruleError) {
          console.error(`[AutomationEngine] Failed to execute rule ${rule.name}:`, ruleError);
        }
      }
    } catch (error) {
      console.error('[AutomationEngine] Trigger evaluation error:', error);
    }
  }

  private static async executeAction(rule: any, context: TriggerContext) {
    let payload: any = {};
    try {
      payload = JSON.parse(rule.actionPayload || '{}');
    } catch {
      payload = {};
    }

    switch (rule.action) {
      case ActionType.CREATE_TASK: {
        const dueDate = new Date();
        const delayDays = payload.delayDays || 1;
        dueDate.setDate(dueDate.getDate() + delayDays);

        await Task.create({
          organizationId: context.organizationId,
          title: payload.title || `Follow up on ${context.entityData.name || context.entityData.title}`,
          description: payload.description || `Automated task triggered by rule: ${rule.name}`,
          dueDate,
          priority: payload.priority || Priority.HIGH,
          status: TaskStatus.TODO,
          assignedToId: context.entityData.assignedToId || context.performedByUserId,
          relatedToType: context.entityType,
          relatedToId: context.entityId,
          relatedToName: context.entityData.name || context.entityData.title
        });

        await Activity.create({
          organizationId: context.organizationId,
          type: ActivityType.NOTE,
          title: 'Automated Task Created',
          description: `Automation rule "${rule.name}" created a follow-up task.`,
          entityType: context.entityType,
          entityId: context.entityId,
          entityName: context.entityData.name || context.entityData.title,
          performedByName: 'Automation Engine'
        });
        break;
      }

      case ActionType.SEND_EMAIL: {
        const recipientEmail = context.entityData.email || payload.targetEmail;
        if (recipientEmail) {
          const emailHtml = `
            <div style="font-family: sans-serif; padding: 20px;">
              <h3>${payload.subject || 'Automated CRM Update'}</h3>
              <p>${payload.body || 'This is an automated notification from your CRM workflow.'}</p>
            </div>
          `;
          await emailService.sendEmail({
            to: recipientEmail,
            subject: payload.subject || 'Automated CRM Notification',
            html: emailHtml
          });
        }
        break;
      }

      case ActionType.NOTIFY_TEAM: {
        // Find managers and admins
        const teamMembers = await User.find({
          organizationId: context.organizationId,
          role: { $in: ['OWNER', 'ADMIN', 'MANAGER'] }
        });

        for (const member of teamMembers) {
          await emailService.sendEmail({
            to: member.email,
            subject: `[CRM Alert] ${rule.name}`,
            html: `
              <p>Hello ${member.name},</p>
              <p>Workflow Rule <strong>"${rule.name}"</strong> was triggered for <strong>${context.entityData.name || context.entityData.title}</strong>.</p>
            `
          });
        }
        break;
      }

      default:
        console.log(`[AutomationEngine] Unhandled action type: ${rule.action}`);
    }
  }
}

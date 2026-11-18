import mongoose, { Document, Schema } from 'mongoose';
import { TriggerType, ActionType } from '../constants';

export interface IAutomationRule extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  trigger: TriggerType;
  triggerCondition?: string;
  action: ActionType;
  actionPayload: string;
  isActive: boolean;
  executionCount: number;
  lastExecutedAt?: Date;
  createdById?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const automationRuleSchema = new Schema<IAutomationRule>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    trigger: {
      type: String,
      enum: Object.values(TriggerType),
      required: true
    },
    triggerCondition: { type: String, default: '' },
    action: {
      type: String,
      enum: Object.values(ActionType),
      required: true
    },
    actionPayload: { type: String, default: '{}' },
    isActive: { type: Boolean, default: true },
    executionCount: { type: Number, default: 0 },
    lastExecutedAt: { type: Date },
    createdById: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

automationRuleSchema.index({ organizationId: 1, trigger: 1, isActive: 1 });

export const AutomationRule = mongoose.model<IAutomationRule>('AutomationRule', automationRuleSchema);

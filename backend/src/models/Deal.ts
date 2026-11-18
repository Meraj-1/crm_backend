import mongoose, { Document, Schema } from 'mongoose';
import { Priority } from '../constants';

export interface IDeal extends Document {
  organizationId: mongoose.Types.ObjectId;
  pipelineId: mongoose.Types.ObjectId;
  stageId: string;
  title: string;
  value: number;
  currency: string;
  contactId?: mongoose.Types.ObjectId;
  contactName: string;
  companyName: string;
  companyId?: mongoose.Types.ObjectId;
  assignedToId?: mongoose.Types.ObjectId;
  priority: Priority;
  expectedCloseDate: Date;
  probability: number;
  tags: string[];
  lossReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const dealSchema = new Schema<IDeal>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    pipelineId: {
      type: Schema.Types.ObjectId,
      ref: 'Pipeline',
      required: true,
      index: true
    },
    stageId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    value: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    contactName: { type: String, default: '', trim: true },
    companyName: { type: String, default: '', trim: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
    assignedToId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    priority: {
      type: String,
      enum: Object.values(Priority),
      default: Priority.MEDIUM
    },
    expectedCloseDate: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    probability: { type: Number, default: 20, min: 0, max: 100 },
    tags: [{ type: String, trim: true }],
    lossReason: { type: String, default: '' },
    notes: { type: String, default: '' }
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

dealSchema.index({ organizationId: 1, stageId: 1, pipelineId: 1 });

export const Deal = mongoose.model<IDeal>('Deal', dealSchema);

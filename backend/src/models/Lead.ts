import mongoose, { Document, Schema } from 'mongoose';
import { LeadStatus, LeadSource, Priority } from '../constants';

export interface ILead extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  company?: string;
  title?: string;
  status: LeadStatus;
  source: LeadSource;
  priority: Priority;
  estimatedValue: number;
  assignedToId?: mongoose.Types.ObjectId;
  tags: string[];
  notes?: string;
  score?: number;
  customFields?: Map<string, any>;
  lastContactedAt?: Date;
  convertedContactId?: mongoose.Types.ObjectId;
  convertedDealId?: mongoose.Types.ObjectId;
  isConverted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true },
    company: { type: String, default: '', trim: true },
    title: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: Object.values(LeadStatus),
      default: LeadStatus.NEW,
      index: true
    },
    source: {
      type: String,
      enum: Object.values(LeadSource),
      default: LeadSource.WEBSITE,
      index: true
    },
    priority: {
      type: String,
      enum: Object.values(Priority),
      default: Priority.MEDIUM
    },
    estimatedValue: { type: Number, default: 0, min: 0 },
    assignedToId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    tags: [{ type: String, trim: true }],
    notes: { type: String, default: '' },
    score: { type: Number, default: 50, min: 0, max: 100 },
    customFields: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {}
    },
    lastContactedAt: { type: Date },
    convertedContactId: { type: Schema.Types.ObjectId, ref: 'Contact' },
    convertedDealId: { type: Schema.Types.ObjectId, ref: 'Deal' },
    isConverted: { type: Boolean, default: false }
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

leadSchema.index({ organizationId: 1, status: 1, priority: 1 });

export const Lead = mongoose.model<ILead>('Lead', leadSchema);

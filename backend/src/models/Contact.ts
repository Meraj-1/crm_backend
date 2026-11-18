import mongoose, { Document, Schema } from 'mongoose';
import { LeadSource } from '../constants';

export interface IContact extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  companyId?: mongoose.Types.ObjectId;
  designation: string;
  leadSource?: LeadSource;
  totalDealsValue: number;
  avatar?: string;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<IContact>(
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
    companyName: { type: String, default: '', trim: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
    designation: { type: String, default: 'Manager', trim: true },
    leadSource: {
      type: String,
      enum: Object.values(LeadSource),
      default: LeadSource.WEBSITE
    },
    totalDealsValue: { type: Number, default: 0 },
    avatar: { type: String, default: '' },
    location: { type: String, default: '' },
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

contactSchema.index({ organizationId: 1, email: 1 });

export const Contact = mongoose.model<IContact>('Contact', contactSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface ICompany extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  industry: string;
  website: string;
  size: string;
  annualRevenue?: number;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    industry: { type: String, default: 'Technology', trim: true },
    website: { type: String, default: '', trim: true },
    size: { type: String, default: '11-50' },
    annualRevenue: { type: Number, default: 0 },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true }
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

companySchema.index({ organizationId: 1, name: 1 });

export const Company = mongoose.model<ICompany>('Company', companySchema);

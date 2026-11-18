import mongoose, { Document, Schema } from 'mongoose';
import { PlanTier } from '../constants';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  logo?: string;
  plan: PlanTier;
  currency: string;
  currencySymbol: string;
  maxUsers: number;
  maxLeads: number;
  settings: {
    leadAutoAssign: boolean;
    notifyOnDealWon: boolean;
    defaultPipelineId?: mongoose.Types.ObjectId;
    allowedEmailDomains?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo: { type: String },
    plan: {
      type: String,
      enum: Object.values(PlanTier),
      default: PlanTier.STARTER
    },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    maxUsers: { type: Number, default: 5 },
    maxLeads: { type: Number, default: 2000 },
    settings: {
      leadAutoAssign: { type: Boolean, default: false },
      notifyOnDealWon: { type: Boolean, default: true },
      defaultPipelineId: { type: Schema.Types.ObjectId, ref: 'Pipeline' },
      allowedEmailDomains: [{ type: String }]
    }
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

export const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);

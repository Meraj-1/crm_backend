import mongoose, { Document, Schema } from 'mongoose';
import { ActivityType, EntityType } from '../constants';

export interface IActivity extends Document {
  organizationId: mongoose.Types.ObjectId;
  type: ActivityType;
  title: string;
  description: string;
  entityType: EntityType;
  entityId: mongoose.Types.ObjectId;
  entityName: string;
  performedById?: mongoose.Types.ObjectId;
  performedByName: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: Object.values(ActivityType),
      required: true
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    entityType: {
      type: String,
      enum: Object.values(EntityType),
      required: true
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    entityName: { type: String, required: true },
    performedById: { type: Schema.Types.ObjectId, ref: 'User' },
    performedByName: { type: String, default: 'System' },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

activitySchema.index({ organizationId: 1, createdAt: -1 });
activitySchema.index({ organizationId: 1, entityType: 1, entityId: 1 });

export const Activity = mongoose.model<IActivity>('Activity', activitySchema);

import mongoose, { Document, Schema } from 'mongoose';
import { CommunicationChannel, CommunicationDirection, EntityType } from '../constants';

export interface ICommunicationLog extends Document {
  organizationId: mongoose.Types.ObjectId;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  recipient: string;
  sender: string;
  subject?: string;
  body: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'OPENED';
  entityType: EntityType;
  entityId: mongoose.Types.ObjectId;
  entityName: string;
  loggedById?: mongoose.Types.ObjectId;
  loggedByName: string;
  externalMessageId?: string;
  sentAt: Date;
  createdAt: Date;
}

const communicationLogSchema = new Schema<ICommunicationLog>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    channel: {
      type: String,
      enum: Object.values(CommunicationChannel),
      required: true
    },
    direction: {
      type: String,
      enum: Object.values(CommunicationDirection),
      default: CommunicationDirection.OUTBOUND
    },
    recipient: { type: String, required: true },
    sender: { type: String, required: true },
    subject: { type: String, default: '' },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'OPENED'],
      default: 'SENT'
    },
    entityType: {
      type: String,
      enum: Object.values(EntityType),
      required: true
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    entityName: { type: String, required: true },
    loggedById: { type: Schema.Types.ObjectId, ref: 'User' },
    loggedByName: { type: String, default: 'System' },
    externalMessageId: { type: String },
    sentAt: { type: Date, default: Date.now }
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

communicationLogSchema.index({ organizationId: 1, entityId: 1, channel: 1 });

export const CommunicationLog = mongoose.model<ICommunicationLog>('CommunicationLog', communicationLogSchema);

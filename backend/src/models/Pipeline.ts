import mongoose, { Document, Schema } from 'mongoose';

export interface IDealStage {
  id: string;
  name: string;
  order: number;
  color: string;
  probability: number;
}

export interface IPipeline extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  isDefault: boolean;
  stages: IDealStage[];
  createdAt: Date;
  updatedAt: Date;
}

const dealStageSchema = new Schema<IDealStage>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
    color: { type: String, default: '#3b82f6' },
    probability: { type: Number, required: true, min: 0, max: 100 }
  },
  { _id: false }
);

const pipelineSchema = new Schema<IPipeline>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
    stages: [dealStageSchema]
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

pipelineSchema.index({ organizationId: 1, isDefault: 1 });

export const Pipeline = mongoose.model<IPipeline>('Pipeline', pipelineSchema);

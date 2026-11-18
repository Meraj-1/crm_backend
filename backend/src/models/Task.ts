import mongoose, { Document, Schema } from 'mongoose';
import { Priority, TaskStatus, EntityType } from '../constants';

export interface ITask extends Document {
  organizationId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  dueDate: Date;
  priority: Priority;
  status: TaskStatus;
  assignedToId?: mongoose.Types.ObjectId;
  relatedToType?: EntityType;
  relatedToId?: mongoose.Types.ObjectId;
  relatedToName?: string;
  isReminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    dueDate: { type: Date, required: true },
    priority: {
      type: String,
      enum: Object.values(Priority),
      default: Priority.MEDIUM
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.TODO,
      index: true
    },
    assignedToId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    relatedToType: {
      type: String,
      enum: Object.values(EntityType)
    },
    relatedToId: { type: Schema.Types.ObjectId },
    relatedToName: { type: String, default: '' },
    isReminderSent: { type: Boolean, default: false }
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

taskSchema.index({ organizationId: 1, status: 1, dueDate: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);

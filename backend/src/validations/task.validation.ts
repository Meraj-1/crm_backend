import { z } from 'zod';
import { Priority, TaskStatus, EntityType } from '../constants';

export const createTaskSchema = {
  body: z.object({
    title: z.string().min(2, 'Task title is required'),
    description: z.string().optional().default(''),
    dueDate: z.string().min(1, 'Due date is required'),
    priority: z.nativeEnum(Priority).optional().default(Priority.MEDIUM),
    status: z.nativeEnum(TaskStatus).optional().default(TaskStatus.TODO),
    assignedToId: z.string().optional(),
    relatedToType: z.nativeEnum(EntityType).optional(),
    relatedToId: z.string().optional(),
    relatedToName: z.string().optional()
  })
};

export const updateTaskSchema = {
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    priority: z.nativeEnum(Priority).optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    assignedToId: z.string().optional(),
    relatedToType: z.nativeEnum(EntityType).optional(),
    relatedToId: z.string().optional(),
    relatedToName: z.string().optional()
  })
};

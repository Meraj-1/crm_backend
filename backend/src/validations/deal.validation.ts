import { z } from 'zod';
import { Priority } from '../constants';

export const createDealSchema = {
  body: z.object({
    title: z.string().min(2, 'Deal title is required'),
    value: z.number().min(0, 'Value must be greater than or equal to 0'),
    currency: z.string().optional().default('INR'),
    pipelineId: z.string().min(1, 'Pipeline ID is required'),
    stageId: z.string().min(1, 'Stage ID is required'),
    contactId: z.string().optional(),
    contactName: z.string().optional().default(''),
    companyName: z.string().optional().default(''),
    companyId: z.string().optional(),
    assignedToId: z.string().optional(),
    priority: z.nativeEnum(Priority).optional().default(Priority.MEDIUM),
    expectedCloseDate: z.string().optional(),
    probability: z.number().min(0).max(100).optional().default(20),
    tags: z.array(z.string()).optional().default([]),
    notes: z.string().optional().default('')
  })
};

export const updateDealSchema = {
  body: z.object({
    title: z.string().min(2).optional(),
    value: z.number().min(0).optional(),
    currency: z.string().optional(),
    pipelineId: z.string().optional(),
    stageId: z.string().optional(),
    contactId: z.string().optional(),
    contactName: z.string().optional(),
    companyName: z.string().optional(),
    companyId: z.string().optional(),
    assignedToId: z.string().optional(),
    priority: z.nativeEnum(Priority).optional(),
    expectedCloseDate: z.string().optional(),
    probability: z.number().min(0).max(100).optional(),
    tags: z.array(z.string()).optional(),
    lossReason: z.string().optional(),
    notes: z.string().optional()
  })
};

export const moveDealStageSchema = {
  body: z.object({
    stageId: z.string().min(1, 'Target stageId is required')
  })
};

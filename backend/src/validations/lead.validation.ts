import { z } from 'zod';
import { LeadStatus, LeadSource, Priority } from '../constants';

export const createLeadSchema = {
  body: z.object({
    name: z.string().min(2, 'Lead name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional().default(''),
    company: z.string().optional().default(''),
    title: z.string().optional().default(''),
    status: z.nativeEnum(LeadStatus).optional().default(LeadStatus.NEW),
    source: z.nativeEnum(LeadSource).optional().default(LeadSource.WEBSITE),
    priority: z.nativeEnum(Priority).optional().default(Priority.MEDIUM),
    estimatedValue: z.number().min(0).optional().default(0),
    assignedToId: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    notes: z.string().optional().default(''),
    score: z.number().min(0).max(100).optional().default(50),
    customFields: z.record(z.any()).optional()
  })
};

export const updateLeadSchema = {
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    title: z.string().optional(),
    status: z.nativeEnum(LeadStatus).optional(),
    source: z.nativeEnum(LeadSource).optional(),
    priority: z.nativeEnum(Priority).optional(),
    estimatedValue: z.number().min(0).optional(),
    assignedToId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
    score: z.number().min(0).max(100).optional(),
    customFields: z.record(z.any()).optional()
  })
};

export const updateLeadStatusSchema = {
  body: z.object({
    status: z.nativeEnum(LeadStatus)
  })
};

export const convertLeadSchema = {
  body: z.object({
    createDeal: z.boolean().default(true),
    dealTitle: z.string().optional(),
    dealValue: z.number().optional(),
    pipelineId: z.string().optional(),
    stageId: z.string().optional()
  })
};

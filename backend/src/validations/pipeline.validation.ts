import { z } from 'zod';

export const stageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  order: z.number().min(0),
  color: z.string().default('#3b82f6'),
  probability: z.number().min(0).max(100)
});

export const createPipelineSchema = {
  body: z.object({
    name: z.string().min(2, 'Pipeline name is required'),
    isDefault: z.boolean().optional().default(false),
    stages: z.array(stageSchema).min(1, 'Pipeline must have at least 1 stage')
  })
};

export const updatePipelineSchema = {
  body: z.object({
    name: z.string().min(2).optional(),
    isDefault: z.boolean().optional(),
    stages: z.array(stageSchema).optional()
  })
};

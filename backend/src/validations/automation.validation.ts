import { z } from 'zod';
import { TriggerType, ActionType, CommunicationChannel, EntityType } from '../constants';

export const createAutomationSchema = {
  body: z.object({
    name: z.string().min(2, 'Automation name is required'),
    description: z.string().optional().default(''),
    trigger: z.nativeEnum(TriggerType),
    triggerCondition: z.string().optional().default(''),
    action: z.nativeEnum(ActionType),
    actionPayload: z.string().optional().default('{}'),
    isActive: z.boolean().optional().default(true)
  })
};

export const updateAutomationSchema = {
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    trigger: z.nativeEnum(TriggerType).optional(),
    triggerCondition: z.string().optional(),
    action: z.nativeEnum(ActionType).optional(),
    actionPayload: z.string().optional(),
    isActive: z.boolean().optional()
  })
};

export const sendCommunicationSchema = {
  body: z.object({
    channel: z.nativeEnum(CommunicationChannel),
    recipient: z.string().min(1, 'Recipient is required'),
    subject: z.string().optional().default(''),
    body: z.string().min(1, 'Message body is required'),
    entityType: z.nativeEnum(EntityType),
    entityId: z.string().min(1, 'Entity ID is required'),
    entityName: z.string().min(1, 'Entity name is required')
  })
};

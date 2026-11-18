import { z } from 'zod';
import { LeadSource } from '../constants';

export const createContactSchema = {
  body: z.object({
    name: z.string().min(2, 'Contact name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional().default(''),
    companyName: z.string().optional().default(''),
    companyId: z.string().optional(),
    designation: z.string().optional().default(''),
    leadSource: z.nativeEnum(LeadSource).optional().default(LeadSource.WEBSITE),
    avatar: z.string().optional().default(''),
    location: z.string().optional().default(''),
    notes: z.string().optional().default('')
  })
};

export const updateContactSchema = {
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    companyName: z.string().optional(),
    companyId: z.string().optional(),
    designation: z.string().optional(),
    leadSource: z.nativeEnum(LeadSource).optional(),
    avatar: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional()
  })
};

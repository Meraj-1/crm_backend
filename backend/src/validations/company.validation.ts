import { z } from 'zod';

export const createCompanySchema = {
  body: z.object({
    name: z.string().min(2, 'Company name is required'),
    industry: z.string().optional().default('Technology'),
    website: z.string().optional().default(''),
    size: z.string().optional().default('11-50'),
    annualRevenue: z.number().optional().default(0),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional()
  })
};

export const updateCompanySchema = {
  body: z.object({
    name: z.string().min(2).optional(),
    industry: z.string().optional(),
    website: z.string().optional(),
    size: z.string().optional(),
    annualRevenue: z.number().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional()
  })
};

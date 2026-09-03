// commercial.schema.ts
import { z } from 'zod';

export const createCommercialPlanSchema = z.object({
  name: z.string().min(2).max(150),
  code: z.string().min(2).max(50).toUpperCase(),
  description: z.string().optional(),
  billingInterval: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']).default('MONTHLY'),
  price: z.number().min(0),
  currency: z.string().length(3).default('ETB'),
  limits: z.record(z.unknown()).default({}),
  features: z.array(z.string()).default([]),
});

export const createContractSchema = z.object({
  organizationId: z.string().uuid(),
  planId: z.string().uuid().nullable().optional(),
  contractNumber: z.string().min(3).max(100),
  effectiveDate: z.string(),
  expiryDate: z.string().optional(),
  feeModel: z.enum(['SUBSCRIPTION', 'LISTING_FEE', 'LEAD_FEE', 'SUCCESS_DEAL', 'SALES_AGENT_COMMISSION', 'HYBRID', 'CUSTOM']).default('HYBRID'),
  terms: z.record(z.unknown()).default({}),
  signedDocumentUrl: z.string().url().optional(),
});

export const createFeeRuleSchema = z.object({
  contractId: z.string().uuid().optional(),
  domainId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  feeType: z.enum(['SUBSCRIPTION', 'LISTING', 'QUALIFIED_LEAD', 'APPOINTMENT', 'SUCCESS_COMMISSION', 'AGENT_COMMISSION']),
  calculationType: z.enum(['FIXED', 'PERCENTAGE', 'TIERED']),
  rateValue: z.number().min(0),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  currency: z.string().length(3).default('ETB'),
  triggerEvent: z.string().min(3).max(100),
});

export const createDisputeSchema = z.object({
  feeEventId: z.string().uuid(),
  reason: z.string().min(10),
  requestedAdjustment: z.number().optional(),
});

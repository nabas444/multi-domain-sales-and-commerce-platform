// crm.schema.ts
import { z } from 'zod';

export const createCustomerSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().min(7).max(50),
  secondaryPhone: z.string().optional(),
  preferredContactMethod: z.enum(['PHONE', 'WHATSAPP', 'EMAIL', 'TELEGRAM']).default('PHONE'),
  city: z.string().optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  currency: z.string().length(3).default('ETB'),
  notes: z.string().optional(),
});

export const createLeadSchema = z.object({
  domainId: z.string().uuid(),
  customer: createCustomerSchema,
  listingId: z.string().uuid().nullable().optional(),
  source: z.enum(['PLATFORM', 'PARTNER', 'AGENT', 'CAMPAIGN', 'ORGANIC', 'REFERRAL', 'IMPORT', 'DIRECT_INQUIRY']).default('PLATFORM'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  requirements: z.record(z.unknown()).optional(),
  inquiryMessage: z.string().optional(),
  attributionDetails: z.record(z.unknown()).optional(),
});

export const scheduleAppointmentSchema = z.object({
  leadId: z.string().uuid().nullable().optional(),
  listingId: z.string().uuid().nullable().optional(),
  customerId: z.string().uuid(),
  hostAgentId: z.string().uuid(),
  type: z.enum(['SITE_VISIT', 'VIRTUAL_TOUR', 'OFFICE_MEETING', 'TECHNICAL_SURVEY', 'INSPECTION']),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  location: z.string().min(3),
  notes: z.string().optional(),
});

export const createDealSchema = z.object({
  domainId: z.string().uuid(),
  pipelineId: z.string().uuid(),
  stageId: z.string().uuid(),
  leadId: z.string().uuid().nullable().optional(),
  customerId: z.string().uuid(),
  listingId: z.string().uuid().nullable().optional(),
  assignedAgentId: z.string().uuid().nullable().optional(),
  title: z.string().min(3).max(255),
  dealValue: z.number().min(0),
  currency: z.string().length(3).default('ETB'),
  expectedCloseDate: z.string().optional(),
});

import { z } from 'zod';

export const CreateOrganizationSchema = z.object({
  name: z.string().trim().min(2, 'Organization name must be at least 2 characters').max(200),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric characters and hyphens'),
  type: z.enum(['PROVIDER', 'PARTNER', 'BROKER', 'VENDOR', 'DEVELOPER', 'AGENCY']),
  legalName: z.string().trim().optional(),
  taxIdentificationNumber: z.string().trim().optional(),
  primaryContactEmail: z.string().trim().email('Invalid email address'),
  primaryContactPhone: z.string().trim().optional(),
  websiteUrl: z.string().trim().url('Invalid website URL').optional().or(z.literal('')),
  countryCode: z.string().trim().length(2, 'Country code must be ISO 2-letter format').default('ET'),
  city: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;

export const CreateBranchSchema = z.object({
  name: z.string().trim().min(2, 'Branch name must be at least 2 characters').max(200),
  code: z.string().trim().min(2, 'Branch code must be at least 2 characters').max(50).optional(),
  city: z.string().trim().min(1, 'City is required'),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email('Invalid branch email').optional().or(z.literal('')),
  isMainBranch: z.boolean().default(false),
});

export type CreateBranchInput = z.infer<typeof CreateBranchSchema>;

export const AddMemberSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  roleId: z.string().uuid('Invalid role ID'),
  branchId: z.string().uuid('Invalid branch ID').optional().nullable(),
  isPrimary: z.boolean().default(false),
});

export type AddMemberInput = z.infer<typeof AddMemberSchema>;

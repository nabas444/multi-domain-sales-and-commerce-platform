// domain.schema.ts
import { z } from 'zod';

export const createDomainSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  code: z.string().min(2).max(50).toUpperCase(),
  icon: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'MAINTENANCE', 'ARCHIVED']).default('DRAFT'),
  defaultCurrency: z.string().length(3).default('ETB'),
  measurementSystem: z.enum(['METRIC', 'IMPERIAL']).default('METRIC'),
  timezone: z.string().default('Africa/Addis_Ababa'),
  branding: z.record(z.unknown()).optional(),
  enabledModules: z.array(z.string()).default(['INVENTORY', 'CRM', 'SALES', 'MARKETING', 'FINANCE']),
  sortOrder: z.number().int().default(0),
});

export const createCategorySchema = z.object({
  domainId: z.string().uuid(),
  parentId: z.string().uuid().nullable().optional(),
  name: z.string().min(2).max(150),
  slug: z.string().min(2).max(150).regex(/^[a-z0-9-]+$/),
  code: z.string().min(2).max(50).toUpperCase(),
  icon: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const createAttributeDefinitionSchema = z.object({
  domainId: z.string().uuid(),
  name: z.string().min(2).max(150),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9_]+$/),
  code: z.string().min(2).max(50).toUpperCase(),
  groupName: z.string().min(2).max(100).default('General'),
  type: z.enum(['TEXT', 'NUMBER', 'BOOLEAN', 'SELECT', 'MULTISELECT', 'DATE', 'RANGE', 'LOCATION', 'JSON']),
  isRequired: z.boolean().default(false),
  isSearchable: z.boolean().default(true),
  isFilterable: z.boolean().default(true),
  isSortable: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  validationRules: z.record(z.unknown()).optional(),
  sortOrder: z.number().int().default(0),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
    sortOrder: z.number().int().default(0),
  })).optional(),
});

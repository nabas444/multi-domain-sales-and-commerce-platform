// settings.schema.ts
import { z } from 'zod';

export const createSettingDefinitionSchema = z.object({
  key: z.string().min(3).max(150).regex(/^[a-z0-9_.-]+$/, 'Key must contain only lowercase letters, numbers, underscores, dashes, and periods'),
  dataType: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ENUM', 'COLOR', 'DURATION']),
  label: z.string().min(2).max(200),
  description: z.string().optional(),
  category: z.enum(['GENERAL', 'BRANDING', 'SECURITY', 'LISTINGS', 'CRM', 'WORKFLOW', 'COMMERCIAL', 'NOTIFICATIONS', 'API']),
  sensitivity: z.enum(['LOW', 'OPERATIONAL', 'SECURITY', 'FINANCIAL', 'LEGAL', 'INFRASTRUCTURE']).default('LOW'),
  allowedScopes: z.array(z.enum(['PLATFORM', 'DOMAIN', 'ORGANIZATION', 'BRANCH', 'ROLE', 'USER', 'CATEGORY'])).min(1),
  validationSchema: z.record(z.unknown()).optional(),
  defaultValue: z.unknown(),
  isSystem: z.boolean().default(false),
  isSecret: z.boolean().default(false),
});

export const updateSettingValueSchema = z.object({
  scope: z.enum(['PLATFORM', 'DOMAIN', 'ORGANIZATION', 'BRANCH', 'ROLE', 'USER', 'CATEGORY']),
  scopeId: z.string().default('GLOBAL'),
  value: z.unknown(),
  reason: z.string().optional(),
});

export const createFeatureFlagSchema = z.object({
  key: z.string().min(3).max(100),
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  state: z.enum(['ON', 'OFF', 'READ_ONLY', 'HIDDEN', 'CONDITIONAL', 'BETA', 'REQUIRES_APPROVAL']).default('OFF'),
  scope: z.string().default('PLATFORM'),
  scopeId: z.string().default('GLOBAL'),
  rules: z.record(z.unknown()).optional(),
});

export const updateThemeTokensSchema = z.object({
  name: z.string().min(2).max(100),
  scope: z.enum(['PLATFORM', 'DOMAIN', 'ORGANIZATION', 'USER']).default('PLATFORM'),
  scopeId: z.string().default('GLOBAL'),
  palette: z.string().default('monochrome-light'),
  tokens: z.object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
    accentColor: z.string(),
    backgroundColor: z.string(),
    surfaceColor: z.string(),
    textColor: z.string(),
    textMutedColor: z.string(),
    borderColor: z.string(),
    borderRadius: z.string(),
    fontFamily: z.string(),
    density: z.enum(['compact', 'comfortable', 'spacious']).default('comfortable'),
  }),
});

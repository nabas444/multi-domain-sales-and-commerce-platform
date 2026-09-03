// settings.types.ts
// Settings Control Plane, Feature Flags, and Theme Tokens

export type SettingDataType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ENUM' | 'COLOR' | 'DURATION';
export type SettingCategory = 'GENERAL' | 'BRANDING' | 'SECURITY' | 'LISTINGS' | 'CRM' | 'WORKFLOW' | 'COMMERCIAL' | 'NOTIFICATIONS' | 'API';
export type SettingSensitivity = 'LOW' | 'OPERATIONAL' | 'SECURITY' | 'FINANCIAL' | 'LEGAL' | 'INFRASTRUCTURE';
export type SettingScope = 'PLATFORM' | 'DOMAIN' | 'ORGANIZATION' | 'BRANCH' | 'ROLE' | 'USER' | 'CATEGORY';

export interface SettingDefinition {
  id: string;
  key: string;
  dataType: SettingDataType;
  label: string;
  description?: string;
  category: SettingCategory;
  sensitivity: SettingSensitivity;
  allowedScopes: SettingScope[];
  validationSchema?: Record<string, unknown>;
  defaultValue: unknown;
  isSystem: boolean;
  isSecret: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettingValue {
  id: string;
  definitionId: string;
  scope: SettingScope;
  scopeId: string;
  value: unknown;
  version: number;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResolvedSetting {
  key: string;
  value: unknown;
  source: 'DEFAULT' | 'PLATFORM' | 'DOMAIN' | 'ORGANIZATION' | 'BRANCH' | 'USER';
  definition: SettingDefinition;
  isOverridden: boolean;
}

export type FeatureFlagState = 'ON' | 'OFF' | 'READ_ONLY' | 'HIDDEN' | 'CONDITIONAL' | 'BETA' | 'REQUIRES_APPROVAL';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  state: FeatureFlagState;
  scope: string;
  scopeId: string;
  rules?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThemeTokens {
  id: string;
  name: string;
  scope: 'PLATFORM' | 'DOMAIN' | 'ORGANIZATION' | 'USER';
  scopeId: string;
  palette: string;
  tokens: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    surfaceColor: string;
    textColor: string;
    textMutedColor: string;
    borderColor: string;
    borderRadius: string;
    fontFamily: string;
    density: 'compact' | 'comfortable' | 'spacious';
  };
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

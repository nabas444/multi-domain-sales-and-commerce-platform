// domain.types.ts
// Domains, Categories, and Dynamic Attributes

export type DomainStatus = 'DRAFT' | 'ACTIVE' | 'MAINTENANCE' | 'ARCHIVED';
export type AttributeType = 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SELECT' | 'MULTISELECT' | 'DATE' | 'RANGE' | 'LOCATION' | 'JSON';

export interface Domain {
  id: string;
  name: string;
  slug: string;
  code: string;
  icon?: string;
  description?: string;
  status: DomainStatus;
  defaultCurrency: string;
  measurementSystem: 'METRIC' | 'IMPERIAL';
  timezone: string;
  branding?: Record<string, unknown>;
  enabledModules: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  domainId: string;
  parentId?: string | null;
  name: string;
  slug: string;
  code: string;
  icon?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  children?: Category[];
}

export interface AttributeOption {
  id: string;
  attributeId: string;
  label: string;
  value: string;
  sortOrder: number;
  isActive: boolean;
}

export interface AttributeDefinition {
  id: string;
  domainId: string;
  name: string;
  slug: string;
  code: string;
  groupName: string;
  type: AttributeType;
  isRequired: boolean;
  isSearchable: boolean;
  isFilterable: boolean;
  isSortable: boolean;
  isPublic: boolean;
  validationRules?: Record<string, unknown>;
  sortOrder: number;
  options?: AttributeOption[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryTemplate {
  id: string;
  categoryId: string;
  name: string;
  cardFields: string[];
  detailSections: Array<{
    title: string;
    fields: string[];
    layout: 'grid' | 'full' | 'split';
  }>;
  searchFilters: Array<{
    attributeSlug: string;
    widget: 'range' | 'checkbox' | 'radio' | 'dropdown' | 'search';
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantDomainPermission {
  id: string;
  organizationId: string;
  domainId: string;
  allowedCategories: string[];
  isEnabled: boolean;
  createdAt: Date;
}

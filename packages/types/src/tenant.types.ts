export enum OrganizationStatus {
  DRAFT = 'DRAFT',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  NEEDS_CORRECTION = 'NEEDS_CORRECTION',
  APPROVED = 'APPROVED',
  CONTRACT_PENDING = 'CONTRACT_PENDING',
  ACTIVE = 'ACTIVE',
  RESTRICTED = 'RESTRICTED',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
  ARCHIVED = 'ARCHIVED',
}

export enum OrganizationType {
  PROVIDER = 'PROVIDER',
  PARTNER = 'PARTNER',
  BROKER = 'BROKER',
  VENDOR = 'VENDOR',
  DEVELOPER = 'DEVELOPER',
  AGENCY = 'AGENCY',
}

export interface TenantContext {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationType: OrganizationType;
  status: OrganizationStatus;
  branchId?: string | null;
}

export interface OrganizationMembership {
  id: string;
  userId: string;
  organizationId: string;
  branchId?: string | null;
  roleId: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
}

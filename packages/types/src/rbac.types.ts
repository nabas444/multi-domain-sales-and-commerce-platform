/**
 * Granular action-based permissions model: `resource.action`
 * Master Documentation Section 20
 */
export const SystemPermissions = {
  // Platform Administration
  PLATFORM_MANAGE: 'platform.manage',
  PLATFORM_VIEW_ANALYTICS: 'platform.view_analytics',

  // Tenant / Organization
  TENANT_READ: 'tenant.read',
  TENANT_CREATE: 'tenant.create',
  TENANT_UPDATE: 'tenant.update',
  TENANT_VERIFY: 'tenant.verify',
  TENANT_SUSPEND: 'tenant.suspend',
  TENANT_DELETE: 'tenant.delete',

  // Branches
  BRANCH_READ: 'branch.read',
  BRANCH_CREATE: 'branch.create',
  BRANCH_UPDATE: 'branch.update',
  BRANCH_DELETE: 'branch.delete',

  // Identity & Access
  USER_READ: 'user.read',
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_ASSIGN_ROLE: 'user.assign_role',
  ROLE_READ: 'role.read',
  ROLE_CREATE: 'role.create',
  ROLE_UPDATE: 'role.update',
  ROLE_DELETE: 'role.delete',

  // Domain Catalog & Attributes
  DOMAIN_READ: 'domain.read',
  DOMAIN_CREATE: 'domain.create',
  DOMAIN_UPDATE: 'domain.update',
  DOMAIN_PUBLISH: 'domain.publish',
  DOMAIN_DELETE: 'domain.delete',

  // Inventory & Listings
  LISTING_READ: 'listing.read',
  LISTING_CREATE: 'listing.create',
  LISTING_UPDATE: 'listing.update',
  LISTING_SUBMIT: 'listing.submit',
  LISTING_APPROVE: 'listing.approve',
  LISTING_PUBLISH: 'listing.publish',
  LISTING_ARCHIVE: 'listing.archive',
  LISTING_DELETE: 'listing.delete',
  INVENTORY_READ: 'inventory.read',
  INVENTORY_STOCK_MANAGE: 'inventory.stock_manage',
  INVENTORY_AUTHORIZE: 'inventory.authorize',

  // CRM & Leads
  LEAD_READ: 'lead.read',
  LEAD_CREATE: 'lead.create',
  LEAD_UPDATE: 'lead.update',
  LEAD_ASSIGN: 'lead.assign',
  LEAD_EXPORT: 'lead.export',
  LEAD_DELETE: 'lead.delete',
  CUSTOMER_READ: 'crm.customer.read',
  CUSTOMER_CREATE: 'crm.customer.create',
  CUSTOMER_UPDATE: 'crm.customer.update',
  ACTIVITY_CREATE: 'crm.activity.create',

  // Sales Pipeline & Deals
  APPOINTMENT_READ: 'appointment.read',
  APPOINTMENT_CREATE: 'appointment.create',
  APPOINTMENT_UPDATE: 'appointment.update',
  DEAL_READ: 'deal.read',
  DEAL_CREATE: 'deal.create',
  DEAL_UPDATE: 'deal.update',
  DEAL_ADVANCE_STAGE: 'deal.advance_stage',
  DEAL_CLOSE: 'deal.close',

  // Commercial Contracts & Commission
  CONTRACT_READ: 'contract.read',
  CONTRACT_CREATE: 'contract.create',
  CONTRACT_UPDATE: 'contract.update',
  CONTRACT_APPROVE: 'contract.approve',
  COMMISSION_READ: 'commission.read',
  COMMISSION_CALCULATE: 'commission.calculate',
  COMMISSION_DISPUTE: 'commission.dispute',
  COMMISSION_SETTLE: 'commission.settle',

  // Finance & Ledger
  LEDGER_READ: 'ledger.read',
  LEDGER_ADJUST: 'ledger.adjust',
  INVOICE_READ: 'invoice.read',
  INVOICE_CREATE: 'invoice.create',
  INVOICE_ISSUE: 'invoice.issue',
  PAYMENT_RECORD: 'payment.record',

  // Media & Documents
  MEDIA_UPLOAD: 'media.upload',
  MEDIA_DELETE: 'media.delete',

  // Configuration & Settings
  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update',
  SETTINGS_APPROVE: 'settings.approve',
  SETTINGS_ROLLBACK: 'settings.rollback',

  // Audit Logs
  AUDIT_READ: 'audit.read',
  AUDIT_EXPORT: 'audit.export',
} as const;

export type PermissionKey = (typeof SystemPermissions)[keyof typeof SystemPermissions];

export enum SystemRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PLATFORM_OPERATIONS = 'PLATFORM_OPERATIONS',
  DOMAIN_ADMIN = 'DOMAIN_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  SALES_MANAGER = 'SALES_MANAGER',
  SALES_AGENT = 'SALES_AGENT',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  FINANCE_ADMIN = 'FINANCE_ADMIN',
  MODERATOR = 'MODERATOR',
  CUSTOMER = 'CUSTOMER',
}

-- 004_rbac.sql
-- Role-Based Access Control: Roles, Permissions, Role_Permissions

CREATE TABLE IF NOT EXISTS identity.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_code_org UNIQUE NULLS NOT DISTINCT (organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_roles_org ON identity.roles(organization_id);

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON identity.roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Action-based permissions (resource.action)
CREATE TABLE IF NOT EXISTS identity.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_permissions_key ON identity.permissions(key);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON identity.permissions(resource);

-- Role-Permission junction
CREATE TABLE IF NOT EXISTS identity.role_permissions (
    role_id UUID NOT NULL REFERENCES identity.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES identity.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- Connect membership foreign key
ALTER TABLE organizations.memberships
    ADD CONSTRAINT fk_membership_role
    FOREIGN KEY (role_id) REFERENCES identity.roles(id) ON DELETE RESTRICT;

-- Populate default permissions
INSERT INTO identity.permissions (key, resource, action, description) VALUES
    ('platform.manage', 'platform', 'manage', 'Full platform administrative control'),
    ('platform.view_analytics', 'platform', 'view_analytics', 'View global platform analytics'),
    ('tenant.read', 'tenant', 'read', 'View tenant details'),
    ('tenant.create', 'tenant', 'create', 'Create new tenant/partner'),
    ('tenant.update', 'tenant', 'update', 'Update tenant profile and settings'),
    ('tenant.verify', 'tenant', 'verify', 'Approve/verify tenant partner'),
    ('tenant.suspend', 'tenant', 'suspend', 'Suspend or restrict tenant'),
    ('tenant.delete', 'tenant', 'delete', 'Terminate/archive tenant'),
    ('branch.read', 'branch', 'read', 'View branches'),
    ('branch.create', 'branch', 'create', 'Create branches'),
    ('branch.update', 'branch', 'update', 'Update branches'),
    ('branch.delete', 'branch', 'delete', 'Delete branches'),
    ('user.read', 'user', 'read', 'View users'),
    ('user.create', 'user', 'create', 'Invite/create users'),
    ('user.update', 'user', 'update', 'Update users'),
    ('user.delete', 'user', 'delete', 'Deactivate users'),
    ('user.assign_role', 'user', 'assign_role', 'Assign roles to members'),
    ('role.read', 'role', 'read', 'View roles and permissions'),
    ('role.create', 'role', 'create', 'Create custom roles'),
    ('role.update', 'role', 'update', 'Update roles'),
    ('role.delete', 'role', 'delete', 'Delete custom roles'),
    ('domain.read', 'domain', 'read', 'View domains and categories'),
    ('domain.create', 'domain', 'create', 'Create domain verticals'),
    ('domain.update', 'domain', 'update', 'Update domain verticals'),
    ('domain.publish', 'domain', 'publish', 'Publish domains and categories'),
    ('domain.delete', 'domain', 'delete', 'Delete domains'),
    ('listing.read', 'listing', 'read', 'View listings'),
    ('listing.create', 'listing', 'create', 'Create inventory listings'),
    ('listing.update', 'listing', 'update', 'Update inventory listings'),
    ('listing.submit', 'listing', 'submit', 'Submit listing for review'),
    ('listing.approve', 'listing', 'approve', 'Approve and publish listings'),
    ('listing.publish', 'listing', 'publish', 'Directly publish listings'),
    ('listing.archive', 'listing', 'archive', 'Archive listings'),
    ('listing.delete', 'listing', 'delete', 'Delete listings'),
    ('inventory.read', 'inventory', 'read', 'View inventory and stock'),
    ('inventory.stock_manage', 'inventory', 'stock_manage', 'Adjust stock and units'),
    ('inventory.authorize', 'inventory', 'authorize', 'Authorize legal selling rights'),
    ('lead.read', 'lead', 'read', 'View leads'),
    ('lead.create', 'lead', 'create', 'Capture and create leads'),
    ('lead.update', 'lead', 'update', 'Update lead status and details'),
    ('lead.assign', 'lead', 'assign', 'Assign leads to sales agents'),
    ('lead.export', 'lead', 'export', 'Export lead data'),
    ('lead.delete', 'lead', 'delete', 'Delete leads'),
    ('crm.customer.read', 'crm', 'customer_read', 'View customer records'),
    ('crm.customer.create', 'crm', 'customer_create', 'Create customer profiles'),
    ('crm.customer.update', 'crm', 'customer_update', 'Update customer profiles'),
    ('crm.activity.create', 'crm', 'activity_create', 'Log calls, notes, and activities'),
    ('appointment.read', 'appointment', 'read', 'View appointments and site visits'),
    ('appointment.create', 'appointment', 'create', 'Schedule appointments'),
    ('appointment.update', 'appointment', 'update', 'Reschedule or complete appointments'),
    ('deal.read', 'deal', 'read', 'View deals and pipelines'),
    ('deal.create', 'deal', 'create', 'Create deals'),
    ('deal.update', 'deal', 'update', 'Update deal parameters'),
    ('deal.advance_stage', 'deal', 'advance_stage', 'Advance deal pipeline stage'),
    ('deal.close', 'deal', 'close', 'Close deal as won or lost'),
    ('contract.read', 'contract', 'read', 'View commercial agreements'),
    ('contract.create', 'contract', 'create', 'Draft commercial contracts'),
    ('contract.update', 'contract', 'update', 'Modify commercial contracts'),
    ('contract.approve', 'contract', 'approve', 'Approve commercial agreements'),
    ('commission.read', 'commission', 'read', 'View commission calculations'),
    ('commission.calculate', 'commission', 'calculate', 'Calculate commissions'),
    ('commission.dispute', 'commission', 'dispute', 'Submit or review commission dispute'),
    ('commission.settle', 'commission', 'settle', 'Approve and execute commission settlements'),
    ('ledger.read', 'ledger', 'read', 'View financial ledger entries'),
    ('ledger.adjust', 'ledger', 'adjust', 'Create compensating ledger adjustment'),
    ('invoice.read', 'invoice', 'read', 'View invoices'),
    ('invoice.create', 'invoice', 'create', 'Generate invoices'),
    ('invoice.issue', 'invoice', 'issue', 'Issue invoices to partners'),
    ('payment.record', 'payment', 'record', 'Record and reconcile incoming payments'),
    ('media.upload', 'media', 'upload', 'Upload media and documents'),
    ('media.delete', 'media', 'delete', 'Delete media assets'),
    ('settings.read', 'settings', 'read', 'View configuration and settings'),
    ('settings.update', 'settings', 'update', 'Update settings'),
    ('settings.approve', 'settings', 'approve', 'Approve sensitive settings changes'),
    ('settings.rollback', 'settings', 'rollback', 'Rollback settings version'),
    ('audit.read', 'audit', 'read', 'View immutable audit logs'),
    ('audit.export', 'audit', 'export', 'Export audit logs')
ON CONFLICT (key) DO NOTHING;

-- Populate default System Roles (organization_id is NULL)
INSERT INTO identity.roles (id, organization_id, name, code, description, is_system) VALUES
    ('00000000-0000-0000-0000-000000000001', NULL, 'Super Administrator', 'SUPER_ADMIN', 'Unrestricted global platform access', TRUE),
    ('00000000-0000-0000-0000-000000000002', NULL, 'Tenant Administrator', 'TENANT_ADMIN', 'Full control within tenant organization', TRUE),
    ('00000000-0000-0000-0000-000000000003', NULL, 'Branch Manager', 'BRANCH_MANAGER', 'Manages branch operations, team, and inventory', TRUE),
    ('00000000-0000-0000-0000-000000000004', NULL, 'Sales Agent', 'SALES_AGENT', 'Handles assigned leads, appointments, and deals', TRUE),
    ('00000000-0000-0000-0000-000000000005', NULL, 'Inventory Manager', 'INVENTORY_MANAGER', 'Manages listings, stock, and media', TRUE),
    ('00000000-0000-0000-0000-000000000006', NULL, 'Finance Administrator', 'FINANCE_ADMIN', 'Manages ledger, billing, invoices, and settlements', TRUE)
ON CONFLICT DO NOTHING;

-- Assign all permissions to SUPER_ADMIN
INSERT INTO identity.role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM identity.permissions
ON CONFLICT DO NOTHING;

-- Assign tenant-level permissions to TENANT_ADMIN
INSERT INTO identity.role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000002', id FROM identity.permissions
WHERE key NOT LIKE 'platform.%' AND key NOT IN ('tenant.create', 'tenant.verify', 'tenant.suspend', 'tenant.delete', 'domain.create', 'domain.delete')
ON CONFLICT DO NOTHING;

-- Assign sales permissions to SALES_AGENT
INSERT INTO identity.role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000004', id FROM identity.permissions
WHERE key IN (
    'listing.read', 'inventory.read', 'lead.read', 'lead.create', 'lead.update', 
    'crm.customer.read', 'crm.customer.create', 'crm.customer.update', 'crm.activity.create',
    'appointment.read', 'appointment.create', 'appointment.update',
    'deal.read', 'deal.create', 'deal.update', 'deal.advance_stage',
    'commission.read', 'media.upload'
)
ON CONFLICT DO NOTHING;

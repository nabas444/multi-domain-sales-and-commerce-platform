-- 003_organizations.sql
-- Organizations / Tenants, Branches, and Memberships

CREATE TABLE IF NOT EXISTS organizations.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('PROVIDER', 'PARTNER', 'BROKER', 'VENDOR', 'DEVELOPER', 'AGENCY')),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'PENDING_VERIFICATION', 'NEEDS_CORRECTION', 'APPROVED', 
        'CONTRACT_PENDING', 'ACTIVE', 'RESTRICTED', 'SUSPENDED', 'TERMINATED', 'ARCHIVED'
    )),
    legal_name VARCHAR(255),
    tax_identification_number VARCHAR(100),
    primary_contact_email VARCHAR(255) NOT NULL,
    primary_contact_phone VARCHAR(50),
    website_url TEXT,
    country_code VARCHAR(2) NOT NULL DEFAULT 'ET',
    city VARCHAR(100),
    address TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON organizations.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON organizations.tenants(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_type ON organizations.tenants(type) WHERE deleted_at IS NULL;

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON organizations.tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Branches
CREATE TABLE IF NOT EXISTS organizations.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50),
    city VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    is_main_branch BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_branch_org_code UNIQUE (organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_branches_org ON organizations.branches(organization_id) WHERE deleted_at IS NULL;

CREATE TRIGGER update_branches_updated_at
    BEFORE UPDATE ON organizations.branches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Organization Memberships (User <-> Tenant relationship)
CREATE TABLE IF NOT EXISTS organizations.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES organizations.branches(id) ON DELETE SET NULL,
    role_id UUID NOT NULL, -- references identity.roles(id) (created in 004)
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_user_organization UNIQUE (user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON organizations.memberships(user_id) WHERE is_active = TRUE AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_memberships_org ON organizations.memberships(organization_id) WHERE is_active = TRUE AND deleted_at IS NULL;

CREATE TRIGGER update_memberships_updated_at
    BEFORE UPDATE ON organizations.memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

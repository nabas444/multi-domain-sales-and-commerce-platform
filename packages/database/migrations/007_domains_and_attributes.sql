-- 007_domains_and_attributes.sql
-- Domains, Categories, Dynamic Attributes, Category Templates, and Partner Domain Permissions

CREATE SCHEMA IF NOT EXISTS domains;

-- 1. Domains Catalog
CREATE TABLE IF NOT EXISTS domains.domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(100),
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'MAINTENANCE', 'ARCHIVED')),
    default_currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    measurement_system VARCHAR(20) NOT NULL DEFAULT 'METRIC' CHECK (measurement_system IN ('METRIC', 'IMPERIAL')),
    timezone VARCHAR(100) NOT NULL DEFAULT 'Africa/Addis_Ababa',
    branding JSONB DEFAULT '{}'::jsonb,
    enabled_modules JSONB NOT NULL DEFAULT '["INVENTORY", "CRM", "SALES", "MARKETING", "FINANCE"]'::jsonb,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_domains_slug ON domains.domains(slug);
CREATE INDEX IF NOT EXISTS idx_domains_status ON domains.domains(status);

CREATE TRIGGER update_domains_updated_at
    BEFORE UPDATE ON domains.domains
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Categories Hierarchy Tree
CREATE TABLE IF NOT EXISTS domains.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES domains.domains(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES domains.categories(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    icon VARCHAR(100),
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_category_domain_slug UNIQUE (domain_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_categories_domain ON domains.categories(domain_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON domains.categories(parent_id);

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON domains.categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Dynamic Attribute Definitions
CREATE TABLE IF NOT EXISTS domains.attribute_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES domains.domains(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    group_name VARCHAR(100) NOT NULL DEFAULT 'General', -- e.g., 'Physical Specifications', 'Legal & Ownership', 'Location Intelligence', 'Mechanical'
    type VARCHAR(50) NOT NULL CHECK (type IN ('TEXT', 'NUMBER', 'BOOLEAN', 'SELECT', 'MULTISELECT', 'DATE', 'RANGE', 'LOCATION', 'JSON')),
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    is_searchable BOOLEAN NOT NULL DEFAULT TRUE,
    is_filterable BOOLEAN NOT NULL DEFAULT TRUE,
    is_sortable BOOLEAN NOT NULL DEFAULT FALSE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    validation_rules JSONB DEFAULT '{}'::jsonb, -- min, max, regex, unit, etc.
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_attr_domain_slug UNIQUE (domain_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_attr_def_domain ON domains.attribute_definitions(domain_id);

CREATE TRIGGER update_attr_def_updated_at
    BEFORE UPDATE ON domains.attribute_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Attribute Options (for SELECT and MULTISELECT types)
CREATE TABLE IF NOT EXISTS domains.attribute_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attribute_id UUID NOT NULL REFERENCES domains.attribute_definitions(id) ON DELETE CASCADE,
    label VARCHAR(150) NOT NULL,
    value VARCHAR(150) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_attr_option UNIQUE (attribute_id, value)
);

CREATE INDEX IF NOT EXISTS idx_attr_options_attr ON domains.attribute_options(attribute_id);

-- 5. Category Attributes Junction (associates attributes to categories)
CREATE TABLE IF NOT EXISTS domains.category_attributes (
    category_id UUID NOT NULL REFERENCES domains.categories(id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL REFERENCES domains.attribute_definitions(id) ON DELETE CASCADE,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (category_id, attribute_id)
);

-- 6. Category UI Templates & Layout Configuration
CREATE TABLE IF NOT EXISTS domains.category_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL UNIQUE REFERENCES domains.categories(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    card_fields JSONB NOT NULL DEFAULT '["price", "title", "location"]'::jsonb,
    detail_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    search_filters JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_cat_templates_updated_at
    BEFORE UPDATE ON domains.category_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Partner Domain & Category Permissions (Section 6.3 of Master Documentation)
CREATE TABLE IF NOT EXISTS organizations.tenant_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    domain_id UUID NOT NULL REFERENCES domains.domains(id) ON DELETE CASCADE,
    allowed_categories JSONB DEFAULT '["*"]'::jsonb, -- Array of category IDs or ["*"] for all
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_domain UNIQUE (organization_id, domain_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_domains_org ON organizations.tenant_domains(organization_id);

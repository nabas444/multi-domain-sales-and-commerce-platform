-- 009_crm_and_sales.sql
-- Unified CRM, Leads, Attribution, Activities, Sales Pipelines, Deals, Appointments, Quotations

CREATE SCHEMA IF NOT EXISTS crm;
CREATE SCHEMA IF NOT EXISTS sales;

-- 1. Customers Profile
CREATE TABLE IF NOT EXISTS crm.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    secondary_phone VARCHAR(50),
    preferred_contact_method VARCHAR(20) DEFAULT 'PHONE' CHECK (preferred_contact_method IN ('PHONE', 'WHATSAPP', 'EMAIL', 'TELEGRAM')),
    city VARCHAR(100),
    budget_min NUMERIC(15, 2),
    budget_max NUMERIC(15, 2),
    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_customer_org_phone UNIQUE (organization_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_customers_org ON crm.customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON crm.customers(phone);

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON crm.customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Leads & Multi-Touch Attribution (Determines commercial entitlement)
CREATE TABLE IF NOT EXISTS crm.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    domain_id UUID NOT NULL REFERENCES domains.domains(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES crm.customers(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES inventory.listings(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES organizations.branches(id) ON DELETE SET NULL,
    assigned_agent_id UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'PLATFORM' CHECK (source IN (
        'PLATFORM', 'PARTNER', 'AGENT', 'CAMPAIGN', 'ORGANIC', 'REFERRAL', 'IMPORT', 'DIRECT_INQUIRY'
    )),
    attribution_type VARCHAR(50) NOT NULL DEFAULT 'FIRST_TOUCH' CHECK (attribution_type IN (
        'FIRST_TOUCH', 'LAST_TOUCH', 'ASSIGNED_AGENT', 'PARTNER_INVENTORY', 'CAMPAIGN', 'MANUAL_OVERRIDE'
    )),
    attribution_details JSONB DEFAULT '{}'::jsonb, -- UTM tags, referrer url, campaign_id, overrides
    status VARCHAR(50) NOT NULL DEFAULT 'NEW' CHECK (status IN (
        'NEW', 'CONTACTED', 'QUALIFIED', 'APPOINTMENT_SCHEDULED', 'NEGOTIATING', 'WON', 'LOST', 'DISQUALIFIED'
    )),
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    score INTEGER NOT NULL DEFAULT 50, -- Lead scoring 0-100
    requirements JSONB DEFAULT '{}'::jsonb, -- Property requirements, vehicle model, elevator capacity, etc.
    inquiry_message TEXT,
    sla_deadline TIMESTAMPTZ,
    sla_breached BOOLEAN NOT NULL DEFAULT FALSE,
    first_response_at TIMESTAMPTZ,
    qualified_at TIMESTAMPTZ,
    lost_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_org ON crm.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_agent ON crm.leads(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON crm.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_domain ON crm.leads(domain_id);
CREATE INDEX IF NOT EXISTS idx_leads_created ON crm.leads(created_at DESC);

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON crm.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Lead Activities & Interactions Timeline
CREATE TABLE IF NOT EXISTS crm.lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES crm.leads(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'CALL', 'NOTE', 'EMAIL', 'WHATSAPP', 'MEETING', 'SITE_VISIT', 'STATUS_CHANGE', 'ASSIGNMENT', 'QUALIFICATION'
    )),
    subject VARCHAR(200) NOT NULL,
    body TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON crm.lead_activities(lead_id, created_at DESC);

-- 4. Follow-up Tasks & Reminders
CREATE TABLE IF NOT EXISTS crm.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES crm.leads(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_org ON crm.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON crm.tasks(assigned_to, is_completed, due_date ASC);

-- 5. Sales Pipelines
CREATE TABLE IF NOT EXISTS sales.pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    domain_id UUID NOT NULL REFERENCES domains.domains(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pipelines_org ON sales.pipelines(organization_id);

-- 6. Pipeline Stages
CREATE TABLE IF NOT EXISTS sales.pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id UUID NOT NULL REFERENCES sales.pipelines(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    stage_order INTEGER NOT NULL DEFAULT 0,
    win_probability INTEGER NOT NULL DEFAULT 10 CHECK (win_probability BETWEEN 0 AND 100),
    required_fields JSONB DEFAULT '[]'::jsonb, -- Fields required before moving to next stage
    is_won_stage BOOLEAN NOT NULL DEFAULT FALSE,
    is_lost_stage BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stages_pipeline ON sales.pipeline_stages(pipeline_id, stage_order ASC);

-- 7. Deals / Commercial Opportunities
CREATE TABLE IF NOT EXISTS sales.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    domain_id UUID NOT NULL REFERENCES domains.domains(id) ON DELETE RESTRICT,
    pipeline_id UUID NOT NULL REFERENCES sales.pipelines(id) ON DELETE RESTRICT,
    stage_id UUID NOT NULL REFERENCES sales.pipeline_stages(id) ON DELETE RESTRICT,
    lead_id UUID REFERENCES crm.leads(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES crm.customers(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES inventory.listings(id) ON DELETE SET NULL,
    assigned_agent_id UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    deal_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'WON', 'LOST', 'ABANDONED')),
    expected_close_date DATE,
    actual_close_date DATE,
    lost_reason TEXT,
    commission_calculated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deals_org ON sales.deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON sales.deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_agent ON sales.deals(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON sales.deals(status);

CREATE TRIGGER update_deals_updated_at
    BEFORE UPDATE ON sales.deals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Appointments & Site Visits
CREATE TABLE IF NOT EXISTS sales.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES crm.leads(id) ON DELETE SET NULL,
    listing_id UUID REFERENCES inventory.listings(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES crm.customers(id) ON DELETE CASCADE,
    host_agent_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE RESTRICT,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'SITE_VISIT', 'VIRTUAL_TOUR', 'OFFICE_MEETING', 'TECHNICAL_SURVEY', 'INSPECTION'
    )),
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN (
        'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
    )),
    notes TEXT,
    feedback TEXT,
    checklist_results JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_agent ON sales.appointments(host_agent_id, scheduled_start ASC);
CREATE INDEX IF NOT EXISTS idx_appointments_org ON sales.appointments(organization_id);

-- 9. Commercial Quotations & Proposals
CREATE TABLE IF NOT EXISTS sales.quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES sales.deals(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES crm.customers(id) ON DELETE CASCADE,
    quotation_number VARCHAR(100) NOT NULL UNIQUE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ description, quantity, unit_price, total }]
    total_amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'
    )),
    valid_until DATE NOT NULL,
    terms_and_conditions TEXT,
    created_by UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quotations_org ON sales.quotations(organization_id);

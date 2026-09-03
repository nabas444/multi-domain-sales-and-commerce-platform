-- 012_marketing_and_integrations.sql
-- Marketing Campaigns, Lead Attribution Events, CMS/Landing Pages, Webhooks, and Bulk Import/Export Jobs

CREATE SCHEMA IF NOT EXISTS marketing;
CREATE SCHEMA IF NOT EXISTS content;

-- 1. Marketing Campaigns
CREATE TABLE IF NOT EXISTS marketing.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    domain_id UUID REFERENCES domains.domains(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    objective VARCHAR(100) NOT NULL, -- 'LEAD_GENERATION', 'BRAND_AWARENESS', 'LISTING_PROMOTION'
    budget NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    spent NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED')),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaigns_org ON marketing.campaigns(organization_id);

-- 2. Marketing Attribution Events (Connects leads and deals directly to marketing spend)
CREATE TABLE IF NOT EXISTS marketing.attribution_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES marketing.campaigns(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES crm.leads(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES sales.deals(id) ON DELETE SET NULL,
    visitor_id VARCHAR(100),
    utm_params JSONB DEFAULT '{}'::jsonb,
    conversion_type VARCHAR(50) NOT NULL, -- 'INQUIRY', 'QUALIFIED', 'APPOINTMENT', 'DEAL_WON'
    conversion_value NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attr_events_camp ON marketing.attribution_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_attr_events_lead ON marketing.attribution_events(lead_id);

-- 3. CMS Landing Pages
CREATE TABLE IF NOT EXISTS content.landing_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID REFERENCES domains.domains(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    hero_headline VARCHAR(255),
    hero_subheadline TEXT,
    content_blocks JSONB NOT NULL DEFAULT '[]'::jsonb, -- dynamic block layout
    seo_title VARCHAR(200),
    seo_description TEXT,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. CMS Articles & Guides
CREATE TABLE IF NOT EXISTS content.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID REFERENCES domains.domains(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    summary TEXT,
    content TEXT NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    cover_image_url TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Webhooks Management
CREATE TABLE IF NOT EXISTS platform.webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    secret VARCHAR(255) NOT NULL,
    event_types JSONB NOT NULL DEFAULT '["lead.created", "deal.closed"]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhooks_org ON platform.webhooks(organization_id);

-- 6. Webhook Deliveries Log
CREATE TABLE IF NOT EXISTS platform.webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES platform.webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status_code INTEGER,
    response_body TEXT,
    attempt INTEGER NOT NULL DEFAULT 1,
    succeeded BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deliveries_webhook ON platform.webhook_deliveries(webhook_id, created_at DESC);

-- 7. Bulk Import Jobs
CREATE TABLE IF NOT EXISTS platform.import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    domain_id UUID REFERENCES domains.domains(id) ON DELETE SET NULL,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('LISTINGS', 'LEADS', 'CUSTOMERS', 'PRODUCTS')),
    file_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    total_rows INTEGER NOT NULL DEFAULT 0,
    processed_rows INTEGER NOT NULL DEFAULT 0,
    error_rows INTEGER NOT NULL DEFAULT 0,
    errors_log JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_imports_org ON platform.import_jobs(organization_id);

-- 8. Bulk Export Jobs
CREATE TABLE IF NOT EXISTS platform.export_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('LISTINGS', 'LEADS', 'CUSTOMERS', 'LEDGER')),
    format VARCHAR(20) NOT NULL DEFAULT 'CSV' CHECK (format IN ('CSV', 'JSON')),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    download_url TEXT,
    row_count INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

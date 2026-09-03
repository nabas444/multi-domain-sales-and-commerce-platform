-- 010_workflows_and_notifications.sql
-- Workflows Engine, Form Definitions, and Notifications Center

CREATE SCHEMA IF NOT EXISTS notifications;

-- 1. Configurable Business Workflows
CREATE TABLE IF NOT EXISTS platform.workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID REFERENCES domains.domains(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    trigger_event VARCHAR(100) NOT NULL, -- e.g. 'lead.created', 'deal.closed', 'sla.breached', 'appointment.completed'
    conditions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of condition rules
    actions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of actions: notify, assign, create_task, webhook
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflows_trigger ON platform.workflows(trigger_event) WHERE is_active = TRUE;

-- 2. Dynamic Form Definitions (Inquiry, Quote, Survey Forms)
CREATE TABLE IF NOT EXISTS platform.form_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID REFERENCES domains.domains(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of field definitions
    validation_rules JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Notification Templates
CREATE TABLE IF NOT EXISTS notifications.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    body_template TEXT NOT NULL,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. User Notifications
CREATE TABLE IF NOT EXISTS notifications.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations.tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'IN_APP' CHECK (channel IN ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP')),
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications.notifications(organization_id);

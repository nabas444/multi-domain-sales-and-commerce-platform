-- 006_settings_and_theme.sql
-- Configuration Control Plane: Settings definitions, values, versions, approvals, feature flags, and theme tokens

CREATE SCHEMA IF NOT EXISTS platform;

-- 1. Settings Definitions (Metadata Registry)
CREATE TABLE IF NOT EXISTS platform.settings_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(150) NOT NULL UNIQUE,
    data_type VARCHAR(50) NOT NULL CHECK (data_type IN ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ENUM', 'COLOR', 'DURATION')),
    label VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- 'GENERAL', 'BRANDING', 'SECURITY', 'LISTINGS', 'CRM', 'WORKFLOW', 'COMMERCIAL', 'NOTIFICATIONS', 'API'
    sensitivity VARCHAR(50) NOT NULL DEFAULT 'LOW' CHECK (sensitivity IN ('LOW', 'OPERATIONAL', 'SECURITY', 'FINANCIAL', 'LEGAL', 'INFRASTRUCTURE')),
    allowed_scopes TEXT[] NOT NULL DEFAULT '{"PLATFORM"}', -- Array of 'PLATFORM', 'DOMAIN', 'ORGANIZATION', 'BRANCH', 'ROLE', 'USER', 'CATEGORY'
    validation_schema JSONB DEFAULT '{}'::jsonb,
    default_value JSONB NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_secret BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_settings_def_key ON platform.settings_definitions(key);
CREATE INDEX IF NOT EXISTS idx_settings_def_category ON platform.settings_definitions(category);
CREATE INDEX IF NOT EXISTS idx_settings_def_sensitivity ON platform.settings_definitions(sensitivity);

CREATE TRIGGER update_settings_def_updated_at
    BEFORE UPDATE ON platform.settings_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Scoped Settings Values
CREATE TABLE IF NOT EXISTS platform.settings_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id UUID NOT NULL REFERENCES platform.settings_definitions(id) ON DELETE CASCADE,
    scope VARCHAR(50) NOT NULL CHECK (scope IN ('PLATFORM', 'DOMAIN', 'ORGANIZATION', 'BRANCH', 'ROLE', 'USER', 'CATEGORY')),
    scope_id VARCHAR(100) NOT NULL DEFAULT 'GLOBAL', -- 'GLOBAL' for platform, or UUID of domain/org/user
    value JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_setting_scope UNIQUE (definition_id, scope, scope_id)
);

CREATE INDEX IF NOT EXISTS idx_settings_val_scope ON platform.settings_values(scope, scope_id);
CREATE INDEX IF NOT EXISTS idx_settings_val_def ON platform.settings_values(definition_id);

CREATE TRIGGER update_settings_val_updated_at
    BEFORE UPDATE ON platform.settings_values
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Settings Versions & History for Audit and Safe Rollback
CREATE TABLE IF NOT EXISTS platform.settings_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_value_id UUID NOT NULL REFERENCES platform.settings_values(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    value JSONB NOT NULL,
    reason TEXT,
    changed_by UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_settings_ver_val ON platform.settings_versions(setting_value_id, version DESC);

-- 4. Settings Approvals Queue for Sensitive Changes
CREATE TABLE IF NOT EXISTS platform.settings_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    definition_id UUID NOT NULL REFERENCES platform.settings_definitions(id) ON DELETE CASCADE,
    scope VARCHAR(50) NOT NULL,
    scope_id VARCHAR(100) NOT NULL,
    current_value JSONB,
    proposed_value JSONB NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    requested_by UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    reviewed_by UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_settings_appr_status ON platform.settings_approvals(status);

-- 5. Feature State Model (Feature Flags)
CREATE TABLE IF NOT EXISTS platform.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    state VARCHAR(50) NOT NULL DEFAULT 'OFF' CHECK (state IN ('ON', 'OFF', 'READ_ONLY', 'HIDDEN', 'CONDITIONAL', 'BETA', 'REQUIRES_APPROVAL')),
    scope VARCHAR(50) NOT NULL DEFAULT 'PLATFORM',
    scope_id VARCHAR(100) NOT NULL DEFAULT 'GLOBAL',
    rules JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_flags_key ON platform.feature_flags(key);

CREATE TRIGGER update_flags_updated_at
    BEFORE UPDATE ON platform.feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Theme Tokens System
CREATE TABLE IF NOT EXISTS platform.theme_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    scope VARCHAR(50) NOT NULL DEFAULT 'PLATFORM' CHECK (scope IN ('PLATFORM', 'DOMAIN', 'ORGANIZATION', 'USER')),
    scope_id VARCHAR(100) NOT NULL DEFAULT 'GLOBAL',
    palette VARCHAR(50) NOT NULL DEFAULT 'monochrome-light',
    tokens JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_theme_scope ON platform.theme_tokens(scope, scope_id);

CREATE TRIGGER update_theme_updated_at
    BEFORE UPDATE ON platform.theme_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

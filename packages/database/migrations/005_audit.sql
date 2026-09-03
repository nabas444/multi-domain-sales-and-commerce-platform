-- 005_audit.sql
-- Immutable Audit Logging Architecture

CREATE TABLE IF NOT EXISTS audit.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES identity.users(id) ON DELETE SET NULL,
    actor_email VARCHAR(255),
    organization_id UUID REFERENCES organizations.tenants(id) ON DELETE SET NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    correlation_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    state_diff JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_org ON audit.audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit.audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit.audit_logs(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_correlation ON audit.audit_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit.audit_logs(created_at DESC);

-- Enforce append-only immutability: Disallow UPDATE and DELETE on audit logs
CREATE OR REPLACE FUNCTION audit.prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable. UPDATE and DELETE operations are strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_audit_immutability
    BEFORE UPDATE OR DELETE ON audit.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION audit.prevent_audit_log_modification();

-- 002_identity.sql
-- Identity: users, sessions, mfa_methods

CREATE TABLE IF NOT EXISTS identity.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON identity.users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON identity.users(is_active) WHERE deleted_at IS NULL;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON identity.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- User Sessions
CREATE TABLE IF NOT EXISTS identity.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON identity.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON identity.sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON identity.sessions(expires_at) WHERE revoked_at IS NULL;

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON identity.sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- MFA Methods
CREATE TABLE IF NOT EXISTS identity.mfa_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES identity.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('TOTP', 'SMS', 'EMAIL')),
    secret_encrypted TEXT NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_mfa_type UNIQUE (user_id, type)
);

CREATE INDEX IF NOT EXISTS idx_mfa_user ON identity.mfa_methods(user_id);

CREATE TRIGGER update_mfa_updated_at
    BEFORE UPDATE ON identity.mfa_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

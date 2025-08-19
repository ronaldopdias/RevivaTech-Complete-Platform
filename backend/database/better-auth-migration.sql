-- Better Auth Migration Script
-- Migrates from NextAuth 5 + Custom Backend to Better Auth
-- This script preserves existing user data and adds Better Auth tables

BEGIN;

-- Create Better Auth core tables
-- Note: We'll keep existing users table and map it to Better Auth

-- 1. Better Auth Account Table (for multiple authentication providers)
CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    accessToken TEXT,
    refreshToken TEXT,
    idToken TEXT,
    expiresAt TIMESTAMP,
    password TEXT, -- For email/password provider
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Better Auth Session Table (replaces user_sessions but with Better Auth format)
CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    expiresAt TIMESTAMP NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Better Auth Verification Table (email verification, password reset, etc.)
CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt TIMESTAMP NOT NULL
);

-- 4. Better Auth Organization Tables (for role-based access)
CREATE TABLE IF NOT EXISTS organization (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    logo TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS member (
    id TEXT PRIMARY KEY,
    organizationId TEXT NOT NULL,
    userId TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizationId) REFERENCES organization(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(organizationId, userId)
);

-- 5. Better Auth Invitation Table
CREATE TABLE IF NOT EXISTS invitation (
    id TEXT PRIMARY KEY,
    organizationId TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT,
    status TEXT DEFAULT 'pending',
    expiresAt TIMESTAMP NOT NULL,
    inviterId TEXT NOT NULL,
    FOREIGN KEY (organizationId) REFERENCES organization(id) ON DELETE CASCADE,
    FOREIGN KEY (inviterId) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Two-Factor Authentication Table
CREATE TABLE IF NOT EXISTS twoFactor (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    secret TEXT NOT NULL,
    backupCodes TEXT[],
    verified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Add indexes for Better Auth performance
CREATE INDEX IF NOT EXISTS idx_account_user_id ON account(userId);
CREATE INDEX IF NOT EXISTS idx_account_provider ON account(providerId, accountId);
CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(userId);
CREATE INDEX IF NOT EXISTS idx_session_expires ON session(expiresAt);
CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);
CREATE INDEX IF NOT EXISTS idx_verification_expires ON verification(expiresAt);
CREATE INDEX IF NOT EXISTS idx_member_org_id ON member(organizationId);
CREATE INDEX IF NOT EXISTS idx_member_user_id ON member(userId);
CREATE INDEX IF NOT EXISTS idx_invitation_org_id ON invitation(organizationId);
CREATE INDEX IF NOT EXISTS idx_invitation_email ON invitation(email);
CREATE INDEX IF NOT EXISTS idx_two_factor_user_id ON twoFactor(userId);

-- Migrate existing user data to Better Auth format
-- Create default organization for RevivaTech
INSERT INTO organization (id, name, slug, createdAt) 
VALUES ('revivatech-org', 'RevivaTech', 'revivatech', CURRENT_TIMESTAMP)
ON CONFLICT (slug) DO NOTHING;

-- Add all existing users to the default organization with their current roles
INSERT INTO member (id, organizationId, userId, role, createdAt)
SELECT 
    'member-' || u.id,
    'revivatech-org',
    u.id,
    CASE 
        WHEN u.role = 'SUPER_ADMIN' THEN 'owner'
        WHEN u.role = 'ADMIN' THEN 'admin'
        WHEN u.role = 'TECHNICIAN' THEN 'member'
        ELSE 'member'
    END,
    COALESCE(u."createdAt", CURRENT_TIMESTAMP)
FROM users u
ON CONFLICT (organizationId, userId) DO NOTHING;

-- Create account entries for existing users (email/password provider)
INSERT INTO account (id, userId, accountId, providerId, password)
SELECT 
    'account-' || u.id,
    u.id,
    u.email,
    'credential', -- Better Auth's email/password provider
    u.password_hash
FROM users u
ON CONFLICT (id) DO NOTHING;

-- Migrate existing sessions to Better Auth format
-- Note: existing refresh tokens will be invalidated, users will need to re-login
-- This is safer for security during migration
INSERT INTO session (id, userId, expiresAt, ipAddress, userAgent)
SELECT 
    'session-' || us.id::TEXT,
    us.user_id,
    us.expires_at,
    us.ip_address::TEXT,
    COALESCE(us.device_info->>'userAgent', 'Unknown')
FROM user_sessions us
WHERE us.expires_at > CURRENT_TIMESTAMP
ON CONFLICT (id) DO NOTHING;

-- Create a migration status table to track completion
CREATE TABLE IF NOT EXISTS better_auth_migration (
    id SERIAL PRIMARY KEY,
    step TEXT NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

INSERT INTO better_auth_migration (step, notes) 
VALUES ('schema_creation', 'Better Auth tables created and existing data migrated');

COMMIT;

-- Migration completed successfully
-- Next steps:
-- 1. Update application to use Better Auth
-- 2. Test authentication flows
-- 3. Once stable, can optionally drop old user_sessions table
-- Fix Better Auth Schema: Update existing tables to match Better Auth expectations
-- This script updates existing tables to work properly with Better Auth

-- First, let's drop any conflicting tables and recreate them properly
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS "account" CASCADE;
DROP TABLE IF EXISTS "verification" CASCADE;
DROP TABLE IF EXISTS "member" CASCADE;
DROP TABLE IF EXISTS "invitation" CASCADE;
DROP TABLE IF EXISTS "two_factor" CASCADE;

-- Recreate session table with proper column names
CREATE TABLE "session" (
  id TEXT PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  active_organization_id TEXT
);

-- Recreate account table with proper column names  
CREATE TABLE "account" (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TIMESTAMP,
  refresh_token_expires_at TIMESTAMP,
  scope TEXT,
  password TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Recreate verification table
CREATE TABLE "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Recreate member table with proper references
CREATE TABLE "member" (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' NOT NULL,
  created_at TIMESTAMP NOT NULL
);

-- Recreate invitation table with proper references
CREATE TABLE "invitation" (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT,
  status TEXT DEFAULT 'pending' NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  inviter_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- Recreate two_factor table with proper column names
CREATE TABLE "two_factor" (
  id TEXT PRIMARY KEY,
  secret TEXT NOT NULL,
  backup_codes TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- Create proper indexes
CREATE INDEX idx_session_user_id ON "session"(user_id);
CREATE INDEX idx_session_expires ON "session"(expires_at);
CREATE INDEX idx_account_user_id ON "account"(user_id);
CREATE INDEX idx_member_user_id ON "member"(user_id);
CREATE INDEX idx_member_org_id ON "member"(organization_id);
CREATE INDEX idx_invitation_org_id ON "invitation"(organization_id);
CREATE INDEX idx_invitation_inviter ON "invitation"(inviter_id);
CREATE INDEX idx_two_factor_user_id ON "two_factor"(user_id);

-- Add helpful comments
COMMENT ON TABLE "user" IS 'Better Auth user table with official schema';
COMMENT ON TABLE "session" IS 'Better Auth session management';
COMMENT ON TABLE "account" IS 'Better Auth account providers';
COMMENT ON TABLE "verification" IS 'Better Auth verification tokens';
COMMENT ON TABLE "organization" IS 'Better Auth organizations';
COMMENT ON TABLE "member" IS 'Better Auth organization members';
COMMENT ON TABLE "invitation" IS 'Better Auth organization invitations';
COMMENT ON TABLE "two_factor" IS 'Better Auth two-factor authentication';

-- Create a default admin user for testing
INSERT INTO "user" (id, name, email, email_verified, first_name, last_name, role, is_active, created_at, updated_at)
VALUES (
  'admin-' || gen_random_uuid()::text,
  'Admin User',
  'admin@revivatech.co.uk', 
  true,
  'Admin',
  'User',
  'SUPER_ADMIN',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

SELECT 'Better Auth schema successfully configured!' as status;
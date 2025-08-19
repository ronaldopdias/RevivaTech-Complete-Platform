-- Fresh Better Auth Database Schema
-- Based on frontend/src/lib/auth/schema.ts
-- Creates all necessary tables for Better Auth

BEGIN;

-- Drop existing Better Auth tables if they exist (clean start)
DROP TABLE IF EXISTS invitation CASCADE;
DROP TABLE IF EXISTS member CASCADE;
DROP TABLE IF EXISTS organization CASCADE;
DROP TABLE IF EXISTS "twoFactor" CASCADE;
DROP TABLE IF EXISTS verification CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS session CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- Create user table (Better Auth core table with RevivaTech extensions)
CREATE TABLE "user" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    image TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- RevivaTech specific fields
    "firstName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL DEFAULT '',
    phone TEXT,
    role TEXT CHECK (role IN ('CUSTOMER', 'TECHNICIAN', 'ADMIN', 'SUPER_ADMIN')) NOT NULL DEFAULT 'CUSTOMER',
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create indexes for user table
CREATE INDEX "user_email_idx" ON "user"(email);

-- Create session table (Better Auth sessions)
CREATE TABLE session (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "expiresAt" TIMESTAMP NOT NULL,
    token TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- Create indexes for session table
CREATE INDEX "session_userId_idx" ON session("userId");
CREATE INDEX "session_token_idx" ON session(token);

-- Create account table (Better Auth accounts for OAuth and password)
CREATE TABLE account (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP,
    "refreshTokenExpiresAt" TIMESTAMP,
    scope TEXT,
    password TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for account table
CREATE INDEX "account_userId_idx" ON account("userId");
CREATE INDEX "account_provider_account_idx" ON account("providerId", "accountId");

-- Create verification table (Better Auth email verification)
CREATE TABLE verification (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for verification table
CREATE INDEX "verification_identifier_idx" ON verification(identifier);

-- Create two factor authentication table (Better Auth plugin)
CREATE TABLE "twoFactor" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    secret TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create organization table (Better Auth plugin)
CREATE TABLE organization (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    logo TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create member table (Better Auth plugin)
CREATE TABLE member (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "organizationId" TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for member table
CREATE INDEX "member_organizationId_idx" ON member("organizationId");
CREATE INDEX "member_userId_idx" ON member("userId");
CREATE INDEX "member_org_user_idx" ON member("organizationId", "userId");

-- Create invitation table (Better Auth plugin)
CREATE TABLE invitation (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "organizationId" TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP NOT NULL,
    "inviterId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for invitation table
CREATE INDEX "invitation_organizationId_idx" ON invitation("organizationId");

-- Insert a default admin user for testing
INSERT INTO "user" (id, name, email, "firstName", "lastName", role, "isActive", "emailVerified") 
VALUES (
    gen_random_uuid()::TEXT,
    'Admin User',
    'admin@revivatech.co.uk',
    'Admin',
    'User',
    'ADMIN',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

COMMIT;

-- Verify tables were created
\dt
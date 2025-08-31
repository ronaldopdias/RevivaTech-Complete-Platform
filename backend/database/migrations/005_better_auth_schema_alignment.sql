-- Better Auth Schema Alignment Migration
-- Fixes Google OAuth callback errors by aligning database schema with Better Auth v1.3.7 expectations
-- Date: August 30, 2025

-- Step 1: Update accounts table field names to match Better Auth expectations
ALTER TABLE accounts RENAME COLUMN "accountId" TO "providerAccountId";
ALTER TABLE accounts RENAME COLUMN "providerId" TO "provider"; 
ALTER TABLE accounts RENAME COLUMN "accessToken" TO "access_token";
ALTER TABLE accounts RENAME COLUMN "refreshToken" TO "refresh_token";
ALTER TABLE accounts RENAME COLUMN "idToken" TO "id_token";
ALTER TABLE accounts RENAME COLUMN "accessTokenExpiresAt" TO "expires_at";
ALTER TABLE accounts RENAME COLUMN "refreshTokenExpiresAt" TO "refresh_token_expires_at";

-- Step 2: Add missing required fields for Better Auth compatibility
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS "token_type" TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS "scope" TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS "session_state" TEXT;

-- Step 3: Update existing records with appropriate default values
UPDATE accounts SET "type" = 'oauth' WHERE "type" IS NULL;
UPDATE accounts SET "token_type" = 'Bearer' WHERE "token_type" IS NULL AND "access_token" IS NOT NULL;

-- Step 4: Create indexes for Better Auth performance
CREATE INDEX IF NOT EXISTS "accounts_provider_providerAccountId_idx" ON accounts("provider", "providerAccountId");
CREATE INDEX IF NOT EXISTS "accounts_userId_idx" ON accounts("userId");

-- Step 5: Verify the migration by checking updated structure
-- This will show the new column names in the migration log
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'accounts' 
ORDER BY ordinal_position;
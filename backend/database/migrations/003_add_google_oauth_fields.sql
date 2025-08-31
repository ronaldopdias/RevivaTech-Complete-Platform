-- Migration: Add Google OAuth Fields to Better Auth User Table
-- Created: August 30, 2025
-- Purpose: Enhance user profiles with additional Google OAuth data

BEGIN;

-- Add Google OAuth specific fields to the users table (correct table name)
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "googleId" TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS "profilePicture" TEXT,
ADD COLUMN IF NOT EXISTS "locale" TEXT,
ADD COLUMN IF NOT EXISTS "domain" TEXT;

-- Create index for Google ID lookups (for faster authentication)
CREATE INDEX IF NOT EXISTS "users_googleId_idx" ON "users"("googleId");

-- Create index for domain lookups (for Google Workspace accounts)
CREATE INDEX IF NOT EXISTS "users_domain_idx" ON "users"("domain");

-- Add comments to document the new fields
COMMENT ON COLUMN "users"."googleId" IS 'Google permanent user identifier (sub claim from OAuth)';
COMMENT ON COLUMN "users"."profilePicture" IS 'URL to Google profile picture (may expire)';
COMMENT ON COLUMN "users"."locale" IS 'User language/locale preference from Google';
COMMENT ON COLUMN "users"."domain" IS 'Google Workspace domain for organization accounts';

-- Update the existing admin user to have a Google ID for testing (optional)
-- This would typically be done when the admin user logs in via Google OAuth
-- UPDATE "user" SET "locale" = 'en-GB' WHERE email = 'admin@revivatech.co.uk';

COMMIT;

-- Verify the migration
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
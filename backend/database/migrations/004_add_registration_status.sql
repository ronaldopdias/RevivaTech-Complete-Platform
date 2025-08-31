-- Migration: Add Registration Status for Progressive Registration
-- Created: August 30, 2025
-- Purpose: Support Google OAuth progressive registration flow

BEGIN;

-- Create ENUM type for registration status
CREATE TYPE registration_status_enum AS ENUM (
    'COMPLETE',
    'PENDING_PROFILE_COMPLETION'
);

-- Add registration status fields to users table
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "registrationStatus" registration_status_enum DEFAULT 'COMPLETE',
ADD COLUMN IF NOT EXISTS "profileCompletedAt" TIMESTAMP;

-- Create index for efficient queries on registration status
CREATE INDEX IF NOT EXISTS "users_registrationStatus_idx" ON "users"("registrationStatus");

-- Add comments to document the new fields
COMMENT ON COLUMN "users"."registrationStatus" IS 'User registration completion status for progressive registration flow';
COMMENT ON COLUMN "users"."profileCompletedAt" IS 'Timestamp when user completed profile after OAuth registration';

-- Update existing users to have COMPLETE status (they already have complete profiles)
UPDATE "users" SET "registrationStatus" = 'COMPLETE', "profileCompletedAt" = "createdAt" 
WHERE "registrationStatus" IS NULL;

COMMIT;

-- Verify the migration
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('registrationStatus', 'profileCompletedAt')
ORDER BY ordinal_position;
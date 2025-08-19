-- Better Auth Migration: Ensure compatibility with existing data
-- This script creates test users with Better Auth compatible data

BEGIN;

-- Create test user compatible with Better Auth
INSERT INTO users (id, email, "firstName", "lastName", role, "isActive", "isVerified", "createdAt", "updatedAt")
VALUES 
    ('test-user-1', 'test@revivatech.co.uk', 'Test', 'User', 'ADMIN', true, true, NOW(), NOW()),
    ('admin-user-1', 'admin@revivatech.co.uk', 'Admin', 'User', 'ADMIN', true, true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    role = EXCLUDED.role,
    "isActive" = EXCLUDED."isActive",
    "isVerified" = EXCLUDED."isVerified",
    "updatedAt" = NOW();

-- Create account entries for email/password authentication (Better Auth format)
INSERT INTO account (id, userid, accountid, providerid, password, "created_at", "updated_at")
SELECT 
    'account-' || u.id,
    u.id,
    u.email,
    'credential',
    -- For now, create a test password hash (we'll handle proper password migration later)
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LJ9gJ.SfpHKYaIXhW', -- 'password'
    NOW(),
    NOW()
FROM users u 
WHERE u.email IN ('test@revivatech.co.uk', 'admin@revivatech.co.uk')
ON CONFLICT (id) DO UPDATE SET
    password = EXCLUDED.password,
    "updated_at" = NOW();

COMMIT;

-- Verification query to check our test data
SELECT 
    u.id, u.email, u."firstName", u."lastName", u.role, u."isActive", u."isVerified",
    a.id as account_id, a.providerid
FROM users u
LEFT JOIN account a ON u.id = a.userid
WHERE u.email IN ('test@revivatech.co.uk', 'admin@revivatech.co.uk');
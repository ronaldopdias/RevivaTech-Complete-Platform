-- Cleanup: Remove deprecated authentication tables
-- Only run after verifying all data has been migrated to Better Auth

BEGIN;

-- Step 1: Verify no important data will be lost
SELECT 
  'customers' as table_name,
  COUNT(*) as row_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'SAFE TO DROP'
    ELSE 'CONTAINS DATA - REVIEW BEFORE DROPPING'
  END as safety_status
FROM customers;

-- Step 2: Remove deprecated customers table (if empty)
-- Uncomment the following line only after verifying the table is empty
-- DROP TABLE IF EXISTS customers CASCADE;

-- Step 3: List remaining authentication-related tables
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN tablename IN ('user', 'session', 'account', 'verification', 'twoFactor', 'organization', 'member', 'invitation') 
    THEN 'Better Auth - KEEP'
    WHEN tablename = 'customers'
    THEN 'Legacy - DEPRECATED'
    ELSE 'Other'
  END as table_category
FROM pg_tables 
WHERE schemaname = 'public' 
  AND (tablename LIKE '%user%' OR tablename LIKE '%session%' OR tablename LIKE '%auth%' OR tablename = 'customers')
ORDER BY table_category, tablename;

-- Step 4: Display cleanup summary
SELECT 'Database cleanup prepared. Review output before executing DROP statements.' as status;

COMMIT;
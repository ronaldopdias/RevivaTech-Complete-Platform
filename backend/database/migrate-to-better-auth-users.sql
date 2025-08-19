-- Migration: Update foreign keys to reference Better Auth user table
-- This migrates from legacy customers table to Better Auth user table

BEGIN;

-- Step 1: Drop foreign key constraints to customers table
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_customer_id_fkey;
ALTER TABLE booking_analytics DROP CONSTRAINT IF EXISTS booking_analytics_customer_id_fkey;

-- Step 2: Add new foreign key constraints to Better Auth user table
-- Note: customer_id columns will now reference Better Auth user.id instead of customers.id

ALTER TABLE bookings 
ADD CONSTRAINT bookings_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES "user"(id) ON DELETE CASCADE;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES "user"(id) ON DELETE CASCADE;

ALTER TABLE booking_analytics 
ADD CONSTRAINT booking_analytics_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES "user"(id) ON DELETE CASCADE;

-- Step 3: Add comment to customers table indicating it's deprecated
COMMENT ON TABLE customers IS 'DEPRECATED: This table is no longer used. All user management moved to Better Auth user table.';

-- Step 4: Verify constraints
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as references_table
FROM pg_constraint 
WHERE confrelid = '"user"'::regclass 
  AND conname LIKE '%customer_id%';

COMMIT;

-- Display migration summary
SELECT 'Migration completed: Customer foreign keys now reference Better Auth user table' as status;
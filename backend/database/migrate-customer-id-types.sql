-- Migration: Convert customer_id columns from UUID to TEXT to match Better Auth
-- This allows foreign keys to reference Better Auth user.id (TEXT type)

BEGIN;

-- Step 1: Drop existing foreign key constraints
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_customer_id_fkey;
ALTER TABLE booking_analytics DROP CONSTRAINT IF EXISTS booking_analytics_customer_id_fkey;

-- Step 2: Convert customer_id columns from UUID to TEXT
-- Since tables are empty, we can safely alter the column types
ALTER TABLE bookings ALTER COLUMN customer_id TYPE TEXT;
ALTER TABLE notifications ALTER COLUMN customer_id TYPE TEXT;
ALTER TABLE booking_analytics ALTER COLUMN customer_id TYPE TEXT;

-- Step 3: Add foreign key constraints to Better Auth user table
ALTER TABLE bookings 
ADD CONSTRAINT bookings_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES "user"(id) ON DELETE CASCADE;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES "user"(id) ON DELETE CASCADE;

ALTER TABLE booking_analytics 
ADD CONSTRAINT booking_analytics_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES "user"(id) ON DELETE CASCADE;

-- Step 4: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_customer_id ON notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_booking_analytics_customer_id ON booking_analytics(customer_id);

-- Step 5: Add comment to customers table
COMMENT ON TABLE customers IS 'DEPRECATED: User management moved to Better Auth user table. customer_id columns now reference user.id (TEXT)';

-- Verification
SELECT 'SUCCESS: customer_id columns converted to TEXT and linked to Better Auth user table' as migration_status;

COMMIT;
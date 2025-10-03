-- Add consultation tier to payment_tier enum
-- This allows users to purchase $350 consultation + monograph bundle
-- Created: 2025-10-03
-- Purpose: Enable consultation feature without database constraint errors

-- PostgreSQL doesn't support IF NOT EXISTS for ALTER TYPE ADD VALUE in older versions
-- We'll use a DO block to handle this safely

DO $$
BEGIN
    -- Check if 'consultation' value already exists in the enum
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'payment_tier'
        AND e.enumlabel = 'consultation'
    ) THEN
        -- Add the new enum value
        ALTER TYPE payment_tier ADD VALUE 'consultation';
    END IF;
END
$$;

-- Verify the enum now includes all expected values
-- Expected: 'free', 'enhanced', 'comprehensive', 'consultation'
COMMENT ON TYPE payment_tier IS 'Payment tiers: free, enhanced, comprehensive (monograph), consultation (includes monograph)';

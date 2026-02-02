-- Add missing columns to finance_orders table if they don't exist
ALTER TABLE finance_orders ADD COLUMN IF NOT EXISTS expected_payout_at timestamp with time zone;
ALTER TABLE finance_orders ADD COLUMN IF NOT EXISTS payment_reference text;
ALTER TABLE finance_orders ADD COLUMN IF NOT EXISTS commission_amount numeric(10,2) default 0;
ALTER TABLE finance_orders ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) default 0;
ALTER TABLE finance_orders ADD COLUMN IF NOT EXISTS penalty_amount numeric(10,2) default 0;
ALTER TABLE finance_orders ADD COLUMN IF NOT EXISTS amount numeric(10,2) default 0;

-- Table to store every raw payment line item from Trendyol Excels
-- This allows us to re-calculate order totals if logic changes or data was corrupted
CREATE TABLE IF NOT EXISTS finance_payment_rows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL,
    package_no TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    amount DECIMAL(12,2) NOT NULL,
    commission DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    penalty DECIMAL(12,2) DEFAULT 0,
    transaction_type TEXT,
    raw_row_json JSONB,
    upload_id UUID, -- Optional link to finance_upload_logs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for fast lookup during repair/re-calculation
CREATE INDEX IF NOT EXISTS idx_finance_payment_rows_order_number ON finance_payment_rows(order_number);

-- Optional: Add a unique constraint if we want to prevent exact duplicate rows from being uploaded twice
-- However, Trendyol sometimes has identical rows for different events.
-- We'll use a hash or just trust the upload history for now.

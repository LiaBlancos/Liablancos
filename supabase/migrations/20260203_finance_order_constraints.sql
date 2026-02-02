-- Remove the existing unique constraint on order_number
ALTER TABLE finance_orders DROP CONSTRAINT IF EXISTS finance_orders_order_number_key;

-- Add a new unique constraint on (order_number, package_no)
-- We use COALESCE to handle NULL package_no as a distinct value if needed, 
-- but standard unique constraints treat NULLs as distinct. 
-- However, for upserting, we usually want to treat 'no package' as a specific valid state.
-- For standard postgres UNIQUE, distinct nulls allow duplicates.
-- To enforce uniqueness including NULLs, we can use a unique index with COALESCE or just accept standard behavior.
-- Given our upsert logic in code will explicitly check, standard unique constraint is risky if we rely on ON CONFLICT.
-- Better to use a UNIQUE INDEX with COALESCE for the upsert target.

DROP INDEX IF EXISTS idx_finance_orders_order_number;
DROP INDEX IF EXISTS idx_finance_orders_unique_package;

CREATE UNIQUE INDEX idx_finance_orders_unique_order_package 
ON finance_orders (order_number, COALESCE(package_no, 'HEAD'));

-- Also update the Primary Key if needed? No, ID is PK.

-- Verify:
-- Now we can insert ('123', 'PKG1') and ('123', 'PKG2') -> OK
-- ('123', NULL) and ('123', NULL) -> specific index with COALESCE('HEAD') will block duplicate NULLs. Good.

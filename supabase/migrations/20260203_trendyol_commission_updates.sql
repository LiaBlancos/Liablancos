-- Add desi and sale_price to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS desi numeric(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price numeric(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS model_id text;

-- Create shipping_rates table
CREATE TABLE IF NOT EXISTS shipping_rates (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    desi integer NOT NULL UNIQUE,
    price numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert some default shipping rates (example)
INSERT INTO shipping_rates (desi, price)
VALUES 
(1, 45.00),
(2, 52.00),
(3, 58.00),
(5, 75.00),
(10, 110.00),
(20, 180.00),
(30, 250.00)
ON CONFLICT (desi) DO NOTHING;

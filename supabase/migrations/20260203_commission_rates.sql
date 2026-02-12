-- Create trendyol_commission_rates table
create table if not exists trendyol_commission_rates (
    id uuid default uuid_generate_v4() primary key,
    barcode text unique not null,
    commission_rate numeric(5,2) not null, -- e.g., 15.50 for 15.5%
    last_transaction_date timestamp with time zone,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast barcode lookups
create index if not exists idx_commission_rates_barcode on trendyol_commission_rates(barcode);

-- Index for sorting by update time
create index if not exists idx_commission_rates_updated_at on trendyol_commission_rates(updated_at desc);

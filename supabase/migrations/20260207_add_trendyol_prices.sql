-- Add table for caching Trendyol product sale prices
-- This avoids excessive API calls by storing prices for 24 hours

create table if not exists trendyol_product_prices (
  barcode text primary key,
  sale_price numeric not null,
  list_price numeric,
  product_name text,
  trendyol_product_id text,
  last_fetched_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Indexes for efficient queries
create index if not exists idx_trendyol_prices_barcode on trendyol_product_prices(barcode);
create index if not exists idx_trendyol_prices_last_fetched on trendyol_product_prices(last_fetched_at);

-- Comment
comment on table trendyol_product_prices is 'Cache for Trendyol API product prices to minimize API calls';
comment on column trendyol_product_prices.sale_price is 'Current sale price from Trendyol (used as upper limit for 1st barem)';
comment on column trendyol_product_prices.last_fetched_at is 'Last time this price was fetched from API (refresh after 24h)';

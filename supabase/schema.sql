-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- CATEGORIES
create table if not exists categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SHELVES
create table if not exists shelves (
  id uuid default uuid_generate_v4() primary key,
  code text not null unique,
  capacity integer default 100,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PRODUCTS
create table if not exists products (
  id uuid default uuid_generate_v4() primary key,
  trendyol_product_id text unique,
  name text not null,
  barcode text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add new columns to products if they don't exist
do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_name='products' and column_name='trendyol_product_id') then
        alter table products add column trendyol_product_id text unique;
    else
        alter table products alter column trendyol_product_id type text using trendyol_product_id::text;
    end if;
    
    if not exists (select 1 from information_schema.columns where table_name='products' and column_name='sku') then
        alter table products add column sku text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name='products' and column_name='description') then
        alter table products add column description text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name='products' and column_name='quantity') then
        alter table products add column quantity integer default 0 check (quantity >= 0);
    end if;

    if not exists (select 1 from information_schema.columns where table_name='products' and column_name='damaged_quantity') then
        alter table products add column damaged_quantity integer default 0 check (damaged_quantity >= 0);
    end if;

    if not exists (select 1 from information_schema.columns where table_name='products' and column_name='min_stock') then
        alter table products add column min_stock integer default 10;
    end if;

    if not exists (select 1 from information_schema.columns where table_name='products' and column_name='shelf_id') then
        alter table products add column shelf_id uuid references shelves(id) on delete set null;
    end if;

    if not exists (select 1 from information_schema.columns where table_name='products' and column_name='category_id') then
        alter table products add column category_id uuid references categories(id) on delete set null;
    end if;

    if not exists (select 1 from information_schema.columns where table_name='products' and column_name='image_url') then
        alter table products add column image_url text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name='products' and column_name='is_active') then
        alter table products add column is_active boolean default true;
    end if;
end $$;

-- WHOLESALERS
create table if not exists wholesalers (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  phone text,
  address text,
  note text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- WHOLESALE PRICES
create table if not exists wholesale_prices (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade not null,
  wholesaler_id uuid references wholesalers(id) on delete cascade not null,
  buy_price numeric(10,2) not null default 0,
  currency text default 'TRY' not null,
  is_active boolean default true,
  last_updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(product_id, wholesaler_id)
);

-- PRICE CHANGE LOGS
create table if not exists price_change_logs (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade not null,
  wholesaler_id uuid references wholesalers(id) on delete cascade not null,
  old_price numeric(10,2),
  new_price numeric(10,2) not null,
  currency text not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- INVENTORY LOGS
do $$ 
begin 
    if not exists (select 1 from pg_type where typname = 'transaction_type') then 
        create type transaction_type as enum ('STOCK_IN', 'STOCK_OUT', 'MOVE', 'AUDIT', 'ADJUST', 'DAMAGED_IN', 'DAMAGED_OUT');
    end if;
end $$;

create table if not exists inventory_logs (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade not null,
  transaction_type transaction_type not null,
  quantity_change integer default 0,
  old_shelf_id uuid references shelves(id) on delete set null,
  new_shelf_id uuid references shelves(id) on delete set null,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists idx_products_barcode on products(barcode);
create index if not exists idx_products_shelf on products(shelf_id);
create index if not exists idx_logs_product on inventory_logs(product_id);
create index if not exists idx_wholesale_prices_product on wholesale_prices(product_id);
create index if not exists idx_wholesale_prices_wholesaler on wholesale_prices(wholesaler_id);

-- SETTINGS
create table if not exists settings (
  id uuid default uuid_generate_v4() primary key,
  key text not null unique,
  value text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PAYMENT TRACKING
do $$ 
begin 
    if not exists (select 1 from pg_type where typname = 'payment_status') then 
        create type payment_status as enum ('unpaid', 'paid', 'partial', 'unknown');
    end if;
end $$;

create table if not exists shipment_packages (
  id uuid default uuid_generate_v4() primary key,
  order_number text not null,
  shipment_package_id text unique,
  customer_name text,
  total_price numeric(10,2) default 0,
  order_date timestamp with time zone,
  delivery_date timestamp with time zone,
  status text, -- Trendyol status: Shipped, Delivered, etc.
  payment_status payment_status default 'unpaid',
  paid_at timestamp with time zone,
  paid_amount numeric(10,2),
  payment_reference text,
  payment_last_checked_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists shipment_package_items (
  id uuid default uuid_generate_v4() primary key,
  package_id uuid references shipment_packages(id) on delete cascade not null,
  barcode text,
  product_name text,
  quantity integer default 1,
  price numeric(10,2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists payment_sync_logs (
  id uuid default uuid_generate_v4() primary key,
  run_at timestamp with time zone default timezone('utc'::text, now()) not null,
  pulled_count integer default 0,
  matched_count integer default 0,
  paid_count integer default 0,
  unpaid_count integer default 0,
  unmatched_count integer default 0,
  error text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists unmatched_payments (
  id uuid default uuid_generate_v4() primary key,
  shipment_package_id text,
  order_number text,
  transaction_date timestamp with time zone,
  amount numeric(10,2),
  payment_reference text unique,
  raw_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- More indexes
create index if not exists idx_shipment_order_number on shipment_packages(order_number);
create index if not exists idx_shipment_package_id on shipment_packages(shipment_package_id);
create index if not exists idx_shipment_items_package on shipment_package_items(package_id);

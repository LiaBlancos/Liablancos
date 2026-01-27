-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- CATEGORIES
create table categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SHELVES
create table shelves (
  id uuid default uuid_generate_v4() primary key,
  code text not null unique, -- e.g., 'A-1', 'B-05'
  capacity integer default 100,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PRODUCTS
create table products (
  id uuid default uuid_generate_v4() primary key,
  trendyol_product_id bigint unique,
  name text not null,
  barcode text not null unique,
  sku text,
  description text,
  quantity integer default 0 check (quantity >= 0),
  damaged_quantity integer default 0 check (damaged_quantity >= 0),
  min_stock integer default 10,
  shelf_id uuid references shelves(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- WHOLESALERS
create table wholesalers (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  phone text,
  note text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- WHOLESALE PRICES
create table wholesale_prices (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade not null,
  wholesaler_id uuid references wholesalers(id) on delete cascade not null,
  buy_price numeric(10,2) not null default 0,
  currency text default 'TRY' not null,
  last_updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(product_id, wholesaler_id)
);

-- PRICE CHANGE LOGS
create table price_change_logs (
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
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN 
        CREATE TYPE transaction_type AS ENUM ('STOCK_IN', 'STOCK_OUT', 'MOVE', 'AUDIT', 'ADJUST', 'DAMAGED_IN', 'DAMAGED_OUT');
    END IF;
END $$;

create table inventory_logs (
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
create index idx_products_barcode on products(barcode);
create index idx_products_shelf on products(shelf_id);
create index idx_logs_product on inventory_logs(product_id);
create index idx_wholesale_prices_product on wholesale_prices(product_id);
create index idx_wholesale_prices_wholesaler on wholesale_prices(wholesaler_id);

-- SETTINGS
create table settings (
  id uuid default uuid_generate_v4() primary key,
  key text not null unique,
  value text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

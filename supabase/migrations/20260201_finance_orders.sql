-- Create finance_orders table
create table if not exists finance_orders (
  id uuid default uuid_generate_v4() primary key,
  order_number text not null unique,
  package_no text,
  barcode text,
  product_name text,
  quantity integer default 0,
  sale_total numeric(10,2) default 0,
  order_date timestamp with time zone,
  order_status text,
  delivered_at timestamp with time zone,
  due_at timestamp with time zone,
  expected_payout_at timestamp with time zone,
  payment_status text default 'unpaid', -- unpaid/paid
  paid_at timestamp with time zone,
  paid_amount numeric(10,2), -- This will be the NET amount
  commission_amount numeric(10,2) default 0,
  discount_amount numeric(10,2) default 0,
  penalty_amount numeric(10,2) default 0,
  payment_reference text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for search
create index if not exists idx_finance_orders_order_number on finance_orders(order_number);
create index if not exists idx_finance_orders_package_no on finance_orders(package_no);
create index if not exists idx_finance_orders_barcode on finance_orders(barcode);

-- Create unmatched_payment_rows table
create table if not exists unmatched_payment_rows (
  id uuid default uuid_generate_v4() primary key,
  order_number text,
  package_no text,
  paid_at timestamp with time zone,
  paid_amount numeric(10,2), -- NET
  commission_amount numeric(10,2) default 0,
  discount_amount numeric(10,2) default 0,
  penalty_amount numeric(10,2) default 0,
  raw_row_json jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_unmatched_payments_order on unmatched_payment_rows(order_number);

-- Create finance_upload_logs table
create table if not exists finance_upload_logs (
  id uuid default uuid_generate_v4() primary key,
  filename text,
  upload_type text, -- 'orders' or 'payments'
  processed_count integer default 0,
  updated_count integer default 0,
  inserted_count integer default 0,
  matched_count integer default 0,
  unmatched_count integer default 0,
  status text, -- 'success', 'error'
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_finance_logs_created on finance_upload_logs(created_at desc);

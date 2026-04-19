
-- Create shipping_rates table for Desi-based estimation
create table if not exists shipping_rates (
  id uuid default gen_random_uuid() primary key,
  min_desi numeric not null,
  max_desi numeric not null,
  price numeric not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add is_settled column to orders to track if we have actual financial data
alter table orders add column if not exists is_settled boolean default false;

-- Enable RLS
alter table shipping_rates enable row level security;

-- Policies for shipping_rates
create policy "Enable read access for all users" on shipping_rates for select using (true);
create policy "Enable write access for authenticated users" on shipping_rates for insert with check (auth.role() = 'authenticated');
create policy "Enable update access for authenticated users" on shipping_rates for update using (auth.role() = 'authenticated');
create policy "Enable delete access for authenticated users" on shipping_rates for delete using (auth.role() = 'authenticated');

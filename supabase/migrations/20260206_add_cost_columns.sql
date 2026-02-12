alter table public.products 
add column if not exists cost numeric default 0,
add column if not exists cost_vat_rate numeric default 10;

-- Order Profitability Analysis Schema

-- 1. Orders Table (Transactional Header)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT,
    total_price NUMERIC(10,2) DEFAULT 0, -- Gross Total (Sale Price)
    gross_cost NUMERIC(10,2) DEFAULT 0, -- Total COGS
    net_profit NUMERIC(10,2) DEFAULT 0, -- Calculated Field
    currency TEXT DEFAULT 'TRY',
    status TEXT, -- Created, Picking, Shipped, Cancelled, Delivered, Returned
    order_date TIMESTAMP WITH TIME ZONE,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 2. Order Items Table (Line Items)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    sku TEXT,
    barcode TEXT,
    product_name TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC(10,2) DEFAULT 0, -- Sale price per unit
    vat_rate NUMERIC(5,2) DEFAULT 0,
    unit_cost NUMERIC(10,2) DEFAULT 0, -- Snapshot of COGS at time of order
    status TEXT DEFAULT 'Active', -- Active, Cancelled, Returned
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_barcode ON public.order_items(barcode);

-- 3. Order Fees Table (Flexible Ledger for Deductions/Additions)
CREATE TABLE IF NOT EXISTS public.order_fees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE, -- Nullable if fee is order-level
    fee_type TEXT NOT NULL, -- 'COMMISSION', 'SHIPPING', 'SERVICE_FEE', 'DISCOUNT', 'PENALTY', 'RETURN_COST'
    amount NUMERIC(10,2) NOT NULL, -- Negative for deductions, Positive for reimbursements
    currency TEXT DEFAULT 'TRY',
    description TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_fees_order_id ON public.order_fees(order_id);
CREATE INDEX IF NOT EXISTS idx_order_fees_fee_type ON public.order_fees(fee_type);

-- 4. Product Costs History (Optional but good for audit)
CREATE TABLE IF NOT EXISTS public.product_costs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    cost NUMERIC(10,2) NOT NULL,
    cost_vat_rate NUMERIC(5,2) DEFAULT 10,
    currency TEXT DEFAULT 'TRY',
    effective_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_costs_product_id ON public.product_costs(product_id);

-- Add triggers for updated_at if needed (skipping for now to keep it simple)

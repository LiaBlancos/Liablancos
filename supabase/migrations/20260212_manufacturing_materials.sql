-- Create raw_materials table
CREATE TABLE IF NOT EXISTS public.raw_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    unit_price NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create product_materials table (Joint table for Bill of Materials)
CREATE TABLE IF NOT EXISTS public.product_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
    quantity_per_unit NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(product_id, material_id)
);

-- Enable RLS (assuming public access or similar policy as other tables)
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_materials ENABLE ROW LEVEL SECURITY;

-- Simple public policy (matching existing patterns if any, or just granting access)
CREATE POLICY "Allow all access" ON public.raw_materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.product_materials FOR ALL USING (true) WITH CHECK (true);

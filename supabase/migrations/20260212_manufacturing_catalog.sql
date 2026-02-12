-- MANUFACTURING CATALOG TABLE
CREATE TABLE IF NOT EXISTS public.manufacturing_catalog (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id)
);

-- RLS
ALTER TABLE public.manufacturing_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access"
    ON public.manufacturing_catalog
    FOR ALL
    USING (true)
    WITH CHECK (true);

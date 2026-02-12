-- Add currency columns to raw_materials and product_materials
ALTER TABLE public.raw_materials 
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD'));

ALTER TABLE public.product_materials 
ADD COLUMN IF NOT EXISTS currency TEXT CHECK (currency IN ('TRY', 'USD'));

-- Optional: Initial data check (setting default currency if needed)
UPDATE public.raw_materials SET currency = 'TRY' WHERE currency IS NULL;

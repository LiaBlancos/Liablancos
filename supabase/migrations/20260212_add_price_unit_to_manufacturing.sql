-- Add price_unit columns to handle pricing per usage unit (e.g. cm, gr)
ALTER TABLE public.raw_materials 
ADD COLUMN IF NOT EXISTS price_unit TEXT CHECK (price_unit IN ('metre', 'cm', 'kg', 'gr', 'adet'));

ALTER TABLE public.product_materials 
ADD COLUMN IF NOT EXISTS price_unit TEXT CHECK (price_unit IN ('metre', 'cm', 'kg', 'gr', 'adet'));

-- Update existing records to use their base unit as default price unit
UPDATE public.raw_materials SET price_unit = unit WHERE price_unit IS NULL;
UPDATE public.product_materials pm 
SET price_unit = (SELECT unit FROM public.raw_materials rm WHERE rm.id = pm.material_id)
WHERE price_unit IS NULL;

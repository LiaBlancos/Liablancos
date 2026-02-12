-- Add unit column to product_materials
ALTER TABLE public.product_materials 
ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'adet';

-- Update existing rows based on raw material unit if possible (optional but good)
UPDATE public.product_materials pm
SET unit = rm.unit
FROM public.raw_materials rm
WHERE pm.material_id = rm.id;

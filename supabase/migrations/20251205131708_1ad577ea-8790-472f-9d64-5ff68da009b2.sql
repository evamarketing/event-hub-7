-- Drop the generated column and recreate as regular column
ALTER TABLE public.products DROP COLUMN selling_price;

ALTER TABLE public.products ADD COLUMN selling_price numeric;

-- Add comment to clarify usage
COMMENT ON COLUMN public.products.selling_price IS 'MRP/Selling price - entered manually. 20% margin calculated at payment time.';
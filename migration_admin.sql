-- migration_admin.sql
-- 1. Drop Wishlist tables and references
DROP TABLE IF EXISTS public.wishlist_items CASCADE;
DROP TABLE IF EXISTS public.wishlists CASCADE;

-- 2. Modify products table to support admin fields
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price numeric(12, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sizes text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock integer default 0;

-- 3. Backfill existing products base_price, sizes, and stock
UPDATE public.products
SET 
  price = base_price,
  sizes = ARRAY['38', '39', '40', '41', 'OS', '6', '7'],
  stock = 10
WHERE price IS NULL;

-- 4. Enable RLS and add public read policy on inventory
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on inventory" ON public.inventory;
CREATE POLICY "Allow public read on inventory" ON public.inventory FOR SELECT USING (true);

-- 5. Enable RLS and add public read policy on discounts
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read on discounts" ON public.discounts;
CREATE POLICY "Allow public read on discounts" ON public.discounts FOR SELECT USING (true);

-- 6. Rename seed promo code AURA10 to FRACTALS10
UPDATE public.discounts SET code = 'FRACTALS10' WHERE code = 'AURA10';

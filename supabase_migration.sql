-- supabase_migration.sql
-- PostgreSQL Database Schema for Luxury E-commerce Storefront (AURA)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles/Customers
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  first_name text,
  last_name text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Collections (e.g., FALL 2026, VERSATILE ELEGANCE)
create table if not exists public.collections (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Products
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  description text,
  base_price numeric(12, 2) not null,
  images text[] not null, -- Array of image URLs (first is primary, second is hover/reveal)
  category text not null,
  is_featured boolean default false,
  status text default 'active'::text check (status in ('draft', 'active', 'archived')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Join table for Products <-> Collections
create table if not exists public.product_collections (
  product_id uuid references public.products on delete cascade,
  collection_id uuid references public.collections on delete cascade,
  primary key (product_id, collection_id)
);

-- 4. Product Variants (Color, Size, Material attributes)
create table if not exists public.product_variants (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products on delete cascade not null,
  name text not null, -- e.g., "S / Black / Leather"
  sku text not null unique,
  price_override numeric(12, 2), -- override base price if applicable
  size text,
  color text,
  material text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Inventory
create table if not exists public.inventory (
  id uuid default gen_random_uuid() primary key,
  variant_id uuid references public.product_variants on delete cascade unique not null,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Addresses
create table if not exists public.addresses (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles on delete cascade not null,
  label text not null, -- e.g. "Home", "Office"
  first_name text not null,
  last_name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null,
  phone text not null,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Carts & Cart Items
create table if not exists public.carts (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles on delete cascade, -- nullable for guest carts
  session_id text, -- for guest carts
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.cart_items (
  id uuid default gen_random_uuid() primary key,
  cart_id uuid references public.carts on delete cascade not null,
  variant_id uuid references public.product_variants on delete cascade not null,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (cart_id, variant_id)
);

-- 8. Wishlists & Wishlist Items
create table if not exists public.wishlists (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles on delete cascade unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.wishlist_items (
  id uuid default gen_random_uuid() primary key,
  wishlist_id uuid references public.wishlists on delete cascade not null,
  product_id uuid references public.products on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (wishlist_id, product_id)
);

-- 9. Discounts/Promo codes
create table if not exists public.discounts (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  type text not null check (type in ('percentage', 'fixed_amount')),
  value numeric(12, 2) not null,
  min_order_amount numeric(12, 2) default 0.00,
  active_from timestamp with time zone,
  active_to timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Orders
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles on delete set null,
  order_number text not null unique,
  status text not null default 'pending'::text check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal numeric(12, 2) not null,
  shipping_cost numeric(12, 2) not null default 0.00,
  discount_amount numeric(12, 2) not null default 0.00,
  total numeric(12, 2) not null,
  shipping_address jsonb not null, -- snapshot of shipping address
  billing_address jsonb,          -- snapshot of billing address
  tracking_number text,
  discount_id uuid references public.discounts on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders on delete cascade not null,
  variant_id uuid references public.product_variants on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null,
  variant_name text not null, -- snapshot name (e.g. "S / Black / Leather")
  product_name text not null -- snapshot product name
);

-- 11. Payments & Transactions
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders on delete cascade not null,
  payment_method text not null, -- e.g. "credit_card" (Visa, Mastercard)
  status text not null default 'pending'::text check (status in ('pending', 'settlement', 'expire', 'deny', 'cancel', 'refund')),
  amount numeric(12, 2) not null,
  transaction_id text, -- Midtrans Transaction ID
  payment_type text, -- Midtrans Payment Type
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders on delete cascade not null,
  payment_id uuid references public.payments on delete cascade,
  raw_payload jsonb not null,
  status text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. Row Level Security (RLS) Configuration
alter table public.profiles enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_collections enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.discounts enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.transactions enable row level security;

-- Setup RLS Policies
-- Public read access for products, variants, inventory status, collections
create policy "Allow public read on collections" on public.collections for select using (is_active = true);
create policy "Allow public read on products" on public.products for select using (status = 'active');
create policy "Allow public read on variants" on public.product_variants for select using (true);
create policy "Allow public read on product_collections" on public.product_collections for select using (true);
create policy "Allow public read on inventory" on public.inventory for select using (true);
create policy "Allow public read on discounts" on public.discounts for select using (true);

-- Profile policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Address policies
create policy "Users can perform CRUD on own addresses" on public.addresses for all using (auth.uid() = profile_id);

-- Cart policies
create policy "Allow select own cart" on public.carts for select using (auth.uid() = profile_id or session_id is not null);
create policy "Allow insert own cart" on public.carts for insert with check (auth.uid() = profile_id or session_id is not null);
create policy "Allow update own cart" on public.carts for update using (auth.uid() = profile_id or session_id is not null);
create policy "Allow delete own cart" on public.carts for delete using (auth.uid() = profile_id or session_id is not null);

-- Cart items policies
create policy "Allow CRUD on own cart items" on public.cart_items for all using (
  exists (select 1 from public.carts where id = cart_items.cart_id and (profile_id = auth.uid() or session_id is not null))
);

-- Wishlist policies
create policy "Allow CRUD on own wishlist" on public.wishlists for all using (auth.uid() = profile_id);
create policy "Allow CRUD on own wishlist items" on public.wishlist_items for all using (
  exists (select 1 from public.wishlists where id = wishlist_items.wishlist_id and profile_id = auth.uid())
);

-- Orders, Items, Payments (User can read own, system updates via service role)
create policy "Users can view own orders" on public.orders for select using (auth.uid() = profile_id);
create policy "Users can create own orders" on public.orders for insert with check (auth.uid() = profile_id);
create policy "Users can view own order items" on public.order_items for select using (
  exists (select 1 from public.orders where id = order_items.order_id and profile_id = auth.uid())
);
create policy "Users can view own payments" on public.payments for select using (
  exists (select 1 from public.orders where id = payments.order_id and profile_id = auth.uid())
);

-- Indexes for performance
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_collections_slug on public.collections(slug);
create index if not exists idx_variants_product_id on public.product_variants(product_id);
create index if not exists idx_inventory_variant_id on public.inventory(variant_id);
create index if not exists idx_cart_items_cart_id on public.cart_items(cart_id);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_payments_order_id on public.payments(order_id);

-- Profile trigger to create profile row when auth.users is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (new.id, new.email, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- SEED DATA FOR LUXURY FASHION HOUSE (AURA)

-- Collections
insert into public.collections (id, name, slug, description, image_url) values
('c1000000-0000-0000-0000-000000000000', 'FALL / WINTER 2026', 'fall-winter-2026', 'A study of asymmetric tailoring and structured silhouettes.', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200'),
('c2000000-0000-0000-0000-000000000000', 'VERSATILE ELEGANCE', 'versatile-elegance', 'Minimal accessories, sleek leather details, and high-fashion utility.', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200')
on conflict (slug) do nothing;

-- Products
insert into public.products (id, name, slug, description, base_price, images, category, is_featured, status) values
-- Footwear
('p1000000-0000-0000-0000-000000000000', 'Monolith Leather Combat Boot', 'monolith-combat-boot', 'Crafted from premium water-resistant calfskin leather with a chunky platform sole, textured knit shaft detail, and silver hardware accents.', 1250.00, array['https://images.unsplash.com/photo-1520639888713-7851133b1ed0?q=80&w=800', 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?q=80&w=800'], 'Shoes', true, 'active'),
('p2000000-0000-0000-0000-000000000000', 'Talon Pointed Slingback Loafer', 'talon-slingback-loafer', 'An avant-garde blend of classic loafer detailing and a slingback silhouette, featuring a sleek silver buckle strap and signature low stacked heel.', 890.00, array['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=800', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800'], 'Shoes', true, 'active'),
('p3000000-0000-0000-0000-000000000000', 'Aura Court Premium Sneaker', 'aura-court-sneaker', 'Editorial low-top luxury sneaker in soft white nappa leather with detailed tonal stitching, refined perforation, and dynamic raw-edge overlays.', 650.00, array['https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800', 'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?q=80&w=800'], 'Shoes', false, 'active'),
-- Bags
('p4000000-0000-0000-0000-000000000000', 'Signature Monogram Tote Bag', 'signature-monogram-tote', 'Spacious open-top tote structured in textured printed leather. Double top handles and dual thin shoulder straps for effortless styling versatility.', 1750.00, array['https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800', 'https://images.unsplash.com/photo-1547949003-9792a18a2601?q=80&w=800'], 'Bags', true, 'active'),
-- Jewelry
('p5000000-0000-0000-0000-000000000000', 'Crux Sterling Silver Ring Chain', 'crux-ring-chain', 'Minimalist sterling silver chain link wrap ring featuring a subtle dangling tag and integrated custom loop clasp detail.', 320.00, array['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800'], 'Jewelry', false, 'active')
on conflict (slug) do nothing;

-- Product Collections Links
insert into public.product_collections (product_id, collection_id) values
('p1000000-0000-0000-0000-000000000000', 'c1000000-0000-0000-0000-000000000000'),
('p2000000-0000-0000-0000-000000000000', 'c1000000-0000-0000-0000-000000000000'),
('p4000000-0000-0000-0000-000000000000', 'c2000000-0000-0000-0000-000000000000')
on conflict do nothing;

-- Product Variants
insert into public.product_variants (id, product_id, name, sku, price_override, size, color, material) values
-- Boot sizes
('v1000000-0000-0000-0000-000000000038', 'p1000000-0000-0000-0000-000000000000', '38 / Black / Leather', 'BOOT-BLK-38', null, '38', 'Black', 'Calfskin Leather'),
('v1000000-0000-0000-0000-000000000039', 'p1000000-0000-0000-0000-000000000000', '39 / Black / Leather', 'BOOT-BLK-39', null, '39', 'Black', 'Calfskin Leather'),
('v1000000-0000-0000-0000-000000000040', 'p1000000-0000-0000-0000-000000000000', '40 / Black / Leather', 'BOOT-BLK-40', null, '40', 'Black', 'Calfskin Leather'),
-- Loafer sizes
('v2000000-0000-0000-0000-000000000038', 'p2000000-0000-0000-0000-000000000000', '38 / Black / Leather', 'LOAF-BLK-38', null, '38', 'Black', 'Polished Leather'),
('v2000000-0000-0000-0000-000000000039', 'p2000000-0000-0000-0000-000000000000', '39 / Black / Leather', 'LOAF-BLK-39', null, '39', 'Black', 'Polished Leather'),
-- Sneaker sizes
('v3000000-0000-0000-0000-000000000040', 'p3000000-0000-0000-0000-000000000000', '40 / White / Nappa', 'SNEAK-WHT-40', null, '40', 'White', 'Nappa Leather'),
('v3000000-0000-0000-0000-000000000041', 'p3000000-0000-0000-0000-000000000000', '41 / White / Nappa', 'SNEAK-WHT-41', null, '41', 'White', 'Nappa Leather'),
-- Tote
('v4000000-0000-0000-0000-000000000000', 'p4000000-0000-0000-0000-000000000000', 'OS / Mono / Printed Leather', 'TOTE-MONO-OS', null, 'OS', 'Monogram', 'Textured Leather'),
-- Ring
('v5000000-0000-0000-0000-000000000006', 'p5000000-0000-0000-0000-000000000000', '6 / Silver / Silver', 'RING-SLV-6', null, '6', 'Silver', 'Sterling Silver'),
('v5000000-0000-0000-0000-000000000007', 'p5000000-0000-0000-0000-000000000000', '7 / Silver / Silver', 'RING-SLV-7', null, '7', 'Silver', 'Sterling Silver')
on conflict (sku) do nothing;

-- Inventory
insert into public.inventory (variant_id, stock_quantity) values
('v1000000-0000-0000-0000-000000000038', 10),
('v1000000-0000-0000-0000-000000000039', 8),
('v1000000-0000-0000-0000-000000000040', 12),
('v2000000-0000-0000-0000-000000000038', 5),
('v2000000-0000-0000-0000-000000000039', 6),
('v3000000-0000-0000-0000-000000000040', 15),
('v3000000-0000-0000-0000-000000000041', 20),
('v4000000-0000-0000-0000-000000000000', 4),
('v5000000-0000-0000-0000-000000000006', 25),
('v5000000-0000-0000-0000-000000000007', 30)
on conflict (variant_id) do nothing;


-- ======================================================
-- DYNAMIC STOCK MANAGEMENT & TRANSACTION SAFETY FUNCTIONS
-- ======================================================

-- Increment stock (e.g. on order cancellation/refund/payment expiry)
create or replace function public.increment_stock(target_variant_id uuid, qty integer)
returns void as $$
begin
  update public.inventory
  set stock_quantity = stock_quantity + qty
  where variant_id = target_variant_id;
end;
$$ language plpgsql security definer;

-- Decrement stock securely with row locking
create or replace function public.decrement_stock(target_variant_id uuid, qty integer)
returns boolean as $$
declare
  current_stock integer;
begin
  -- Lock row for update to prevent race conditions during concurrent checkouts
  select stock_quantity into current_stock
  from public.inventory
  where variant_id = target_variant_id
  for update;
  
  if current_stock >= qty then
    update public.inventory
    set stock_quantity = stock_quantity - qty
    where variant_id = target_variant_id;
    return true;
  else
    return false;
  end if;
end;
$$ language plpgsql security definer;


-- ======================================================
-- SEED DATA FOR DISCOUNTS / PROMOTION CODES
-- ======================================================
insert into public.discounts (id, code, type, value, min_order_amount, active_from, active_to, is_active) values
('d1000000-0000-0000-0000-000000000010', 'FRACTALS10', 'percentage', 10.00, 0.00, now(), now() + interval '1 year', true),
('d2000000-0000-0000-0000-000000000050', 'WELCOME50', 'fixed_amount', 50.00, 200.00, now(), now() + interval '1 year', true)
on conflict (code) do nothing;


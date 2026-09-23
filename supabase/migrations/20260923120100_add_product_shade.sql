-- A nail shade on a product: the colour the admin picks when adding or editing
-- it, shown to shoppers on the product card and the product page.
--
-- Both columns are nullable and nothing backfills them. A product with no shade
-- is the normal case for everything already in the table, and both apps render
-- nothing at all when the colour is null — so this can be run on the live shop
-- without changing a single existing page.

alter table public.products
  add column if not exists color_name text,
  add column if not exists color_hex  text;

comment on column public.products.color_name is
  'Display name of the nail shade, e.g. "Ballet Blush". Null when unset.';
comment on column public.products.color_hex is
  'The shade as #RRGGBB, used for the swatch. Null when unset.';

-- The admin normalises the field before saving; this is the same rule held in
-- the database, so a malformed value cannot reach a customer's screen by any
-- other route. Case-insensitive because a hand-typed hex is often lower case.
alter table public.products
  drop constraint if exists products_color_hex_format;

alter table public.products
  add constraint products_color_hex_format
  check (color_hex is null or color_hex ~* '^#[0-9a-f]{6}$');

-- No grants or policies needed: `products` is already world-readable and
-- admin-writable, and new columns inherit the table's existing privileges.

# Nails By Eimi

Storefront for a press-on nail and nail-supply brand. React + Vite + Tailwind,
with Supabase for data and accounts.

The admin panel lives in a separate repository.

## Running it

```bash
npm install
cp .env.example .env    # fill in the two Supabase values
npm run dev
```

Opens on **http://localhost:5173**. `npm run build` produces a static bundle in
`dist/`.

Without `.env` the app renders a setup screen naming the missing variables
rather than a blank page. See **Deploying** below.

## What it does

Shop press-on sets, gel polishes, professional supplies and jewellery. Sign up,
save a wishlist and delivery addresses, record a nail profile, place orders and
earn loyalty points. Prices are in PKR and checkout is cash on delivery.

| Route | |
| --- | --- |
| `/` | Carousel, categories, shelves, loyalty banner |
| `/new-arrivals`, `/gel-nails` | Catalogue views |
| `/category/*` | Any category, including nested ones like `jewellery/rings` |
| `/product/:slug` | One product |
| `/search?q=` | Full-catalogue search |
| `/contact` | Message form |
| `/cart`, `/checkout` | Bag and checkout |
| `/login` | Sign up, sign in, password reset — never required to buy |
| `/order-placed` | Confirmation after checkout |
| `/track` | Order status by number and phone, for customers without an account |
| `/account/*` | Dashboard, orders, history, wishlist, addresses, payment, nail profile, rewards, settings |

## Architecture

**`src/lib/api.js` is the only module that touches the database.** Components
call it and nothing else, so the data layer can change without touching screens.

**Row level security does the protecting, not the UI.** The catalogue and store
settings are readable by anyone; orders, profiles, addresses, discounts and
contact messages return nothing unless you own them or are an admin. Hiding a
button is convenience — the database is the boundary.

**Checkout needs no account.** Contact details, delivery address, notes,
shipping method and billing address are collected on the page itself. Signing in
only prefills them.

**Orders are placed by a database function**, not client code. `place_order`
locks each product row, checks stock, writes the order and its lines, decrements
stock and awards points in one transaction, so two people cannot buy the same
last unit. Line items copy the name, price and image, so order history survives
later edits to a product.

**Categories and settings are rows, not constants.** The menu, footer, homepage
rail, top bar, delivery threshold and minimum order all read from the database,
which is what lets the admin panel change them without a deploy.

**A product belongs to any number of categories**, through the
`product_categories` join table. Its home for breadcrumb purposes is the first
by menu order that is not flagged promotional — so Deals, which collects
discounted products, never claims to be where a product lives.

## Structure

```
src/
  components/   Header, Sidebar, SideDrawer, NavSections, HeroCarousel,
                SearchOverlay, ProductCard, ProductListing, TopBar, Footer,
                Icon (40 inline icons), ui.jsx
  context/      AuthContext (session + profile), StoreContext (cart, wishlist,
                toasts, settings, categories)
  pages/        Storefront routes
  pages/account/ Signed-in area
  lib/          api.js (all data access), supabase.js, format.js,
                adminAvailable.js
  hooks/        useAsync
  data/         navigation.js (Menu links), slides.js, site.js (fallbacks)
```

Product and category data used to live in `src/data/`; it now comes from
Supabase. `data/navigation.js` still holds the fixed **Menu** links, since those
are routes rather than content.

## Design

| Token | Value | |
| --- | --- | --- |
| `wine` | `#E01B6A` | Primary actions, active nav, prices |
| `ink` | `#1A0E14` | Text, top bar |
| `canvas` | `#FFFBFC` | Page background |
| `blush` | `#FFF1F6` | Drawer, sidebar, icon tiles |
| `gold` | `#F5C24B` | Sale flags, loyalty tiers |
| `muted` | `#7A6570` | Secondary text |
| `line` | `#F6E3EB` | Borders |

Cormorant Garamond for display, Outfit for UI. Shared classes (`.card`,
`.btn-primary`, `.pill`, `.field`, `.eyebrow`) are in `src/index.css`; colours
come from `tailwind.config.js`, so a rebrand is one file.

## Admin panel

Kept in its own repository. `App.jsx` and `lib/adminAvailable.js` locate it with
`import.meta.glob`, which resolves to nothing when the folder is absent — so
this builds with or without it, and the admin link stays hidden unless the
section is actually bundled.

## Images

`public/media/*.svg` are generated placeholders. Product photos uploaded through
the admin panel go to Supabase Storage and replace them per product. To change
the hero, edit `src/data/slides.js` — artwork should be 16:9 with the subject
right of centre, or the mobile crop frames the wrong part.

## Deploying

Host it anywhere that serves a static build. On Vercel the framework preset is
detected automatically (`vite build` into `dist/`).

**Two environment variables are required.** Set them on the host, applied to
production, preview and development:

| Name | |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The publishable key from the Supabase dashboard |

Vite reads these **at build time**, not at run time, so saving them is not
enough — the site has to be redeployed afterwards.

If they are missing, the app renders a setup screen naming what is absent rather
than failing silently. That screen exists because the earlier behaviour was to
throw while modules were still loading, which left a blank page and the reason
buried in the console.

`vercel.json` rewrites every path to `index.html`. Without it, refreshing on a
route like `/new-arrivals` returns a 404, because the host looks for a file
there while routing actually happens client-side.


## Not built yet

- Card payments (checkout is cash on delivery by design)
- Order confirmation emails
- Product reviews — ratings display, but nobody can write one
- Real photography
- Tests

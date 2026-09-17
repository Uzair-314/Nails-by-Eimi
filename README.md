# Nails By Eimi

Storefront for a press-on nail and nail-supply brand, built with React + Vite + Tailwind.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:5173. `npm run build` produces a static bundle in `dist/`.

## Design

Taken from the reference screens in `design-reference/`:

| Token | Value | Used for |
| --- | --- | --- |
| `wine` | `#8B4550` | Primary actions, active nav, prices |
| `blush` | `#FBF4F3` | Drawer and account rail backgrounds |
| `canvas` | `#FDFAF9` | Page background (plus a soft blush wash) |
| `ink` | `#3A2A2F` | Body text |
| `muted` | `#8A7378` | Secondary text |
| `rose` | `#B08A90` | Eyebrow labels |
| `line` | `#F0E4E2` | Borders and dividers |

**Type:** Cormorant Garamond for display (wordmark, headings) and Outfit for UI —
an elegant serif against a clean geometric sans, which reads as premium beauty
without losing the reference layout's clarity. Both load from Google Fonts in
`index.html`.

Reusable classes (`.card`, `.btn-primary`, `.pill`, `.field`, `.eyebrow`) live in
`src/index.css` so components stay consistent.

## Structure

```
src/
  components/   Header, SideDrawer, HeroCarousel, SearchOverlay, ProductCard, ui.jsx, Icon.jsx
  pages/        Storefront routes
  pages/account/ Signed-in dashboard (mirrors the reference screens)
  context/      Cart, wishlist and toast state
  data/         Navigation, slides, products, account seed data
  lib/          api.js (data access) and format.js (currency/dates)
  hooks/        useAsync
```

### Navigation

`src/data/navigation.js` is the single source of truth for the drawer, the footer
and the homepage category rail. It has two separated groups:

- **Menu** — Home, New Arrivals, Gel Nails, Contact Us, Rewards / Loyalty, Search, Account / Settings
- **Categories** — Deals, Gel Polishes, Nail Supplies for Business, Nail Decoration, and
  Jewellery, which expands in place to Bracelets / Rings / Watches

Adding a category with a `children` array automatically makes it expandable.

### Hero carousel

`src/components/HeroCarousel.jsx` reads `src/data/slides.js` and renders at most
three slides. It advances every 5s, pauses on hover, focus, drag and when the tab
is hidden, and skips autoplay entirely under `prefers-reduced-motion`. Pointer
events drive a real drag — the track follows your finger, locks to the horizontal
axis so vertical page scrolling still works, and rubber-bands at the ends.

Slide artwork is 16:9 and crops to `object-right` on phones (keeping the subject in
frame) and `object-center` on wide screens (where the copy sits to its left).

## Data layer

Every screen reads and writes through `src/lib/api.js` — nothing imports the mock
data directly except that file. Functions return promises with realistic latency
and persist writes to `localStorage`, so the demo survives a refresh.

**To move to Supabase:** rewrite the bodies in `src/lib/api.js` to call
`supabase.from(...)` and keep the same return shapes. No component changes needed.

Suggested tables: `products`, `categories`, `orders`, `order_items`, `addresses`,
`payment_methods`, `nail_profiles`, `point_history`, `rewards`, `messages`.

## Images

`public/media/*.svg` are generated placeholders — soft gradients with a stylised
nail set. Replace them with photography and update the `image` fields in
`src/data/products.js` and `src/data/slides.js`.

## Not built yet

- Authentication — the account area runs on a seeded demo user
- Supabase backend
- Admin panel
- Real payments (checkout collects no card details by design)

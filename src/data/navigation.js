/**
 * Drawer navigation. Two clearly separated groups: MENU and CATEGORIES.
 * A category with `children` renders as an expandable accordion row.
 */

export const MENU_LINKS = [
  { label: 'Home', to: '/', icon: 'home' },
  { label: 'New Arrivals', to: '/new-arrivals', icon: 'sparkle' },
  { label: 'Gel Nails', to: '/gel-nails', icon: 'nail' },
  { label: 'Contact Us', to: '/contact', icon: 'mail' },
  { label: 'Rewards / Loyalty', to: '/rewards', icon: 'gift' },
  { label: 'Search', to: '/search', icon: 'search' },
  { label: 'Account / Settings', to: '/account', icon: 'user' },
]

export const CATEGORY_LINKS = [
  { label: 'Deals', slug: 'deals', icon: 'tag' },
  { label: 'Gel Polishes', slug: 'gel-polishes', icon: 'bottle' },
  { label: 'Nail Supplies for Business', slug: 'nail-supplies', icon: 'kit' },
  { label: 'Nail Decoration', slug: 'nail-decoration', icon: 'gem' },
  {
    label: 'Jewellery',
    slug: 'jewellery',
    icon: 'ring',
    children: [
      { label: 'Bracelets', slug: 'jewellery/bracelets' },
      { label: 'Rings', slug: 'jewellery/rings' },
      { label: 'Watches', slug: 'jewellery/watches' },
    ],
  },
]

/** Flat slug -> display name map, used for category page titles and breadcrumbs. */
export const CATEGORY_NAMES = CATEGORY_LINKS.reduce((acc, c) => {
  acc[c.slug] = c.label
  for (const child of c.children ?? []) acc[child.slug] = child.label
  return acc
}, {})

export const CATEGORY_BLURBS = {
  deals: 'Limited-run sets and bundles, refreshed every week.',
  'gel-polishes': 'Salon-grade colour that cures glassy and lasts three weeks.',
  'nail-supplies': 'Trade pricing on the tools, lamps and consumables your studio runs on.',
  'nail-decoration': 'Charms, chrome, foils and gems for finishing work that gets noticed.',
  jewellery: 'Fine-plated pieces styled to sit beside a fresh set.',
  'jewellery/bracelets': 'Layerable chains and cuffs in gold and silver tones.',
  'jewellery/rings': 'Stacking bands, signets and stone-set statements.',
  'jewellery/watches': 'Slim, understated watches with interchangeable straps.',
}

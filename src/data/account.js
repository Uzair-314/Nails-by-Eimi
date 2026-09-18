/** Seed data for the signed-in account area. Replaced by Supabase tables later. */

export const SEED_USER = {
  id: 'u_eimi_demo',
  firstName: 'Amara',
  lastName: 'Okafor',
  email: 'amara@example.com',
  phone: '+44 7700 900123',
  memberSince: '2023',
  tier: 'Gold',
  points: 2480,
  pointsToNextTier: 520,
  nextTier: 'Platinum',
  avatarTone: '#E7AFC0',
}

export const SEED_ORDERS = [
  {
    id: 'NBE-8492',
    placedAt: '2026-09-12',
    status: 'processing',
    total: 48.0,
    items: [
      { productSlug: 'ballet-slipper-set', name: 'Ballet Slipper Press-On Set', qty: 1, price: 32, image: '/media/p-ballet.svg' },
      { productSlug: 'gel-ballet-blush', name: 'Gel Polish — Ballet Blush', qty: 1, price: 16, image: '/media/p-ballet.svg' },
    ],
    tracking: null,
    address: 'addr_1',
  },
  {
    id: 'NBE-8104',
    placedAt: '2026-08-28',
    status: 'shipped',
    total: 32.0,
    items: [
      { productSlug: 'gel-mocha-silk', name: 'Gel Polish — Mocha Silk', qty: 2, price: 16, image: '/media/p-mocha.svg' },
    ],
    tracking: 'RM4821990GB',
    address: 'addr_1',
  },
  {
    id: 'NBE-7521',
    placedAt: '2026-08-10',
    status: 'delivered',
    total: 28.0,
    items: [
      { productSlug: 'crystal-charm-box', name: 'Crystal Charm Box', qty: 1, price: 28, image: '/media/p-gold.svg' },
    ],
    tracking: 'RM4712004GB',
    address: 'addr_2',
  },
  {
    id: 'NBE-7188',
    placedAt: '2026-07-19',
    status: 'delivered',
    total: 89.0,
    items: [
      { productSlug: 'led-lamp-pro-72w', name: 'Studio LED Lamp 72W', qty: 1, price: 89, image: '/media/p-pearl.svg' },
    ],
    tracking: 'RM4588321GB',
    address: 'addr_1',
  },
]

export const SEED_ADDRESSES = [
  {
    id: 'addr_1',
    label: 'Home',
    name: 'Amara Okafor',
    line1: '42 Thornbury Road',
    line2: 'Flat 3',
    city: 'London',
    postcode: 'SW2 4DE',
    country: 'United Kingdom',
    phone: '+44 7700 900123',
    isDefault: true,
  },
  {
    id: 'addr_2',
    label: 'Studio',
    name: 'Amara Okafor',
    line1: 'Unit 9, Peckham Levels',
    line2: '95a Rye Lane',
    city: 'London',
    postcode: 'SE15 4ST',
    country: 'United Kingdom',
    phone: '+44 7700 900123',
    isDefault: false,
  },
]

export const SEED_CARDS = [
  { id: 'card_1', brand: 'Visa', last4: '4242', expMonth: 8, expYear: 2029, holder: 'A OKAFOR', isDefault: true },
  { id: 'card_2', brand: 'Mastercard', last4: '8210', expMonth: 3, expYear: 2028, holder: 'A OKAFOR', isDefault: false },
]

export const SEED_NAIL_PROFILE = {
  shape: 'Almond',
  length: 'Medium',
  finish: 'Glossy',
  sizes: { thumb: 2, index: 5, middle: 4, ring: 6, pinky: 8 },
  allergies: 'HEMA sensitivity — HEMA-free formulas only',
  notes: 'Prefers warm neutrals. Skip long tips before travel weeks.',
}

export const REWARD_TIERS = [
  { name: 'Rose', threshold: 0, perk: '5% back in points on every order' },
  { name: 'Gold', threshold: 1500, perk: 'Free shipping, early access to drops' },
  { name: 'Platinum', threshold: 3000, perk: 'Free shipping, a birthday set, studio priority' },
]

export const SEED_REWARDS = [
  { id: 'r1', title: 'Rs 1,500 off your next order', cost: 1000, blurb: 'Applies to any order over Rs 6,000.' },
  { id: 'r2', title: 'Free Chrome Powder Trio', cost: 1800, blurb: 'Added to your next shipment.' },
  { id: 'r3', title: 'Free express shipping', cost: 600, blurb: 'Next-day delivery on one order.' },
  { id: 'r4', title: 'Bespoke set consultation', cost: 3200, blurb: 'A 30-minute session with Eimi.' },
]

export const SEED_POINT_HISTORY = [
  { id: 'h1', date: '2026-09-12', label: 'Order NBE-8492', points: 240 },
  { id: 'h2', date: '2026-08-28', label: 'Order NBE-8104', points: 160 },
  { id: 'h3', date: '2026-08-14', label: 'Review bonus', points: 100 },
  { id: 'h4', date: '2026-08-10', label: 'Order NBE-7521', points: 140 },
  { id: 'h5', date: '2026-07-19', label: 'Order NBE-7188', points: 445 },
]

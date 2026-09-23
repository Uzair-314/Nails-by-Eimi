/**
 * Data access layer, backed by Supabase.
 *
 * Every screen talks to the app through these functions and nothing else. The
 * shapes they return are the same ones the storefront used when this was mock
 * data, so components did not have to change when the database arrived.
 */

import { supabase } from './supabase'

const fail = (error) => { if (error) throw error }

/* ---------------------------------------------------------------- mapping */

/** Database row -> the product shape the UI expects. */
function toProduct(row) {
  const images = (row.product_images ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => i.url)

  const price = Number(row.price)
  const compareAt = row.compare_at == null ? null : Number(row.compare_at)

  // A product can sit on several shelves. Its home — what the breadcrumb and the
  // eyebrow show — is the first real category, skipping promotional shelves like
  // Deals, which describe why a product is there rather than what it is.
  const categories = (row.product_categories ?? [])
    .map((pc) => pc.categories)
    .filter(Boolean)
    .sort((a, b) => a.sort_order - b.sort_order)

  const primary = categories.find((c) => !c.is_promotional) ?? categories[0] ?? null

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    details: row.details ?? [],
    price,
    compareAt,
    onSale: compareAt != null && compareAt > price,
    stock: row.is_available ? row.stock : 0,
    rawStock: row.stock,
    isAvailable: row.is_available,
    isActive: row.is_active,
    isFeatured: row.is_featured,
    categories,
    categorySlugs: categories.map((c) => c.slug),
    category: primary?.slug ?? null,
    categoryName: primary?.name ?? null,
    tags: row.tags ?? [],
    // The shade the admin picked. Both are null on a product that has none, and
    // undefined on a shop still reading a database without the columns — so
    // every render guards on the value rather than assuming it is there.
    color: row.color_name ?? null,
    colorHex: row.color_hex ?? null,
    rating: Number(row.rating),
    reviews: row.reviews_count,
    createdAt: row.created_at,
    image: images[0] ?? '/media/p-pearl.svg',
    images: images.length ? images : ['/media/p-pearl.svg'],
  }
}

const PRODUCT_SELECT =
  '*, product_categories(categories(slug, name, sort_order, is_promotional)), product_images(url, alt, sort_order)'

/* -------------------------------------------------------------- catalogue */

export async function listCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')
  fail(error)
  return data
}

export async function listProducts({ category, search, sort = 'featured', tags, limit, includeInactive } = {}) {
  let query = supabase.from('products').select(PRODUCT_SELECT)
  if (!includeInactive) query = query.eq('is_active', true)

  if (search?.trim()) {
    // PostgREST parses `or=(...)` as a comma-separated list, so an unquoted
    // comma in the term breaks the filter and the request 400s. Quoting the
    // pattern makes the comma literal; the backslash escape protects any
    // quote the visitor typed.
    const pattern = `%${search.trim().replace(/["\\]/g, '\\$&')}%`
    query = query.or(`name.ilike."${pattern}",description.ilike."${pattern}"`)
  }
  if (tags?.length) query = query.overlaps('tags', tags)

  const { data, error } = await query
  fail(error)

  let items = (data ?? []).map(toProduct)

  // Category filtering happens here rather than in SQL because a product also
  // belongs to its parent category and, when discounted, to the Deals shelf.
  if (category) {
    items = items.filter((p) => {
      // Any shelf the product sits on, or the parent of one of them.
      if (p.categorySlugs.includes(category)) return true
      if (p.categorySlugs.some((s) => s.includes('/') && s.split('/')[0] === category)) return true
      // Discounted products join Deals whether or not anyone ticked it.
      if (category === 'deals' && (p.onSale || p.tags.includes('deal'))) return true
      return false
    })
  }

  const sorters = {
    featured: (a, b) => b.rating * Math.log10(b.reviews + 10) - a.rating * Math.log10(a.reviews + 10),
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating,
  }
  items.sort(sorters[sort] ?? sorters.featured)

  return limit ? items.slice(0, limit) : items
}

export async function getProduct(slug) {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .maybeSingle()
  fail(error)
  return data ? toProduct(data) : null
}

export async function listRelated(product, limit = 4) {
  // An uncategorised product has nothing to be related to by category, so fall
  // back to the featured ordering rather than listing the entire catalogue.
  const all = product.category
    ? await listProducts({ category: product.category })
    : await listProducts({ limit: limit + 1 })
  return all.filter((p) => p.id !== product.id).slice(0, limit)
}

export async function searchSuggestions(query, limit = 6) {
  if (!query.trim()) return []
  return listProducts({ search: query, limit })
}

/* ---------------------------------------------------------------- account */

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  fail(error)
  if (!data) return null

  return {
    id: data.id,
    email: data.email ?? user.email,
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone ?? '',
    isAdmin: data.is_admin,
    tier: data.tier,
    points: data.points,
    avatarTone: data.avatar_tone,
    memberSince: data.member_since,
    prefs: data.prefs ?? {},
    ...tierProgress(data.points),
  }
}

/** Tier thresholds live here so the loyalty screens agree with each other. */
export const TIERS = [
  { name: 'Rose', threshold: 0, perk: '5% back in points on every order' },
  { name: 'Gold', threshold: 1500, perk: 'Free shipping, early access to drops' },
  { name: 'Platinum', threshold: 3000, perk: 'Free shipping, a birthday set, priority support' },
]

function tierProgress(points) {
  const next = TIERS.find((t) => t.threshold > points)
  return {
    nextTier: next?.name ?? null,
    pointsToNextTier: next ? next.threshold - points : 0,
  }
}

export async function updateUser(patch) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const row = {}
  if (patch.firstName !== undefined) row.first_name = patch.firstName
  if (patch.lastName !== undefined) row.last_name = patch.lastName
  if (patch.phone !== undefined) row.phone = patch.phone
  if (patch.prefs !== undefined) row.prefs = patch.prefs

  const { error } = await supabase.from('profiles').update(row).eq('id', user.id)
  fail(error)
  return getUser()
}

/* ----------------------------------------------------------------- orders */

const toOrder = (row) => ({
  id: row.order_number,
  uuid: row.id,
  status: row.status,
  placedAt: row.created_at,
  subtotal: Number(row.subtotal),
  shipping: Number(row.shipping),
  discount: Number(row.discount),
  total: Number(row.total),
  tracking: row.tracking,
  address: row.address,
  customer: row.profiles
    ? { name: `${row.profiles.first_name} ${row.profiles.last_name}`.trim(), email: row.profiles.email }
    : null,
  items: (row.order_items ?? []).map((i) => ({
    productSlug: i.slug,
    name: i.name,
    qty: i.qty,
    price: Number(i.price),
    image: i.image ?? '/media/p-pearl.svg',
  })),
})

export async function listOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
  fail(error)
  return (data ?? []).map(toOrder)
}

/**
 * Places an order. Works signed in or not — the database decides what is
 * charged, so nothing here needs trusting.
 */
export async function createOrder({
  items, addressId, address, billing, contact, discountCode, notes, shippingMethodId,
}) {
  let snapshot = address
  if (!snapshot && addressId) {
    const { data } = await supabase.from('addresses').select('*').eq('id', addressId).maybeSingle()
    snapshot = data
  }

  const { data, error } = await supabase.rpc('place_order', {
    p_items: items.map((i) => ({ product_id: i.id, qty: i.qty })),
    p_address: snapshot ?? null,
    p_contact: contact ?? null,
    p_discount: discountCode ?? null,
    p_notes: notes ?? null,
    p_shipping: shippingMethodId ?? null,
    p_billing: billing ?? null,
  })
  fail(error)

  return {
    ...toOrder({ ...data, order_items: [] }),
    deliveryNotes: data.delivery_notes,
    shippingMethod: data.shipping_method,
    contact: { name: data.guest_name, email: data.guest_email, phone: data.guest_phone },
  }
}

/* --------------------------------------------------------------- shipping */

export async function listShippingMethods() {
  const { data, error } = await supabase
    .from('shipping_methods')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  fail(error)

  return (data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    price: Number(m.price),
    freeOver: m.free_over == null ? null : Number(m.free_over),
    estimate: m.estimate,
  }))
}

/** What this method costs for a given subtotal. */
export const shippingCostFor = (method, subtotal) =>
  !method ? 0
    : method.freeOver != null && subtotal >= method.freeOver ? 0
    : method.price

/* ------------------------------------------------------- abandoned baskets */

/**
 * Remembers a half-finished checkout so it can be followed up. Keyed by an id
 * the browser keeps, so returning updates the same row instead of piling up.
 */
export async function saveAbandonedCart({ id, name, email, phone, items, subtotal }) {
  const { error } = await supabase.rpc('save_abandoned_cart', {
    p_id: id,
    p_name: name || null,
    p_email: email || null,
    p_phone: phone || null,
    p_items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
    p_subtotal: subtotal,
  })
  if (error) throw error
}

export async function markCartConverted(id) {
  await supabase.rpc('mark_cart_converted', { p_id: id })
}

/* -------------------------------------------------------------- addresses */

const toAddress = (r) => ({
  id: r.id, label: r.label, name: r.name, line1: r.line1, line2: r.line2 ?? '',
  city: r.city, postcode: r.postcode, country: r.country, phone: r.phone ?? '',
  isDefault: r.is_default,
})

export async function listAddresses() {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .order('is_default', { ascending: false })
  fail(error)
  return (data ?? []).map(toAddress)
}

export async function saveAddress(address) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const row = {
    user_id: user.id,
    label: address.label, name: address.name,
    line1: address.line1, line2: address.line2 || null,
    city: address.city, postcode: address.postcode,
    country: address.country, phone: address.phone || null,
    is_default: address.isDefault,
  }

  const { error } = address.id
    ? await supabase.from('addresses').update(row).eq('id', address.id)
    : await supabase.from('addresses').insert(row)
  fail(error)
  return listAddresses()
}

export async function deleteAddress(id) {
  fail((await supabase.from('addresses').delete().eq('id', id)).error)
  return listAddresses()
}

/* ---------------------------------------------------------- nail profile */

export async function getNailProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('nail_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()
  fail(error)

  return {
    shape: data?.shape ?? 'Almond',
    length: data?.length ?? 'Medium',
    finish: data?.finish ?? 'Glossy',
    sizes: data?.sizes ?? { thumb: 2, index: 5, middle: 4, ring: 6, pinky: 8 },
    allergies: data?.allergies ?? '',
    notes: data?.notes ?? '',
  }
}

export async function saveNailProfile(profile) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const { error } = await supabase.from('nail_profiles').upsert({
    user_id: user.id,
    shape: profile.shape, length: profile.length, finish: profile.finish,
    sizes: profile.sizes, allergies: profile.allergies, notes: profile.notes,
  })
  fail(error)
  return profile
}

/* --------------------------------------------------------------- wishlist */

export async function listWishlist() {
  const { data, error } = await supabase
    .from('wishlists')
    .select(`product_id, products(${PRODUCT_SELECT})`)
  fail(error)
  return (data ?? []).filter((r) => r.products).map((r) => toProduct(r.products))
}

export async function addToWishlist(productId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  fail((await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId })).error)
}

export async function removeFromWishlist(productId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  fail((await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId)).error)
}

/* ---------------------------------------------------------------- loyalty */

export async function listPointHistory() {
  const { data, error } = await supabase
    .from('point_history')
    .select('*')
    .order('created_at', { ascending: false })
  fail(error)
  return (data ?? []).map((r) => ({ id: r.id, date: r.created_at, label: r.label, points: r.points }))
}

export async function listRewards() {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  fail(error)
  return (data ?? []).map((r) => ({ id: r.id, title: r.title, blurb: r.blurb, cost: r.cost }))
}

export async function redeemReward(reward) {
  const { error } = await supabase.rpc('redeem_reward', { p_reward: reward.id })
  fail(error)
  return getUser()
}

/* --------------------------------------------------------------- settings */

export async function getSettings() {
  const { data, error } = await supabase.from('site_settings').select('*')
  fail(error)
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
}

/* ---------------------------------------------------------------- contact */

export async function sendContactMessage({ name, email, topic, message }) {
  const { error } = await supabase
    .from('contact_messages')
    .insert({ name, email, topic, message })
  fail(error)
  return true
}

/* ---------------------------------------------------------------- history */

/**
 * One dated feed of everything that has happened on this account: orders
 * placed, points earned, rewards redeemed. Orders and points are stored
 * separately, so they are merged here rather than in SQL.
 */
export async function listMyActivity() {
  const [orders, points] = await Promise.all([listOrders(), listPointHistory()])

  const fromOrders = orders.map((o) => ({
    id: `order-${o.uuid}`,
    at: o.placedAt,
    kind: 'order',
    title: `Order ${o.id} placed`,
    detail: `${o.items.length} ${o.items.length === 1 ? 'item' : 'items'}`,
    amount: o.total,
    status: o.status,
    link: '/account/orders',
  }))

  const fromPoints = points.map((p) => ({
    id: `points-${p.id}`,
    at: p.date,
    kind: p.points < 0 ? 'redeemed' : 'points',
    title: p.label,
    detail: p.points < 0 ? 'Reward redeemed' : 'Points earned',
    points: p.points,
    link: '/account/rewards',
  }))

  return [...fromOrders, ...fromPoints].sort((a, b) => new Date(b.at) - new Date(a.at))
}

/* ------------------------------------------------------------------- cart */

/**
 * The signed-in cart. Only product ids and quantities are stored — name, price
 * and image come from the product on load, so a bag left for a week reflects
 * today's prices rather than a stale snapshot.
 *
 * Lines whose product has since been hidden or sold out are dropped: they could
 * not be ordered anyway, and a line with zero stock makes the quantity stepper
 * behave strangely.
 */
export async function listCart() {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`qty, products(${PRODUCT_SELECT})`)
  fail(error)

  return (data ?? [])
    .filter((row) => row.products?.is_active && row.products?.is_available && row.products?.stock > 0)
    .map((row) => {
      const p = toProduct(row.products)
      return {
        id: p.id, slug: p.slug, name: p.name, price: p.price,
        image: p.image, stock: p.stock,
        qty: Math.max(1, Math.min(row.qty, p.stock)),
      }
    })
}

/**
 * Makes the stored cart match these lines.
 *
 * Upserts first and only then removes what is no longer in the bag. Deleting
 * first would empty someone's cart if the insert then failed — a product
 * deleted in the admin while the bag was open is enough to cause that.
 */
export async function saveCart(lines) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  if (lines.length) {
    fail((await supabase.from('cart_items').upsert(
      lines.map((l) => ({ user_id: user.id, product_id: l.id, qty: l.qty, updated_at: new Date().toISOString() })),
      { onConflict: 'user_id,product_id' }
    )).error)
  }

  let remove = supabase.from('cart_items').delete().eq('user_id', user.id)
  if (lines.length) remove = remove.not('product_id', 'in', `(${lines.map((l) => l.id).join(',')})`)
  fail((await remove).error)
}

/**
 * Folds a guest cart into the stored one on sign-in, keeping the larger
 * quantity for anything in both. Summing would silently double an item someone
 * added on two devices.
 */
export async function mergeGuestCart(guestLines) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // A guest bag can outlive the products in it. One missing id would fail the
  // whole insert on the foreign key, so drop them before writing.
  let valid = []
  if (guestLines.length) {
    const { data: live } = await supabase
      .from('products')
      .select('id')
      .in('id', guestLines.map((l) => l.id))
    const liveIds = new Set((live ?? []).map((r) => r.id))
    valid = guestLines.filter((l) => liveIds.has(l.id))
  }

  if (valid.length) {
    const { data: existing } = await supabase
      .from('cart_items')
      .select('product_id, qty')
      .eq('user_id', user.id)

    const merged = new Map((existing ?? []).map((r) => [r.product_id, r.qty]))
    for (const line of valid) {
      merged.set(line.id, Math.max(merged.get(line.id) ?? 0, line.qty))
    }

    fail((await supabase.from('cart_items').upsert(
      [...merged].map(([product_id, qty]) => ({ user_id: user.id, product_id, qty })),
      { onConflict: 'user_id,product_id' }
    )).error)
  }

  return listCart()
}

/* ------------------------------------------------------------ order status */

const toTracked = (row) => !row ? null : {
  orderNumber: row.order_number,
  status: row.status,
  total: Number(row.total),
  shippingMethod: row.shipping_method,
  tracking: row.tracking,
  placedAt: row.created_at,
  updatedAt: row.updated_at,
}

/**
 * Looks up an order by its uuid, which the browser keeps after checkout.
 *
 * Null means the order is genuinely gone. A failed request throws instead, and
 * the difference matters: the caller forgets an order it is told no longer
 * exists, and for a guest that uuid is the only handle they have on it. A
 * network blip must not be mistaken for a deletion.
 */
export async function trackOrderById(id) {
  if (!id) return null
  const { data, error } = await supabase.rpc('track_order_by_id', { p_id: id })
  fail(error)
  return toTracked(data?.[0])
}

/** Looks up an order by its number and the phone it was placed with. */
export async function trackOrder(orderNumber, phone) {
  const { data, error } = await supabase.rpc('track_order', {
    p_number: orderNumber,
    p_phone: phone,
  })
  fail(error)
  return toTracked(data?.[0])
}

/* ----------------------------------------------------------- notifications */

/** Unread notifications for the signed-in customer. Guests have none. */
export async function listNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, message, status, order_id, created_at')
    .eq('audience', 'customer')
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) return []
  return data ?? []
}

export async function markNotificationsRead(ids) {
  if (!ids?.length) return
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .in('id', ids)
}

/* ------------------------------------------------------------ hero slides */

/**
 * The home page carousel, run from the admin.
 *
 * `focal` becomes CSS object-position. The image is always drawn with
 * object-cover, which never stretches it — but the slot is a different shape on
 * phone, tablet and desktop, so something has to be cropped, and this decides
 * what stays in frame.
 */
export async function listHeroSlides() {
  const { data, error } = await supabase
    .from('hero_slides')
    .select('*, products(slug), categories(slug)')
    .eq('is_active', true)
    .order('sort_order')
    .limit(3)
  fail(error)

  return (data ?? []).map((s) => ({
    id: s.id,
    image: s.image_url,
    alt: s.alt ?? '',
    eyebrow: s.eyebrow,
    title: s.title,
    copy: s.copy,
    focal: `${s.focal_x}% ${s.focal_y}%`,
    cta: s.cta_label
      ? { label: s.cta_label, to: linkTarget(s) }
      : null,
  }))
}

/** Resolves a slide or announcement link to a path. Null when the target has gone. */
function linkTarget(s) {
  switch (s.link_type) {
    case 'product':  return s.products?.slug  ? `/product/${s.products.slug}`   : null
    case 'category': return s.categories?.slug ? `/category/${s.categories.slug}` : null
    case 'url':      return s.url || null
    default:         return null
  }
}

/* ---------------------------------------------------------- announcements */

/** The pink strip across the very top. Editable under Announcements in the admin. */
export async function listAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*, products(slug), categories(slug)')
    .eq('is_active', true)
    .order('sort_order')
  fail(error)

  return (data ?? []).map((a) => ({
    id: a.id,
    text: a.text,
    to: linkTarget(a),
  }))
}

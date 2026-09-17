/**
 * Data access layer.
 *
 * Every screen talks to the app through these functions and nothing else, so the
 * Supabase migration is a rewrite of this file alone: swap the local store for
 * `supabase.from('products').select()` etc. and keep the same return shapes.
 *
 * Writes persist to localStorage so the demo survives a refresh.
 */

import { PRODUCTS, categoriesFor } from '../data/products'
import {
  SEED_ADDRESSES, SEED_CARDS, SEED_NAIL_PROFILE, SEED_ORDERS, SEED_POINT_HISTORY, SEED_USER,
} from '../data/account'

const LATENCY = 220
const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), LATENCY))

const KEY = (name) => `nbe:${name}`

function read(name, fallback) {
  try {
    const raw = localStorage.getItem(KEY(name))
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(name, value) {
  try {
    localStorage.setItem(KEY(name), JSON.stringify(value))
  } catch {
    /* Private mode or a full quota — the in-memory value still works for this session. */
  }
  return value
}

const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`

/* ---------------------------------------------------------------- catalogue */

export function listProducts({ category, search, sort = 'featured', tags, limit } = {}) {
  let items = [...PRODUCTS]

  if (category) items = items.filter((it) => categoriesFor(it).includes(category))
  if (tags?.length) items = items.filter((it) => tags.some((t) => it.tags.includes(t)))

  if (search) {
    const q = search.trim().toLowerCase()
    if (q) {
      items = items.filter((it) =>
        [it.name, it.description, it.category, ...it.tags].join(' ').toLowerCase().includes(q)
      )
    }
  }

  const sorters = {
    featured: (a, b) => b.rating * Math.log10(b.reviews + 10) - a.rating * Math.log10(a.reviews + 10),
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating,
  }
  items.sort(sorters[sort] ?? sorters.featured)

  return delay(limit ? items.slice(0, limit) : items)
}

export function getProduct(slug) {
  const found = PRODUCTS.find((it) => it.slug === slug)
  return delay(found ?? null)
}

export function listRelated(product, limit = 4) {
  const related = PRODUCTS
    .filter((it) => it.id !== product.id && categoriesFor(it).some((c) => categoriesFor(product).includes(c)))
    .slice(0, limit)
  return delay(related)
}

export function searchSuggestions(query, limit = 6) {
  const q = query.trim().toLowerCase()
  if (!q) return delay([])
  return delay(
    PRODUCTS.filter((it) => it.name.toLowerCase().includes(q) || it.tags.some((t) => t.includes(q))).slice(0, limit)
  )
}

/* ------------------------------------------------------------------ account */

export function getUser() {
  return delay(read('user', SEED_USER))
}

export function updateUser(patch) {
  const next = { ...read('user', SEED_USER), ...patch }
  return delay(write('user', next))
}

export function listOrders() {
  return delay(read('orders', SEED_ORDERS))
}

export function createOrder({ items, total, addressId }) {
  const orders = read('orders', SEED_ORDERS)
  const order = {
    id: `NBE-${Math.floor(1000 + Math.random() * 8999)}`,
    placedAt: new Date().toISOString().slice(0, 10),
    status: 'processing',
    total,
    items: items.map((it) => ({
      productSlug: it.slug, name: it.name, qty: it.qty, price: it.price, image: it.image,
    })),
    tracking: null,
    address: addressId,
  }
  write('orders', [order, ...orders])

  // Loyalty: five points per unit of currency spent.
  const user = read('user', SEED_USER)
  const earned = Math.round(total * 5)
  write('user', { ...user, points: user.points + earned })
  write('points', [
    { id: uid('h'), date: order.placedAt, label: `Order ${order.id}`, points: earned },
    ...read('points', SEED_POINT_HISTORY),
  ])

  return delay(order)
}

export function listAddresses() {
  return delay(read('addresses', SEED_ADDRESSES))
}

export function saveAddress(address) {
  const list = read('addresses', SEED_ADDRESSES)
  const record = address.id ? address : { ...address, id: uid('addr') }
  let next = address.id ? list.map((a) => (a.id === address.id ? record : a)) : [...list, record]
  if (record.isDefault) next = next.map((a) => ({ ...a, isDefault: a.id === record.id }))
  return delay(write('addresses', next))
}

export function deleteAddress(id) {
  const next = read('addresses', SEED_ADDRESSES).filter((a) => a.id !== id)
  return delay(write('addresses', next))
}

export function listCards() {
  return delay(read('cards', SEED_CARDS))
}

export function setDefaultCard(id) {
  const next = read('cards', SEED_CARDS).map((c) => ({ ...c, isDefault: c.id === id }))
  return delay(write('cards', next))
}

export function deleteCard(id) {
  const next = read('cards', SEED_CARDS).filter((c) => c.id !== id)
  return delay(write('cards', next))
}

export function getNailProfile() {
  return delay(read('nailProfile', SEED_NAIL_PROFILE))
}

export function saveNailProfile(profile) {
  return delay(write('nailProfile', profile))
}

export function listPointHistory() {
  return delay(read('points', SEED_POINT_HISTORY))
}

export function redeemReward(reward) {
  const user = read('user', SEED_USER)
  if (user.points < reward.cost) return Promise.reject(new Error('Not enough points'))
  const next = write('user', { ...user, points: user.points - reward.cost })
  write('points', [
    { id: uid('h'), date: new Date().toISOString().slice(0, 10), label: `Redeemed: ${reward.title}`, points: -reward.cost },
    ...read('points', SEED_POINT_HISTORY),
  ])
  return delay(next)
}

/* ------------------------------------------------------------------ contact */

export function sendContactMessage(payload) {
  const list = read('messages', [])
  const record = { ...payload, id: uid('msg'), sentAt: new Date().toISOString() }
  write('messages', [record, ...list])
  return delay(record)
}

/**
 * Cart, wishlist and toast state.
 *
 * Both follow the account when there is one, so a bag filled on a phone is
 * still there on a laptop. Guests use localStorage instead, and whatever they
 * collected is merged in on their next sign-in — the larger quantity wins for
 * anything in both, since summing would silently double an item added on two
 * devices.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  addToWishlist, getSettings, listCategories, listShippingMethods, listWishlist,
  mergeGuestCart, removeFromWishlist, saveCart, shippingCostFor,
} from '../lib/api'
import { useAuth } from './AuthContext'

const StoreContext = createContext(null)

const CART_KEY = 'nbe:cart'
const WISH_KEY = 'nbe:wishlist'

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* quota or private mode */ }
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'add': {
      const { product, qty } = action
      // Wishlist rows carry no stock count; the checkout RPC is the real
      // guard against overselling, so fall back to a permissive cap here.
      const stock = Number.isFinite(product.stock) ? product.stock : 99
      const existing = state.find((line) => line.id === product.id)
      if (existing) {
        return state.map((line) =>
          line.id === product.id ? { ...line, qty: Math.min(line.qty + qty, stock) } : line
        )
      }
      return [...state, {
        id: product.id, slug: product.slug, name: product.name,
        price: product.price, image: product.image, stock,
        qty: Math.min(qty, stock),
      }]
    }
    case 'setQty':
      return state
        .map((line) => (line.id === action.id ? { ...line, qty: Math.max(0, Math.min(action.qty, line.stock)) } : line))
        .filter((line) => line.qty > 0)
    case 'remove':
      return state.filter((line) => line.id !== action.id)
    case 'replace':
      return action.lines
    case 'clear':
      return []
    default:
      return state
  }
}

const DEFAULT_MINIMUM = 1000

export function StoreProvider({ children }) {
  const { isSignedIn } = useAuth()
  const [cart, dispatch] = useReducer(cartReducer, null, () => load(CART_KEY, []))
  const [wishlist, setWishlist] = useState(() => load(WISH_KEY, []))
  const [toasts, setToasts] = useState([])
  const [minimumOrder, setMinimumOrder] = useState(DEFAULT_MINIMUM)
  const [methods, setMethods] = useState(null)
  const [settings, setSettings] = useState({})
  const [categories, setCategories] = useState([])
  // False until the first pass over the admin-editable data has finished, so the
  // chrome can show skeletons instead of an empty menu and a delivery threshold
  // of zero. Focus refetches never flip it back — what is on screen stays.
  const [storeReady, setStoreReady] = useState(false)

  const hydrating = useRef(false)
  const syncTimer = useRef(null)
  const wasSignedIn = useRef(false)

  // Empty the local bag when someone signs out. Their items are safe in the
  // account; leaving a copy behind would show the next person on a shared
  // device what was in it, and would then be merged into *their* account on
  // the next sign-in.
  useEffect(() => {
    if (wasSignedIn.current && !isSignedIn) {
      dispatch({ type: 'clear' })
      setWishlist([])
      save(CART_KEY, [])
      save(WISH_KEY, [])
    }

    // Signing in: block write-back until the account's bag has been fetched.
    // This effect is declared before the sync effect, so the flag is set before
    // sync gets a chance to run. Without it, sync would push the *guest* bag up
    // first, and saveCart removes anything not in what it is given — quietly
    // emptying a bag filled on another device.
    if (!wasSignedIn.current && isSignedIn) hydrating.current = true

    wasSignedIn.current = isSignedIn
  }, [isSignedIn])

  // Guests persist locally. Signed-in carts live in the database instead.
  useEffect(() => { if (!isSignedIn) save(CART_KEY, cart) }, [cart, isSignedIn])

  // Debounced write-through: the reducer stays the source of truth for the UI,
  // and the server catches up a moment later.
  useEffect(() => {
    if (!isSignedIn || hydrating.current) return
    clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => { saveCart(cart).catch(() => {}) }, 500)
    return () => clearTimeout(syncTimer.current)
  }, [cart, isSignedIn])
  useEffect(() => { if (!isSignedIn) save(WISH_KEY, wishlist) }, [wishlist, isSignedIn])

  // Settings and categories are both editable in the admin panel, so the shop
  // reads them from the database rather than from a file in the bundle.
  const loadStoreData = useCallback(() => {
    const settled = []

    settled.push(getSettings()
      .then((s) => {
        setSettings(s)
        setMinimumOrder(Number(s.minimum_order ?? DEFAULT_MINIMUM))
      })
      .catch(() => { /* keep whatever we have if the store is unreachable */ }))

    // What the bag quotes for delivery has to be what the order is actually
    // charged, and that comes from the delivery methods in the admin — never
    // from a separate setting that could drift away from them.
    settled.push(listShippingMethods()
      .then(setMethods)
      .catch(() => { /* same */ }))

    settled.push(listCategories()
      .then((rows) => setCategories(rows.filter((c) => c.is_active)))
      .catch(() => { /* same */ }))

    // Settled, not fulfilled: a shop that cannot reach the database has to stop
    // showing skeletons too, or a failed load pulses grey for ever.
    Promise.all(settled).then(() => setStoreReady(true))
  }, [])

  // Re-read when the tab regains focus, so a category renamed or a delivery
  // threshold changed in the admin shows up without a manual reload.
  useEffect(() => {
    loadStoreData()
    const refresh = () => { if (!document.hidden) loadStoreData() }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [loadStoreData])

  const toast = useCallback((message) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((list) => [...list, { id, message }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 2600)
  }, [])

  // On sign-in, push anything saved as a guest up to the account, then read back.
  useEffect(() => {
    let active = true
    if (!isSignedIn) return

    ;(async () => {
      const pendingWishes = load(WISH_KEY, [])
      for (const item of pendingWishes) {
        try { await addToWishlist(item.id) } catch { /* already saved */ }
      }
      if (pendingWishes.length) save(WISH_KEY, [])
      try {
        const rows = await listWishlist()
        if (active) setWishlist(rows.map((p) => ({ id: p.id, slug: p.slug, name: p.name, price: p.price, image: p.image })))
      } catch { /* leave what we have */ }

      // Fold the guest bag into the account, then adopt the account's bag.
      try {
        const merged = await mergeGuestCart(load(CART_KEY, []))
        if (active) {
          dispatch({ type: 'replace', lines: merged })
          save(CART_KEY, [])
        }
      } catch { /* keep the local bag if the merge fails */ }

      // Let the sync effect run again only once hydration has settled.
      setTimeout(() => { hydrating.current = false }, 0)
    })()

    return () => { active = false }
  }, [isSignedIn])

  const addToCart = useCallback((product, qty = 1) => {
    dispatch({ type: 'add', product, qty })
    toast(`${product.name} added to bag`)
  }, [toast])

  const toggleWishlist = useCallback(async (product) => {
    const saved = wishlist.some((it) => it.id === product.id)

    setWishlist((list) => saved
      ? list.filter((it) => it.id !== product.id)
      : [...list, { id: product.id, slug: product.slug, name: product.name, price: product.price, image: product.image }])

    toast(saved ? `${product.name} removed from wishlist` : `${product.name} saved to wishlist`)

    if (!isSignedIn) return
    try {
      if (saved) await removeFromWishlist(product.id)
      else await addToWishlist(product.id)
    } catch {
      toast('Could not sync your wishlist')
    }
  }, [wishlist, isSignedIn, toast])

  const value = useMemo(() => {
    const count = cart.reduce((sum, line) => sum + line.qty, 0)
    const subtotal = cart.reduce((sum, line) => sum + line.qty * line.price, 0)
    // The checkout preselects the first method and `place_order` falls back to
    // the same one, so quoting anything else here would show a total the order
    // then contradicts.
    const fallback = methods?.[0] ?? null
    const delivery = methods == null ? null : subtotal === 0 ? 0 : shippingCostFor(fallback, subtotal)

    return {
      cart,
      count,
      subtotal,
      shipping: delivery,
      total: subtotal + (delivery ?? 0),
      shippingRules: { freeOver: fallback?.freeOver ?? null, minimumOrder },
      settings,
      categories,
      storeLoading: !storeReady,
      belowMinimum: subtotal > 0 && subtotal < minimumOrder,
      addToCart,
      setQty: (id, qty) => dispatch({ type: 'setQty', id, qty }),
      removeFromCart: (id) => dispatch({ type: 'remove', id }),
      clearCart: () => dispatch({ type: 'clear' }),
      wishlist,
      toggleWishlist,
      inWishlist: (id) => wishlist.some((it) => it.id === id),
      toasts,
      toast,
    }
  }, [cart, wishlist, toasts, minimumOrder, methods, settings, categories, storeReady, addToCart, toggleWishlist, toast])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

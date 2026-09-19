/**
 * Cart, wishlist and toast state.
 *
 * The cart stays in localStorage so people can shop before signing in. The
 * wishlist follows the account when there is one, and falls back to
 * localStorage for guests — anything saved as a guest is merged into the
 * account on the next sign-in.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { addToWishlist, getSettings, listCategories, listWishlist, removeFromWishlist } from '../lib/api'
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
    case 'clear':
      return []
    default:
      return state
  }
}

const DEFAULT_SHIPPING = { freeOver: 5000, flatRate: 300, minimumOrder: 1000 }

export function StoreProvider({ children }) {
  const { isSignedIn } = useAuth()
  const [cart, dispatch] = useReducer(cartReducer, null, () => load(CART_KEY, []))
  const [wishlist, setWishlist] = useState(() => load(WISH_KEY, []))
  const [toasts, setToasts] = useState([])
  const [shipping, setShipping] = useState(DEFAULT_SHIPPING)
  const [settings, setSettings] = useState({})
  const [categories, setCategories] = useState([])

  useEffect(() => { save(CART_KEY, cart) }, [cart])
  useEffect(() => { if (!isSignedIn) save(WISH_KEY, wishlist) }, [wishlist, isSignedIn])

  // Settings and categories are both editable in the admin panel, so the shop
  // reads them from the database rather than from a file in the bundle.
  const loadStoreData = useCallback(() => {
    getSettings()
      .then((s) => {
        setSettings(s)
        setShipping({
          freeOver: Number(s.shipping_free_over ?? DEFAULT_SHIPPING.freeOver),
          flatRate: Number(s.shipping_flat_rate ?? DEFAULT_SHIPPING.flatRate),
          minimumOrder: Number(s.minimum_order ?? DEFAULT_SHIPPING.minimumOrder),
        })
      })
      .catch(() => { /* keep whatever we have if the store is unreachable */ })

    listCategories()
      .then((rows) => setCategories(rows.filter((c) => c.is_active)))
      .catch(() => { /* same */ })
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
      const pending = load(WISH_KEY, [])
      for (const item of pending) {
        try { await addToWishlist(item.id) } catch { /* already saved */ }
      }
      if (pending.length) save(WISH_KEY, [])
      try {
        const rows = await listWishlist()
        if (active) setWishlist(rows.map((p) => ({ id: p.id, slug: p.slug, name: p.name, price: p.price, image: p.image })))
      } catch { /* leave what we have */ }
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
    const delivery = subtotal === 0 || subtotal >= shipping.freeOver ? 0 : shipping.flatRate
    return {
      cart,
      count,
      subtotal,
      shipping: delivery,
      total: subtotal + delivery,
      shippingRules: shipping,
      settings,
      categories,
      belowMinimum: subtotal > 0 && subtotal < shipping.minimumOrder,
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
  }, [cart, wishlist, toasts, shipping, settings, categories, addToCart, toggleWishlist, toast])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

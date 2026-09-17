/**
 * Cart, wishlist and toast state for the whole storefront.
 * Persisted to localStorage; swap the persistence calls for Supabase rows later.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react'

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

function cartReducer(state, action) {
  switch (action.type) {
    case 'add': {
      const { product, qty } = action
      const existing = state.find((line) => line.id === product.id)
      if (existing) {
        return state.map((line) =>
          line.id === product.id ? { ...line, qty: Math.min(line.qty + qty, product.stock) } : line
        )
      }
      return [
        ...state,
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.image,
          stock: product.stock,
          qty: Math.min(qty, product.stock),
        },
      ]
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

export function StoreProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, null, () => load(CART_KEY, []))
  const [wishlist, setWishlist] = useState(() => load(WISH_KEY, []))
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)) } catch { /* quota */ }
  }, [cart])

  useEffect(() => {
    try { localStorage.setItem(WISH_KEY, JSON.stringify(wishlist)) } catch { /* quota */ }
  }, [wishlist])

  const toast = useCallback((message, tone = 'default') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((list) => [...list, { id, message, tone }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 2600)
  }, [])

  const addToCart = useCallback((product, qty = 1) => {
    dispatch({ type: 'add', product, qty })
    toast(`${product.name} added to bag`)
  }, [toast])

  const toggleWishlist = useCallback((product) => {
    setWishlist((list) => {
      const exists = list.some((it) => it.id === product.id)
      if (exists) {
        toast(`${product.name} removed from wishlist`)
        return list.filter((it) => it.id !== product.id)
      }
      toast(`${product.name} saved to wishlist`)
      return [...list, { id: product.id, slug: product.slug, name: product.name, price: product.price, image: product.image }]
    })
  }, [toast])

  const value = useMemo(() => {
    const count = cart.reduce((sum, line) => sum + line.qty, 0)
    const subtotal = cart.reduce((sum, line) => sum + line.qty * line.price, 0)
    const shipping = subtotal === 0 || subtotal >= 50 ? 0 : 4.95
    return {
      cart,
      count,
      subtotal,
      shipping,
      total: subtotal + shipping,
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
  }, [cart, wishlist, toasts, addToCart, toggleWishlist, toast])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from './Icon'
import { formatPrice } from '../lib/format'
import { useStore } from '../context/StoreContext'

/**
 * The bag, as a panel over the current page.
 *
 * Adding something opens this rather than navigating, so a shopper can see what
 * is in the bag without losing the listing they were half way down. The header's
 * cart button still goes to `/cart`, which is the full page with the order
 * summary — this is the glance, that is the desk.
 *
 * Roughly half the width on a wide screen and nearly all of it on a phone, where
 * a narrow panel would leave a strip of unreachable page beside it.
 */
export default function CartDrawer() {
  const {
    cart, count, subtotal, shipping, total,
    setQty, removeFromCart, shippingRules, belowMinimum,
    cartOpen, closeCart,
  } = useStore()

  const panelRef = useRef(null)
  const location = useLocation()

  // Following a link from inside the panel should leave it behind.
  useEffect(() => { closeCart() }, [location.pathname, location.search]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!cartOpen) return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') closeCart() }
    window.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [cartOpen, closeCart])

  // Null when no delivery method sets a threshold — there is nothing to spend
  // towards then, and the nudge would be meaningless.
  const toFreeShipping = shippingRules.freeOver == null
    ? 0
    : Math.max(0, shippingRules.freeOver - subtotal)

  return (
    <>
      <div
        onClick={closeCart}
        aria-hidden="true"
        className={[
          'fixed inset-0 z-[60] bg-ink/30 backdrop-blur-[2px] transition-opacity duration-300',
          cartOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
      />

      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        className={[
          'fixed inset-y-0 right-0 z-[60] flex w-[92vw] flex-col bg-canvas shadow-drawer',
          'sm:w-[420px] lg:w-[46vw] lg:max-w-[560px]',
          'transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] focus:outline-none',
          cartOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="leading-tight">
            <p className="font-display text-[20px] font-semibold text-ink">Your bag</p>
            <p className="text-[12px] text-muted">
              {count} {count === 1 ? 'item' : 'items'}
            </p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close bag"
            className="-mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted
                       transition hover:bg-blush hover:text-wine"
          >
            <Icon name="close" size={22} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-blush text-wine">
              <Icon name="bag" size={24} />
            </span>
            <div>
              <p className="font-display text-[18px] font-semibold text-ink">Your bag is empty</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                Nothing in here yet. Start with the new arrivals or a gel set sized to your profile.
              </p>
            </div>
            <Link to="/new-arrivals" className="btn-primary">Shop new arrivals</Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
              {cart.map((line) => (
                <li key={line.id} className="card flex gap-3 p-3">
                  <Link to={`/product/${line.slug}`} className="shrink-0">
                    <img src={line.image} alt={line.name} className="h-20 w-20 rounded-xl object-cover" />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/product/${line.slug}`} className="min-w-0">
                        <h3 className="truncate text-[14px] font-medium text-ink transition hover:text-wine">
                          {line.name}
                        </h3>
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFromCart(line.id)}
                        aria-label={`Remove ${line.name}`}
                        className="shrink-0 rounded-full p-1.5 text-muted transition hover:bg-wine-50 hover:text-wine"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>

                    <p className="mt-0.5 text-[12px] text-muted">{formatPrice(line.price)} each</p>

                    <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                      <div className="flex items-center rounded-lg border border-line bg-white">
                        <button
                          type="button"
                          onClick={() => setQty(line.id, line.qty - 1)}
                          aria-label={`Decrease quantity of ${line.name}`}
                          className="grid h-8 w-8 place-items-center text-muted transition hover:text-wine"
                        >
                          <Icon name="minus" size={14} />
                        </button>
                        <span className="w-8 text-center text-[13px] font-medium tabular-nums">{line.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(line.id, line.qty + 1)}
                          disabled={line.qty >= line.stock}
                          aria-label={`Increase quantity of ${line.name}`}
                          className="grid h-8 w-8 place-items-center text-muted transition hover:text-wine disabled:opacity-40"
                        >
                          <Icon name="plus" size={14} />
                        </button>
                      </div>
                      <p className="text-[14px] font-semibold text-wine">{formatPrice(line.price * line.qty)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-line bg-white px-5 py-4">
              {toFreeShipping > 0 && (
                <div className="mb-4 rounded-xl bg-blush p-3">
                  <p className="text-[12px] text-ink">
                    Spend <strong className="text-wine">{formatPrice(toFreeShipping)}</strong> more for free delivery.
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-wine transition-all duration-500"
                      style={{ width: `${Math.min(100, (subtotal / shippingRules.freeOver) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <dl className="space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="font-medium text-ink">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Delivery</dt>
                  <dd className="font-medium text-ink">
                    {shipping == null ? 'Calculated at checkout' : shipping === 0 ? 'Free' : formatPrice(shipping)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-line pt-2">
                  <dt className="font-medium text-ink">Total</dt>
                  <dd className="font-display text-[19px] font-semibold text-wine">{formatPrice(total)}</dd>
                </div>
              </dl>

              {/* Said here rather than at the checkout, where it would be a wasted trip. */}
              {belowMinimum && (
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-wine-50 px-3 py-2.5 text-[12px] text-wine">
                  <Icon name="info" size={14} className="mt-0.5 shrink-0" />
                  Orders start at {formatPrice(shippingRules.minimumOrder)}.
                </p>
              )}

              <Link
                to="/checkout"
                className={`btn-primary mt-4 w-full ${belowMinimum ? 'pointer-events-none opacity-50' : ''}`}
                aria-disabled={belowMinimum || undefined}
                tabIndex={belowMinimum ? -1 : undefined}
              >
                Checkout
                <Icon name="arrowRight" size={16} />
              </Link>
              <Link to="/cart" className="btn-quiet mt-2 w-full">View full bag</Link>
            </div>
          </>
        )}
      </aside>
    </>
  )
}

import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { EmptyState, PageHeading } from '../components/ui'
import { formatPrice } from '../lib/format'
import { useStore } from '../context/StoreContext'

export default function Cart() {
  const { cart, setQty, removeFromCart, subtotal, shipping, total, count, shippingRules } = useStore()

  if (cart.length === 0) {
    return (
      <div className="container-e py-12">
        <PageHeading eyebrow="Your bag" title="Shopping Bag" />
        <div className="mt-8">
          <EmptyState
            icon="bag"
            title="Your bag is empty"
            body="Nothing in here yet. Start with the new arrivals or a gel set sized to your profile."
            action={<Link to="/new-arrivals" className="btn-primary">Shop new arrivals</Link>}
          />
        </div>
      </div>
    )
  }

  const toFreeShipping = Math.max(0, shippingRules.freeOver - subtotal)

  return (
    <div className="container-e py-12">
      <PageHeading eyebrow="Your bag" title="Shopping Bag" subtitle={`${count} ${count === 1 ? 'item' : 'items'} ready to go.`} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-4">
          {cart.map((line) => (
            <li key={line.id} className="card flex gap-4 p-4">
              <Link to={`/product/${line.slug}`} className="shrink-0">
                <img src={line.image} alt={line.name} className="h-24 w-24 rounded-xl object-cover" />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/product/${line.slug}`} className="min-w-0">
                    <h2 className="truncate text-[15px] font-medium text-ink transition hover:text-wine">{line.name}</h2>
                  </Link>
                  <button
                    type="button"
                    onClick={() => removeFromCart(line.id)}
                    aria-label={`Remove ${line.name}`}
                    className="shrink-0 rounded-full p-1.5 text-muted transition hover:bg-wine-50 hover:text-wine"
                  >
                    <Icon name="trash" size={17} />
                  </button>
                </div>

                <p className="mt-1 text-[13px] text-muted">{formatPrice(line.price)} each</p>

                <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                  <div className="flex items-center rounded-lg border border-line bg-white">
                    <button
                      type="button"
                      onClick={() => setQty(line.id, line.qty - 1)}
                      aria-label={`Decrease quantity of ${line.name}`}
                      className="grid h-9 w-9 place-items-center text-muted transition hover:text-wine"
                    >
                      <Icon name="minus" size={15} />
                    </button>
                    <span className="w-9 text-center text-sm font-medium tabular-nums">{line.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(line.id, line.qty + 1)}
                      disabled={line.qty >= line.stock}
                      aria-label={`Increase quantity of ${line.name}`}
                      className="grid h-9 w-9 place-items-center text-muted transition hover:text-wine disabled:opacity-40"
                    >
                      <Icon name="plus" size={15} />
                    </button>
                  </div>
                  <p className="text-[15px] font-semibold text-wine">{formatPrice(line.price * line.qty)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="font-display text-[22px] font-semibold text-ink">Order summary</h2>

            {toFreeShipping > 0 && (
              <div className="mt-4 rounded-xl bg-blush p-3.5">
                <p className="text-[13px] text-ink">
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

            <dl className="mt-5 space-y-3 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-medium text-ink">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd className="font-medium text-ink">{shipping === 0 ? 'Free' : formatPrice(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3">
                <dt className="font-medium text-ink">Total</dt>
                <dd className="font-display text-[22px] font-semibold text-wine">{formatPrice(total)}</dd>
              </div>
            </dl>

            <Link to="/checkout" className="btn-primary mt-6 w-full">
              Checkout
              <Icon name="arrowRight" size={16} />
            </Link>
            <Link to="/new-arrivals" className="btn-quiet mt-2 w-full">Continue shopping</Link>
          </div>
        </aside>
      </div>
    </div>
  )
}

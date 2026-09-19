import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { Badge, EmptyState, PageHeading } from '../components/ui'
import useAsync from '../hooks/useAsync'
import { createOrder, listAddresses } from '../lib/api'
import { formatPrice } from '../lib/format'
import { useStore } from '../context/StoreContext'

export default function Checkout() {
  const { cart, subtotal, shipping, total, clearCart, toast, shippingRules, belowMinimum } = useStore()
  const navigate = useNavigate()

  const { data: addresses, loading } = useAsync(listAddresses, [])
  const [addressId, setAddressId] = useState(null)
  const [discountCode, setDiscountCode] = useState('')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState(null)

  const selectedAddress = addressId ?? addresses?.find((a) => a.isDefault)?.id ?? addresses?.[0]?.id

  if (cart.length === 0 && !placing) {
    return (
      <div className="container-e py-12">
        <PageHeading eyebrow="Checkout" title="Checkout" />
        <div className="mt-8">
          <EmptyState
            icon="bag"
            title="Nothing to check out"
            body="Add a set or a shade to your bag first."
            action={<Link to="/new-arrivals" className="btn-primary">Shop new arrivals</Link>}
          />
        </div>
      </div>
    )
  }

  const placeOrder = async (e) => {
    e.preventDefault()
    setError(null)

    if (belowMinimum) {
      setError(`Orders start at ${formatPrice(shippingRules.minimumOrder)}. Add a little more to your bag.`)
      return
    }
    if (!selectedAddress) {
      setError('Add a delivery address before checking out.')
      return
    }

    setPlacing(true)
    try {
      const order = await createOrder({
        items: cart,
        addressId: selectedAddress,
        discountCode: discountCode.trim() || null,
      })
      clearCart()
      toast(`Order ${order.id} placed`)
      navigate('/account/orders')
    } catch (err) {
      setError(err.message ?? 'Could not place the order — please try again')
      setPlacing(false)
    }
  }

  return (
    <div className="container-e py-12">
      <PageHeading eyebrow="Almost there" title="Checkout" subtitle="Confirm where it goes and place the order." />

      <form onSubmit={placeOrder} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {error && (
            <p className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-800">
              <Icon name="info" size={15} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}

          <section className="card p-6">
            <h2 className="font-display text-[20px] font-semibold text-ink">Delivery address</h2>

            {loading ? (
              <p className="mt-4 text-sm text-muted">Loading your addresses…</p>
            ) : addresses.length === 0 ? (
              <div className="mt-4">
                <p className="text-sm text-muted">No addresses saved yet.</p>
                <Link to="/account/addresses" className="btn-primary mt-4">
                  <Icon name="plus" size={16} />
                  Add an address
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-4 space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={[
                        'flex cursor-pointer gap-3 rounded-xl border p-4 transition',
                        selectedAddress === address.id ? 'border-wine bg-wine-50' : 'border-line hover:border-wine-200',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddress === address.id}
                        onChange={() => setAddressId(address.id)}
                        className="mt-1 accent-[#E01B6A]"
                      />
                      <span className="text-[14px] leading-relaxed">
                        <span className="flex items-center gap-2 font-medium text-ink">
                          {address.label}
                          {address.isDefault && <Badge>Default</Badge>}
                        </span>
                        <span className="mt-1 block text-muted">
                          {address.name}, {address.line1}
                          {address.line2 ? `, ${address.line2}` : ''}, {address.city} {address.postcode}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
                <Link to="/account/addresses" className="btn-ghost mt-4">
                  <Icon name="plus" size={16} />
                  Manage addresses
                </Link>
              </>
            )}
          </section>

          <section className="card p-6">
            <h2 className="font-display text-[20px] font-semibold text-ink">Discount code</h2>
            <label className="mt-4 block">
              <input
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                className="field uppercase"
                placeholder="Have a code?"
              />
            </label>
            <p className="mt-2 text-[12px] text-muted">
              Checked when the order is placed; the total below updates once it goes through.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="font-display text-[20px] font-semibold text-ink">Payment</h2>
            <p className="mt-3 flex items-start gap-2 text-[13px] leading-relaxed text-muted">
              <Icon name="info" size={15} className="mt-0.5 shrink-0" />
              Cash on delivery. No card details are collected anywhere on this site.
            </p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="font-display text-[20px] font-semibold text-ink">Your order</h2>

            <ul className="mt-4 space-y-3">
              {cart.map((line) => (
                <li key={line.id} className="flex items-center gap-3">
                  <img src={line.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1 text-[13px]">
                    <span className="block truncate text-ink">{line.name}</span>
                    <span className="text-muted">Qty {line.qty}</span>
                  </span>
                  <span className="text-[13px] font-medium text-ink">{formatPrice(line.price * line.qty)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-3 border-t border-line pt-4 text-[14px]">
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

            {belowMinimum && (
              <p className="mt-4 rounded-xl bg-blush px-3.5 py-2.5 text-[13px] text-ink">
                Orders start at {formatPrice(shippingRules.minimumOrder)}.
              </p>
            )}

            <button
              type="submit"
              disabled={placing || belowMinimum || !selectedAddress}
              className="btn-primary mt-6 w-full"
            >
              {placing ? 'Placing order…' : 'Place order'}
              {!placing && <Icon name="arrowRight" size={16} />}
            </button>
          </div>
        </aside>
      </form>
    </div>
  )
}

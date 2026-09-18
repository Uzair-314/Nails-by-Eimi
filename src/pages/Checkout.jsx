import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { Badge, EmptyState, PageHeading } from '../components/ui'
import useAsync from '../hooks/useAsync'
import { createOrder, listAddresses, listCards } from '../lib/api'
import { formatPrice, pointsFor } from '../lib/format'
import { useStore } from '../context/StoreContext'

export default function Checkout() {
  const { cart, subtotal, shipping, total, clearCart, toast } = useStore()
  const navigate = useNavigate()

  const { data: addresses } = useAsync(listAddresses, [])
  const { data: cards } = useAsync(listCards, [])

  const [addressId, setAddressId] = useState(null)
  const [cardId, setCardId] = useState(null)
  const [placing, setPlacing] = useState(false)

  const selectedAddress = addressId ?? addresses?.find((a) => a.isDefault)?.id ?? addresses?.[0]?.id
  const selectedCard = cardId ?? cards?.find((c) => c.isDefault)?.id ?? cards?.[0]?.id

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
    setPlacing(true)
    try {
      const order = await createOrder({
        items: cart,
        total,
        addressId: selectedAddress,
      })
      clearCart()
      toast(`Order ${order.id} placed`)
      navigate('/account/orders')
    } catch {
      toast('Could not place the order — please try again')
      setPlacing(false)
    }
  }

  return (
    <div className="container-e py-12">
      <PageHeading eyebrow="Almost there" title="Checkout" subtitle="Confirm where it goes and how you are paying." />

      <form onSubmit={placeOrder} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-display text-[20px] font-semibold text-ink">Delivery address</h2>
            <div className="mt-4 space-y-3">
              {addresses?.map((address) => (
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
                    className="mt-1 accent-[#8B4550]"
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
          </section>

          <section className="card p-6">
            <h2 className="font-display text-[20px] font-semibold text-ink">Payment</h2>
            <div className="mt-4 space-y-3">
              {cards?.map((card) => (
                <label
                  key={card.id}
                  className={[
                    'flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition',
                    selectedCard === card.id ? 'border-wine bg-wine-50' : 'border-line hover:border-wine-200',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="card"
                    checked={selectedCard === card.id}
                    onChange={() => setCardId(card.id)}
                    className="accent-[#8B4550]"
                  />
                  <Icon name="card" size={20} className="text-wine" />
                  <span className="flex-1 text-[14px]">
                    <span className="font-medium text-ink">{card.brand} ···· {card.last4}</span>
                    <span className="ml-2 text-muted">
                      {String(card.expMonth).padStart(2, '0')}/{String(card.expYear).slice(-2)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-muted">
              <Icon name="info" size={14} className="mt-0.5 shrink-0" />
              This is a demo checkout — no card is charged and no card details are collected.
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

            <button type="submit" disabled={placing} className="btn-primary mt-6 w-full">
              {placing ? 'Placing order…' : 'Place order'}
              {!placing && <Icon name="arrowRight" size={16} />}
            </button>
            <p className="mt-3 text-center text-[12px] text-muted">
              You will earn {pointsFor(total)} points on this order.
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}

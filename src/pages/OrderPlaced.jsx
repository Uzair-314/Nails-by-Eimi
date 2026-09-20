import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Icon from '../components/Icon'
import { formatPrice, whatsappLink } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'

/**
 * Shown straight after an order goes through.
 *
 * The order arrives in navigation state, and is also kept in localStorage so a
 * refresh still shows it — a guest has no account to look it up in, and the
 * order number is the only handle they have on it.
 */
export default function OrderPlaced() {
  const location = useLocation()
  const { isSignedIn } = useAuth()
  const { settings } = useStore()
  const [order, setOrder] = useState(location.state?.order ?? null)

  useEffect(() => {
    if (order) return
    try {
      const saved = localStorage.getItem('nbe:lastOrder')
      if (saved) setOrder(JSON.parse(saved))
    } catch { /* private mode */ }
  }, [order])

  if (!order) {
    return (
      <div className="container-e py-20 text-center">
        <h1 className="font-display text-[30px] font-semibold text-ink">No recent order to show</h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] text-muted">
          If you have just ordered, your confirmation was on the previous screen. Message us with your name
          and we will find it.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-primary">Back to the shop</Link>
          <Link to="/contact" className="btn-ghost">Contact us</Link>
        </div>
      </div>
    )
  }

  const whatsapp = whatsappLink(
    settings.contact_whatsapp,
    `Hi, I have just placed order #${order.id}.`
  )

  return (
    <div className="container-e py-12">
      <div className="mx-auto max-w-[680px]">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-wine text-white">
            <Icon name="check" size={26} />
          </span>
          <p className="eyebrow mt-5 justify-center">Order placed</p>
          <h1 className="mt-3 font-display text-[34px] font-semibold leading-tight text-ink">
            Thank you{order.contact?.name ? `, ${order.contact.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted">
            We have your order and will be in touch shortly to confirm it. Keep the order number below —
            it is how we will find your order if you get in touch.
          </p>
        </div>

        <div className="card mt-8 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Order number</p>
              <p className="font-display text-[26px] font-semibold text-wine">#{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Total to pay on delivery</p>
              <p className="font-display text-[26px] font-semibold text-ink">{formatPrice(order.total)}</p>
            </div>
          </div>

          <dl className="mt-4 space-y-3 text-[14px]">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="text-ink">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Discount</dt>
                <dd className="text-ink">−{formatPrice(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">{order.shippingMethod ?? 'Delivery'}</dt>
              <dd className="text-ink">{order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</dd>
            </div>
          </dl>

          {order.address && (
            <div className="mt-5 border-t border-line pt-4">
              <p className="text-[13px] font-medium text-ink">Delivering to</p>
              <address className="mt-1.5 text-[13px] not-italic leading-relaxed text-muted">
                {order.address.name}<br />
                {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}<br />
                {order.address.city} {order.address.postcode}
                {order.contact?.phone && <><br />{order.contact.phone}</>}
              </address>
              {order.deliveryNotes && (
                <p className="mt-2 rounded-xl bg-blush px-3.5 py-2.5 text-[13px] text-ink">
                  {order.deliveryNotes}
                </p>
              )}
            </div>
          )}

          <p className="mt-5 flex items-start gap-2 rounded-xl bg-blush px-3.5 py-3 text-[13px] leading-relaxed text-ink">
            <Icon name="clock" size={15} className="mt-0.5 shrink-0 text-wine" />
            You will be notified soon to confirm your order. Payment is cash on delivery — nothing is
            charged now.
          </p>
        </div>

        {/* Quietly offered here rather than pressed during checkout. */}
        {!isSignedIn && (
          <div className="card mt-6 flex flex-wrap items-center gap-4 p-6">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blush text-wine">
              <Icon name="user" size={20} />
            </span>
            <div className="min-w-[200px] flex-1">
              <p className="text-[15px] font-medium text-ink">Want to track this next time?</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                Create an account and your orders, addresses and bag are saved for next time. Nothing you
                just entered is lost.
              </p>
            </div>
            <Link to="/login" className="btn-primary">Create an account</Link>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-primary">Continue shopping</Link>
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost"
            >
              <Icon name="phone" size={16} />
              Message us about this order
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

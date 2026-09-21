import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { PageHeading } from '../components/ui'
import { trackOrder } from '../lib/api'
import { formatPrice, whatsappLink } from '../lib/format'
import { useStore } from '../context/StoreContext'
import { SITE } from '../data/site'

/**
 * The fallback for a customer whose browser no longer remembers the order —
 * a new phone, or cleared site data. The order number alone is not enough to
 * look one up, since the numbers run in sequence; the phone it was placed with
 * has to match too.
 */

const STEPS = ['processing', 'shipped', 'delivered']

const LABEL = {
  processing: 'Being prepared',
  shipped: 'On its way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export default function TrackOrder() {
  const { settings } = useStore()
  const [form, setForm] = useState({ orderNumber: '', phone: '' })
  const [result, setResult] = useState(null)
  const [searched, setSearched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const found = await trackOrder(form.orderNumber.trim(), form.phone.trim())
      setResult(found)
      setSearched(true)
    } catch (err) {
      // Same reasoning as the contact form: a rate limit that says nothing
      // looks broken, and the person keeps hammering it.
      setError(err?.message ?? 'Could not check that just now — please try again.')
    } finally {
      setBusy(false)
    }
  }

  const whatsapp = whatsappLink(
    settings.contact_whatsapp ?? SITE.whatsapp,
    form.orderNumber ? `Hi, I am asking about order ${form.orderNumber.trim()}.` : undefined
  )

  const reached = result ? STEPS.indexOf(result.status) : -1

  return (
    <div className="container-e py-12">
      <PageHeading
        eyebrow="Where is it?"
        title="Track your order"
        subtitle="Enter your order number and the phone number you ordered with."
      />

      <div className="mx-auto mt-10 max-w-[560px]">
        <form onSubmit={submit} className="card p-6 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Order number</span>
              <input
                required
                value={form.orderNumber}
                onChange={update('orderNumber')}
                className="field"
                placeholder="NBE-1004"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Phone number</span>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={update('phone')}
                className="field"
                placeholder="0322-4001139"
              />
            </label>
          </div>

          <button type="submit" disabled={busy} className="btn-primary mt-6 w-full sm:w-auto">
            {busy ? 'Checking…' : 'Check status'}
            {!busy && <Icon name="arrowRight" size={16} />}
          </button>

          {error && <p className="mt-4 text-[13px] text-wine">{error}</p>}
        </form>

        {searched && !result && !error && (
          <div className="card mt-6 p-6 text-center">
            <p className="text-[15px] font-medium text-ink">No order matched that</p>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
              Check the order number, and make sure the phone number is the one the order was placed
              with. If it still will not show, message us and we will find it.
            </p>
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-ghost mt-5">
                <Icon name="phone" size={16} />
                Message us
              </a>
            )}
          </div>
        )}

        {result && (
          <div className="card mt-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Order</p>
                <p className="font-display text-[24px] font-semibold text-wine">#{result.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Total</p>
                <p className="font-display text-[24px] font-semibold text-ink">{formatPrice(result.total)}</p>
              </div>
            </div>

            {result.status === 'cancelled' ? (
              <p className="mt-5 rounded-xl bg-blush px-3.5 py-3 text-[13px] leading-relaxed text-ink">
                This order was cancelled. If that is unexpected, message us and we will sort it out.
              </p>
            ) : (
              <ol className="mt-5 space-y-3">
                {STEPS.map((step, i) => {
                  const done = i <= reached
                  return (
                    <li key={step} className="flex items-center gap-3">
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                          done ? 'bg-wine text-white' : 'bg-blush text-muted'
                        }`}
                      >
                        <Icon name={done ? 'check' : 'clock'} size={14} />
                      </span>
                      <span className={`text-[14px] ${done ? 'font-medium text-ink' : 'text-muted'}`}>
                        {LABEL[step]}
                      </span>
                    </li>
                  )
                })}
              </ol>
            )}

            {result.tracking && (
              <p className="mt-5 text-[13px] text-muted">
                Tracking number <span className="font-medium text-ink">{result.tracking}</span>
              </p>
            )}

            <p className="mt-5 text-[12px] text-muted">
              Payment is cash on delivery — nothing is charged before it arrives.
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-[13px] text-muted">
          Ordered with an account? <Link to="/account/orders" className="text-wine hover:underline">See all your orders</Link>
        </p>
      </div>
    </div>
  )
}

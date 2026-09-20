import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { Badge, EmptyState, PageHeading } from '../components/ui'
import useAsync from '../hooks/useAsync'
import {
  createOrder, listAddresses, listShippingMethods, markCartConverted,
  saveAbandonedCart, shippingCostFor,
} from '../lib/api'
import { formatPrice } from '../lib/format'
import { rememberOrder } from '../lib/placedOrders'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'

const BLANK_ADDRESS = {
  line1: '', line2: '', city: '', postcode: '', country: 'Pakistan',
}

/** Pakistani mobile numbers, allowing 03xx, +923xx and spacing. */
const PHONE_OK = (v) => /^(\+?92|0)?3\d{2}[\s-]?\d{7}$/.test(v.replace(/\s|-/g, ''))
const EMAIL_OK = (v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)

/** Persistent id so a returning visitor updates their own saved basket. */
function abandonedCartId() {
  try {
    let id = localStorage.getItem('nbe:checkoutId')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('nbe:checkoutId', id)
    }
    return id
  } catch {
    return null
  }
}

function Section({ step, title, children, aside }) {
  return (
    <section className="card p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-display text-[20px] font-semibold text-ink">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-wine text-[13px] font-semibold text-white">
            {step}
          </span>
          {title}
        </h2>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink">{label}</span>
      {children}
      {error
        ? <span className="mt-1 block text-[12px] text-red-700">{error}</span>
        : hint && <span className="mt-1 block text-[12px] text-muted">{hint}</span>}
    </label>
  )
}

export default function Checkout() {
  const { cart, subtotal, clearCart, toast, shippingRules, belowMinimum } = useStore()
  const { isSignedIn, profile } = useAuth()
  const navigate = useNavigate()

  const { data: methods } = useAsync(listShippingMethods, [])
  const { data: savedAddresses } = useAsync(() => (isSignedIn ? listAddresses() : Promise.resolve([])), [isSignedIn])

  const [contact, setContact] = useState({ name: '', email: '', phone: '' })
  const [address, setAddress] = useState(BLANK_ADDRESS)
  const [savedAddressId, setSavedAddressId] = useState(null)
  const [notes, setNotes] = useState('')
  const [methodId, setMethodId] = useState(null)
  const [billingSame, setBillingSame] = useState(true)
  const [billing, setBilling] = useState(BLANK_ADDRESS)
  const [discountCode, setDiscountCode] = useState('')

  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState(null)
  const [touched, setTouched] = useState({})

  const cartId = useRef(abandonedCartId())
  const saveTimer = useRef(null)

  // Prefill from the account, without ever requiring one.
  useEffect(() => {
    if (!profile) return
    setContact((c) => ({
      name: c.name || `${profile.firstName} ${profile.lastName}`.trim(),
      email: c.email || profile.email || '',
      phone: c.phone || profile.phone || '',
    }))
  }, [profile])

  useEffect(() => {
    if (!savedAddresses?.length || savedAddressId !== null) return
    const preferred = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0]
    setSavedAddressId(preferred.id)
  }, [savedAddresses, savedAddressId])

  useEffect(() => {
    if (methods?.length && !methodId) setMethodId(methods[0].id)
  }, [methods, methodId])

  const method = methods?.find((m) => m.id === methodId) ?? null
  const shipping = shippingCostFor(method, subtotal)
  const total = subtotal + shipping

  const usingSaved = savedAddressId && savedAddresses?.some((a) => a.id === savedAddressId)
  const chosenAddress = usingSaved ? savedAddresses.find((a) => a.id === savedAddressId) : null

  const errors = useMemo(() => {
    const e = {}
    if (!contact.name.trim()) e.name = 'We need a name for the delivery'
    if (!contact.phone.trim()) e.phone = 'Required — the courier calls before arriving'
    else if (!PHONE_OK(contact.phone)) e.phone = 'That does not look like a Pakistani mobile number'
    if (!EMAIL_OK(contact.email)) e.email = 'Check that email address'

    if (!usingSaved) {
      if (!address.line1.trim()) e.line1 = 'Required'
      if (!address.city.trim()) e.city = 'Required'
    }
    if (!billingSame) {
      if (!billing.line1.trim()) e.bLine1 = 'Required'
      if (!billing.city.trim()) e.bCity = 'Required'
    }
    return e
  }, [contact, address, billing, billingSame, usingSaved])

  // Remember a half-finished checkout once there is enough to follow up on.
  useEffect(() => {
    if (!cartId.current || !cart.length) return
    if (!contact.phone.trim() && !contact.email.trim()) return

    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveAbandonedCart({
        id: cartId.current,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        items: cart,
        subtotal,
      }).catch(() => { /* never block checkout over this */ })
    }, 1200)

    return () => clearTimeout(saveTimer.current)
  }, [contact, cart, subtotal])

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

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setTouched({ name: true, phone: true, email: true, line1: true, city: true, bLine1: true, bCity: true })

    if (Object.keys(errors).length) {
      setError('Check the highlighted fields and try again.')
      return
    }
    if (belowMinimum) {
      setError(`Orders start at ${formatPrice(shippingRules.minimumOrder)}.`)
      return
    }

    setPlacing(true)
    try {
      const deliverTo = usingSaved
        ? { ...chosenAddress, name: contact.name, phone: contact.phone }
        : { ...address, name: contact.name, phone: contact.phone }

      const order = await createOrder({
        items: cart,
        address: deliverTo,
        billing: billingSame ? deliverTo : { ...billing, name: contact.name },
        contact,
        notes,
        shippingMethodId: methodId,
        discountCode: discountCode.trim() || null,
      })

      if (cartId.current) markCartConverted(cartId.current).catch(() => {})
      clearCart()

      // Kept so a refresh on the confirmation page still shows the order.
      try { localStorage.setItem('nbe:lastOrder', JSON.stringify(order)) } catch { /* private mode */ }
      // And kept longer, so this device can follow the order's progress.
      rememberOrder(order)

      navigate('/order-placed', { replace: true, state: { order } })
    } catch (err) {
      setError(err.message ?? 'Could not place the order — please try again')
      setPlacing(false)
    }
  }

  const fieldError = (key) => (touched[key] ? errors[key] : undefined)
  const markTouched = (key) => () => setTouched((t) => ({ ...t, [key]: true }))

  return (
    <div className="container-e py-12">
      <PageHeading
        eyebrow="Almost there"
        title="Checkout"
        subtitle="No account needed — just where it goes and how to reach you."
      />

      <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {error && (
            <p className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-800">
              <Icon name="info" size={15} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}

          <Section
            step="1"
            title="Contact"
            aside={!isSignedIn && (
              <Link to="/login" state={{ from: '/checkout' }} className="text-[13px] text-wine hover:underline">
                Have an account?
              </Link>
            )}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={fieldError('name')}>
                <input
                  value={contact.name}
                  onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                  onBlur={markTouched('name')}
                  className="field"
                  autoComplete="name"
                />
              </Field>

              <Field
                label="Phone"
                hint="The courier calls before delivering"
                error={fieldError('phone')}
              >
                <input
                  value={contact.phone}
                  onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                  onBlur={markTouched('phone')}
                  className="field"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="03xx xxxxxxx"
                />
              </Field>

              <Field
                label="Email (optional)"
                hint="For order updates, if you want them"
                error={fieldError('email')}
              >
                <input
                  value={contact.email}
                  onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                  onBlur={markTouched('email')}
                  className="field"
                  type="email"
                  autoComplete="email"
                />
              </Field>
            </div>
          </Section>

          <Section step="2" title="Delivery address">
            {savedAddresses?.length > 0 && (
              <div className="mb-5 space-y-2">
                {savedAddresses.map((a) => (
                  <label
                    key={a.id}
                    className={[
                      'flex cursor-pointer gap-3 rounded-xl border p-3.5 transition',
                      savedAddressId === a.id ? 'border-wine bg-wine-50' : 'border-line hover:border-wine-200',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="saved-address"
                      checked={savedAddressId === a.id}
                      onChange={() => setSavedAddressId(a.id)}
                      className="mt-0.5 accent-[#E01B6A]"
                    />
                    <span className="text-[13px] leading-relaxed">
                      <span className="flex items-center gap-2 font-medium text-ink">
                        {a.label}
                        {a.isDefault && <Badge>Default</Badge>}
                      </span>
                      <span className="mt-0.5 block text-muted">
                        {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city} {a.postcode}
                      </span>
                    </span>
                  </label>
                ))}

                <label
                  className={[
                    'flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-[13px] transition',
                    !usingSaved ? 'border-wine bg-wine-50' : 'border-line hover:border-wine-200',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="saved-address"
                    checked={!usingSaved}
                    onChange={() => setSavedAddressId('new')}
                    className="accent-[#E01B6A]"
                  />
                  <span className="font-medium text-ink">Deliver somewhere else</span>
                </label>
              </div>
            )}

            {!usingSaved && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Address" error={fieldError('line1')}>
                    <input
                      value={address.line1}
                      onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
                      onBlur={markTouched('line1')}
                      className="field"
                      placeholder="House number and street"
                      autoComplete="address-line1"
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Area or apartment (optional)">
                    <input
                      value={address.line2}
                      onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))}
                      className="field"
                      autoComplete="address-line2"
                    />
                  </Field>
                </div>
                <Field label="City" error={fieldError('city')}>
                  <input
                    value={address.city}
                    onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                    onBlur={markTouched('city')}
                    className="field"
                    autoComplete="address-level2"
                  />
                </Field>
                <Field label="Postcode (optional)">
                  <input
                    value={address.postcode}
                    onChange={(e) => setAddress((a) => ({ ...a, postcode: e.target.value }))}
                    className="field"
                    autoComplete="postal-code"
                  />
                </Field>
              </div>
            )}

            <div className="mt-4">
              <Field
                label="Delivery notes (optional)"
                hint="Landmarks, gate codes, or a time that suits you"
              >
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="field resize-none"
                  placeholder="e.g. near the pharmacy, please call before arriving"
                />
              </Field>
            </div>
          </Section>

          <Section step="3" title="Shipping method">
            {!methods ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : methods.length === 0 ? (
              <p className="text-sm text-muted">No delivery options are set up yet.</p>
            ) : (
              <div className="space-y-2">
                {methods.map((m) => {
                  const cost = shippingCostFor(m, subtotal)
                  return (
                    <label
                      key={m.id}
                      className={[
                        'flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition',
                        methodId === m.id ? 'border-wine bg-wine-50' : 'border-line hover:border-wine-200',
                      ].join(' ')}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        checked={methodId === m.id}
                        onChange={() => setMethodId(m.id)}
                        className="accent-[#E01B6A]"
                      />
                      <span className="min-w-0 flex-1 text-[14px]">
                        <span className="font-medium text-ink">{m.name}</span>
                        {m.estimate && <span className="ml-2 text-muted">{m.estimate}</span>}
                        {m.description && (
                          <span className="mt-0.5 block text-[12px] text-muted">{m.description}</span>
                        )}
                      </span>
                      <span className="text-[14px] font-semibold text-wine">
                        {cost === 0 ? 'Free' : formatPrice(cost)}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </Section>

          <Section step="4" title="Payment">
            <div className="flex items-start gap-3.5 rounded-xl bg-blush p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-wine">
                <Icon name="truck" size={18} />
              </span>
              <div>
                <p className="text-[14px] font-medium text-ink">Cash on delivery</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  Pay the courier when your parcel arrives. No card details are collected anywhere on this site.
                </p>
              </div>
            </div>
          </Section>

          <Section step="5" title="Billing address">
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3.5 text-[14px] transition hover:border-wine-200">
                <input
                  type="radio"
                  name="billing"
                  checked={billingSame}
                  onChange={() => setBillingSame(true)}
                  className="accent-[#E01B6A]"
                />
                <span className="text-ink">Same as delivery address</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3.5 text-[14px] transition hover:border-wine-200">
                <input
                  type="radio"
                  name="billing"
                  checked={!billingSame}
                  onChange={() => setBillingSame(false)}
                  className="accent-[#E01B6A]"
                />
                <span className="text-ink">Use a different address</span>
              </label>
            </div>

            {!billingSame && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Address" error={fieldError('bLine1')}>
                    <input
                      value={billing.line1}
                      onChange={(e) => setBilling((a) => ({ ...a, line1: e.target.value }))}
                      onBlur={markTouched('bLine1')}
                      className="field"
                    />
                  </Field>
                </div>
                <Field label="City" error={fieldError('bCity')}>
                  <input
                    value={billing.city}
                    onChange={(e) => setBilling((a) => ({ ...a, city: e.target.value }))}
                    onBlur={markTouched('bCity')}
                    className="field"
                  />
                </Field>
                <Field label="Postcode (optional)">
                  <input
                    value={billing.postcode}
                    onChange={(e) => setBilling((a) => ({ ...a, postcode: e.target.value }))}
                    className="field"
                  />
                </Field>
              </div>
            )}
          </Section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="font-display text-[20px] font-semibold text-ink">Order summary</h2>

            <ul className="mt-4 space-y-3">
              {cart.map((line) => (
                <li key={line.id} className="flex items-center gap-3">
                  <span className="relative shrink-0">
                    <img src={line.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-ink px-1 text-[11px] text-white">
                      {line.qty}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1 text-[13px]">
                    <span className="block truncate text-ink">{line.name}</span>
                    <span className="text-muted">{formatPrice(line.price)} each</span>
                  </span>
                  <span className="text-[13px] font-medium text-ink">{formatPrice(line.price * line.qty)}</span>
                </li>
              ))}
            </ul>

            <label className="mt-5 block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">Discount code</span>
              <input
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                className="field uppercase"
                placeholder="Have a code?"
              />
              <span className="mt-1 block text-[12px] text-muted">
                Applied when the order is placed.
              </span>
            </label>

            <dl className="mt-5 space-y-3 border-t border-line pt-4 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-medium text-ink">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{method?.name ?? 'Delivery'}</dt>
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

            <button type="submit" disabled={placing || belowMinimum} className="btn-primary mt-6 w-full">
              {placing ? 'Placing order…' : 'Place order'}
              {!placing && <Icon name="arrowRight" size={16} />}
            </button>

            <p className="mt-3 text-center text-[12px] text-muted">
              Cash on delivery · no payment taken now
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}

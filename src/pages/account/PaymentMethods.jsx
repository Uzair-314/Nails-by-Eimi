import Icon from '../../components/Icon'
import { PageHeading } from '../../components/ui'
import { formatPrice } from '../../lib/format'
import { useStore } from '../../context/StoreContext'

/**
 * There is no card vault: checkout is cash on delivery, so nothing is stored.
 * The page stays so the account menu keeps its shape and the position is
 * explained rather than silently missing.
 */
export default function PaymentMethods() {
  const { shippingRules } = useStore()

  const points = [
    {
      icon: 'truck',
      title: 'Cash on delivery',
      body: 'Pay the courier when your parcel arrives. Have the exact amount ready where you can.',
    },
    {
      icon: 'shield',
      title: 'No card details stored',
      body: 'This site never asks for a card number, so there is nothing here to manage or leak.',
    },
    {
      icon: 'tag',
      title: 'Minimum order',
      body: `Orders start at ${formatPrice(shippingRules.minimumOrder)}, with delivery free over ${formatPrice(shippingRules.freeOver)}.`,
    },
  ]

  return (
    <div>
      <PageHeading
        eyebrow="Billing"
        title="Payment"
        subtitle="How paying for an order works."
      />

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        {points.map((p) => (
          <div key={p.title} className="card p-5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-blush text-wine">
              <Icon name={p.icon} size={18} />
            </span>
            <h2 className="mt-3.5 text-[14px] font-medium text-ink">{p.title}</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="card mt-6 flex items-start gap-3.5 p-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blush text-wine">
          <Icon name="info" size={17} />
        </span>
        <p className="text-[13px] leading-relaxed text-muted">
          Card and wallet payments are not set up yet. When they are, saved methods will appear on this page.
        </p>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import Icon from '../../components/Icon'
import { Badge, EmptyState, PageHeading, Skeleton } from '../../components/ui'
import { deleteCard, listCards, setDefaultCard } from '../../lib/api'
import { useStore } from '../../context/StoreContext'

const BRAND_TINT = {
  Visa: 'from-[#2A3B7D] to-[#4457A8]',
  Mastercard: 'from-[#7A3A45] to-[#B2646E]',
  Amex: 'from-[#2E6A7A] to-[#4E97A8]',
}

export default function PaymentMethods() {
  const [cards, setCards] = useState(null)
  const { toast } = useStore()

  useEffect(() => { listCards().then(setCards) }, [])

  const makeDefault = async (card) => {
    setCards(await setDefaultCard(card.id))
    toast(`${card.brand} ···· ${card.last4} is now your default`)
  }

  const remove = async (card) => {
    setCards(await deleteCard(card.id))
    toast('Card removed')
  }

  return (
    <div>
      <PageHeading
        eyebrow="Billing"
        title="Payment Methods"
        subtitle="Cards saved for a faster checkout. Full numbers are never stored on this device."
      />

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {!cards ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-card" />)
        ) : cards.length === 0 ? (
          <div className="sm:col-span-2">
            <EmptyState icon="card" title="No cards saved" body="Cards you use at checkout will be listed here." />
          </div>
        ) : (
          cards.map((card) => (
            <article key={card.id} className="card overflow-hidden p-0">
              <div className={`bg-gradient-to-br ${BRAND_TINT[card.brand] ?? 'from-wine-700 to-wine-500'} p-5 text-white`}>
                <div className="flex items-start justify-between">
                  <Icon name="card" size={22} className="opacity-90" />
                  <span className="text-[13px] font-medium tracking-wide">{card.brand}</span>
                </div>
                <p className="mt-8 font-display text-[22px] tracking-[0.18em]">···· ···· ···· {card.last4}</p>
                <div className="mt-4 flex items-end justify-between text-[11px] uppercase tracking-[0.14em] opacity-85">
                  <span>{card.holder}</span>
                  <span>{String(card.expMonth).padStart(2, '0')}/{String(card.expYear).slice(-2)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 p-4">
                {card.isDefault ? (
                  <Badge>Default</Badge>
                ) : (
                  <button type="button" onClick={() => makeDefault(card)} className="btn-ghost !py-2 text-[13px]">
                    Set as default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(card)}
                  className="btn-quiet ml-auto !py-2 text-[13px] hover:!bg-red-50 hover:!text-red-700"
                >
                  <Icon name="trash" size={15} />
                  Remove
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="card mt-6 flex items-start gap-3.5 p-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blush text-wine">
          <Icon name="shield" size={17} />
        </span>
        <div>
          <h2 className="text-[14px] font-medium text-ink">Adding a card</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            New cards are added during checkout through the payment provider, so card numbers never touch this site.
            This demo build does not collect card details.
          </p>
        </div>
      </div>
    </div>
  )
}

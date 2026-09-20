import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import { trackOrderById } from '../lib/api'
import { forgetOrder, markStatusSeen, placedOrders } from '../lib/placedOrders'

/**
 * Tells a customer their order has moved.
 *
 * Almost nobody signs in, so there is no inbox to deliver to. Instead the
 * device that placed the order remembers the status it last showed, and this
 * says so when the shop reports a different one. Dismissing marks the new
 * status as seen rather than hiding the banner for good, so the next change
 * speaks up again.
 */

const TONE = {
  processing: { icon: 'clock', line: 'is being prepared' },
  shipped: { icon: 'truck', line: 'is on its way' },
  delivered: { icon: 'check', line: 'has been delivered' },
  cancelled: { icon: 'close', line: 'was cancelled' },
}

export default function OrderStatusBanner() {
  const [changed, setChanged] = useState([])

  const check = useCallback(async () => {
    const remembered = placedOrders()
    if (!remembered.length) return

    const found = []
    for (const saved of remembered) {
      const live = await trackOrderById(saved.id)
      // The order is gone — stop asking about it on every page load.
      if (!live) { forgetOrder(saved.id); continue }
      if (live.status !== saved.seen) found.push({ id: saved.id, ...live })
    }
    setChanged(found)
  }, [])

  useEffect(() => {
    check()
    // A parcel does not move often, so re-reading on focus is enough; a poll
    // would spend requests on a page that is usually sitting idle.
    const onFocus = () => { if (!document.hidden) check() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [check])

  if (!changed.length) return null

  const dismiss = (order) => {
    markStatusSeen(order.id, order.status)
    setChanged((list) => list.filter((o) => o.id !== order.id))
  }

  return (
    <div className="border-b border-line bg-wine-50">
      {changed.map((order) => {
        const tone = TONE[order.status] ?? { icon: 'clock', line: `is now ${order.status}` }
        return (
          <div key={order.id} className="container-e flex items-center gap-3 py-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-wine text-white">
              <Icon name={tone.icon} size={14} />
            </span>
            <p className="flex-1 text-[13px] leading-snug text-ink">
              Order <strong className="font-medium">#{order.orderNumber}</strong> {tone.line}.
              {order.tracking && <span className="text-muted"> Tracking {order.tracking}.</span>}
            </p>
            <Link to="/track" className="hidden text-[13px] text-wine hover:underline sm:block">
              Track order
            </Link>
            <button
              type="button"
              onClick={() => dismiss(order)}
              aria-label="Dismiss"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted transition hover:bg-white hover:text-ink"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

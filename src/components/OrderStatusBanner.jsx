import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import { listNotifications, markNotificationsRead, trackOrderById } from '../lib/api'
import { forgetOrder, markStatusSeen, placedOrders } from '../lib/placedOrders'
import { useAuth } from '../context/AuthContext'

/**
 * Tells a customer their order has moved.
 *
 * Two sources, because there are two kinds of customer. Almost nobody signs in,
 * and a guest has no inbox to deliver to — so the device that placed the order
 * remembers the status it last showed, and this says so when the shop reports a
 * different one. An account holder has real notification rows instead, which is
 * what carries the news to a phone that did not place the order.
 *
 * Dismissing settles that one update rather than hiding the banner for good, so
 * the next change speaks up again.
 */

const TONE = {
  processing: { icon: 'clock', line: 'is being prepared' },
  shipped: { icon: 'truck', line: 'is on its way' },
  delivered: { icon: 'check', line: 'has been delivered' },
  cancelled: { icon: 'close', line: 'was cancelled' },
}

const iconFor = (status) => TONE[status]?.icon ?? 'clock'

export default function OrderStatusBanner() {
  const { isSignedIn } = useAuth()
  const [entries, setEntries] = useState([])

  const check = useCallback(async () => {
    const found = []
    // Orders this device already speaks for, so an account holder who ordered
    // here is not told the same thing twice.
    const covered = new Set()

    for (const saved of placedOrders()) {
      let live
      try {
        live = await trackOrderById(saved.id)
      } catch {
        // Could not reach the shop. Leave the order alone and try again later:
        // a failed request is not evidence that the order has gone.
        continue
      }
      // It really is gone — stop asking about it on every page load.
      if (!live) { forgetOrder(saved.id); continue }
      covered.add(saved.id)
      if (live.status === saved.seen) continue

      const tone = TONE[live.status]
      found.push({
        key: `device:${saved.id}`,
        status: live.status,
        text: `Order #${live.orderNumber} ${tone ? tone.line : `is now ${live.status}`}.`,
        tracking: live.tracking,
        settle: () => markStatusSeen(saved.id, live.status),
      })
    }

    if (isSignedIn) {
      // Written by the database when the status changed, so the wording is the
      // same one the admin sees.
      for (const row of await listNotifications()) {
        if (covered.has(row.order_id)) continue
        found.push({
          key: `account:${row.id}`,
          status: row.status,
          text: row.message,
          settle: () => markNotificationsRead([row.id]),
        })
      }
    }

    setEntries(found)
  }, [isSignedIn])

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

  if (!entries.length) return null

  const dismiss = (entry) => {
    entry.settle()
    setEntries((list) => list.filter((e) => e.key !== entry.key))
  }

  return (
    <div className="border-b border-line bg-wine-50">
      {entries.map((entry) => (
        <div key={entry.key} className="container-e flex items-center gap-3 py-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-wine text-white">
            <Icon name={iconFor(entry.status)} size={14} />
          </span>
          <p className="flex-1 text-[13px] leading-snug text-ink">
            {entry.text}
            {entry.tracking && <span className="text-muted"> Tracking {entry.tracking}.</span>}
          </p>
          <Link to="/track" className="hidden text-[13px] text-wine hover:underline sm:block">
            Track order
          </Link>
          <button
            type="button"
            onClick={() => dismiss(entry)}
            aria-label="Dismiss"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted transition hover:bg-white hover:text-ink"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

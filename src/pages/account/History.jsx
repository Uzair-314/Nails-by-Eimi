import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import { Badge, EmptyState, PageHeading, Skeleton } from '../../components/ui'
import useAsync from '../../hooks/useAsync'
import { listMyActivity } from '../../lib/api'
import { formatPoints, formatPrice } from '../../lib/format'

const KIND = {
  order:    { icon: 'truck', tone: 'rose' },
  points:   { icon: 'plus', tone: 'sage' },
  redeemed: { icon: 'gift', tone: 'lilac' },
}

const STATUS_TONE = { processing: 'rose', shipped: 'lilac', delivered: 'sage', cancelled: 'neutral' }

const stamp = (iso) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))

/** Groups entries under a date heading so the feed reads as a timeline. */
function groupByDay(entries) {
  const groups = []
  for (const entry of entries) {
    const day = stamp(entry.at)
    const last = groups[groups.length - 1]
    if (last && last.day === day) last.entries.push(entry)
    else groups.push({ day, entries: [entry] })
  }
  return groups
}

export default function History() {
  const { data, loading } = useAsync(listMyActivity, [])

  return (
    <div>
      <PageHeading
        eyebrow="Your record"
        title="History"
        subtitle="Everything that has happened on your account, newest first."
      />

      <div className="mt-7">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-card" />)}
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            icon="clock"
            title="Nothing here yet"
            body="Once you place an order or earn points, it will all show up here."
            action={<Link to="/new-arrivals" className="btn-primary">Start shopping</Link>}
          />
        ) : (
          <div className="space-y-7">
            {groupByDay(data).map((group) => (
              <section key={group.day}>
                <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-rose">{group.day}</h2>

                <ul className="mt-3 space-y-3">
                  {group.entries.map((entry) => {
                    const kind = KIND[entry.kind] ?? KIND.points
                    return (
                      <li key={entry.id}>
                        <Link
                          to={entry.link}
                          className="card flex flex-wrap items-center gap-4 p-4 transition hover:shadow-lift"
                        >
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blush text-wine">
                            <Icon name={kind.icon} size={18} />
                          </span>

                          <div className="min-w-[160px] flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-[15px] font-medium text-ink">{entry.title}</h3>
                              {entry.status && (
                                <Badge tone={STATUS_TONE[entry.status]} dot>{entry.status}</Badge>
                              )}
                            </div>
                            <p className="mt-0.5 text-[12px] text-muted">{entry.detail}</p>
                          </div>

                          {entry.amount != null && (
                            <p className="text-[15px] font-semibold text-wine">{formatPrice(entry.amount)}</p>
                          )}

                          {entry.points != null && (
                            <p className={`text-[14px] font-medium tabular-nums ${entry.points < 0 ? 'text-muted' : 'text-wine'}`}>
                              {entry.points > 0 ? '+' : ''}{formatPoints(entry.points)} pts
                            </p>
                          )}

                          <Icon name="chevronRight" size={16} className="shrink-0 text-muted" />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

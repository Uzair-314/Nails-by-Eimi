import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import { Badge, PageHeading, Skeleton } from '../../components/ui'
import useAsync from '../../hooks/useAsync'
import { getUser, listOrders, listProducts } from '../../lib/api'
import { formatDate, formatPrice, formatPoints } from '../../lib/format'
import { useStore } from '../../context/StoreContext'

const STATUS_TONE = { processing: 'rose', shipped: 'lilac', delivered: 'sage' }

export default function DashboardHome() {
  const { data: user, loading: userLoading } = useAsync(getUser, [])
  const { data: orders, loading: ordersLoading } = useAsync(listOrders, [])
  const { data: picks, loading: picksLoading } = useAsync(() => listProducts({ sort: 'featured', limit: 3 }), [])
  const { wishlist } = useStore()

  const active = orders?.filter((o) => o.status !== 'delivered').length ?? 0
  const latest = orders?.[0]

  const stats = [
    { icon: 'truck', label: 'Active orders', value: `${active}`, pending: ordersLoading },
    { icon: 'bag', label: 'Total ordered', value: `${orders?.length ?? 0} sets`, pending: ordersLoading },
    { icon: 'heart', label: 'Wishlist', value: `${wishlist.length} saved`, pending: false },
    { icon: 'gift', label: 'Points balance', value: formatPoints(user?.points ?? 0), pending: userLoading },
  ]

  return (
    <div>
      <PageHeading
        eyebrow="Eimi member dashboard"
        title={userLoading || !user ? 'Welcome back' : `Welcome back, ${user.firstName}`}
        subtitle="Your orders, points and saved pieces, all in one place."
      />

      <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-blush text-wine">
              <Icon name={stat.icon} size={17} />
            </span>
            <p className="mt-3 text-[11px] uppercase tracking-[0.12em] text-muted">{stat.label}</p>
            {stat.pending ? (
              <Skeleton className="mt-2 h-[22px] w-20" />
            ) : (
              <p className="mt-0.5 font-display text-[22px] font-semibold text-ink">{stat.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-[20px] font-semibold text-ink">Latest order</h2>
            <Link to="/account/orders" className="text-[13px] text-wine transition hover:underline">All orders</Link>
          </div>

          {!orders ? (
            <Skeleton className="mt-4 h-24 w-full" />
          ) : !latest ? (
            <p className="mt-4 text-sm text-muted">No orders yet — your first one will appear here.</p>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-[15px] font-medium text-ink">#{latest.id}</p>
                <Badge tone={STATUS_TONE[latest.status]} dot>
                  {latest.status[0].toUpperCase() + latest.status.slice(1)}
                </Badge>
                <p className="text-[13px] text-muted">
                  {formatDate(latest.placedAt)} · {formatPrice(latest.total)}
                </p>
              </div>

              <ul className="mt-4 space-y-3">
                {latest.items.map((item) => (
                  <li key={item.productSlug} className="flex items-center gap-3">
                    <img src={item.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                    <span className="min-w-0 flex-1 text-[13px]">
                      <Link to={`/product/${item.productSlug}`} className="block truncate text-ink hover:text-wine">
                        {item.name}
                      </Link>
                      <span className="text-muted">Qty {item.qty}</span>
                    </span>
                    <span className="text-[13px] font-medium text-ink">{formatPrice(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>

              {latest.tracking && (
                <p className="mt-4 flex items-center gap-2 rounded-xl bg-blush px-3.5 py-2.5 text-[13px] text-ink">
                  <Icon name="truck" size={16} className="text-wine" />
                  Tracking <strong className="font-medium">{latest.tracking}</strong>
                </p>
              )}
            </>
          )}
        </section>

        <section className="card p-6">
          <h2 className="font-display text-[20px] font-semibold text-ink">Eimi Club</h2>
          {userLoading || !user ? (
            <Skeleton className="mt-4 h-24 w-full" />
          ) : (
            <>
              <p className="mt-1 text-[13px] text-muted">{user.tier} · member since {user.memberSince}</p>
              <p className="mt-5 font-display text-[36px] font-semibold leading-none text-wine">
                {formatPoints(user.points)}
              </p>
              <p className="text-[12px] text-muted">points available</p>

              <div className="mt-5">
                <div className="flex justify-between text-[12px] text-muted">
                  <span>{user.tier}</span>
                  <span>{user.nextTier}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-blush">
                  <div
                    className="h-full rounded-full bg-wine transition-all duration-700"
                    style={{ width: `${(user.points / (user.points + user.pointsToNextTier)) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-[12px] text-muted">
                  {formatPoints(user.pointsToNextTier)} points to {user.nextTier}.
                </p>
              </div>

              <Link to="/account/rewards" className="btn-primary mt-5 w-full">
                Redeem points
                <Icon name="arrowRight" size={16} />
              </Link>
            </>
          )}
        </section>
      </div>

      <section className="mt-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-display text-[20px] font-semibold text-ink">Picked for you</h2>
          <Link to="/new-arrivals" className="text-[13px] text-wine transition hover:underline">Shop new in</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {picksLoading && !picks?.length
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card overflow-hidden p-0">
                  <Skeleton className="aspect-[4/3] w-full rounded-none" />
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))
            : (picks ?? []).map((product) => (
            <Link key={product.id} to={`/product/${product.slug}`} className="card group overflow-hidden transition hover:shadow-lift">
              <img
                src={product.image}
                alt={product.name}
                className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="p-4">
                <p className="truncate text-[14px] font-medium text-ink group-hover:text-wine">{product.name}</p>
                <p className="mt-1 text-[14px] font-semibold text-wine">{formatPrice(product.price)}</p>
              </div>
            </Link>
              ))}
        </div>
      </section>
    </div>
  )
}

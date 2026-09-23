import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import { Badge, EmptyState, PageHeading, Skeleton } from '../../components/ui'
import useAsync from '../../hooks/useAsync'
import { getProduct, listOrders } from '../../lib/api'
import { formatDate, formatPrice } from '../../lib/format'
import { useStore } from '../../context/StoreContext'

const STATUS_TONE = { processing: 'rose', shipped: 'lilac', delivered: 'sage' }
const FILTERS = ['all', 'processing', 'shipped', 'delivered']

export default function MyOrders() {
  const { data: orders, loading } = useAsync(listOrders, [])
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)
  const { addToCart, toast } = useStore()

  const visible = (orders ?? []).filter((o) => filter === 'all' || o.status === filter)
  const countFor = (status) =>
    status === 'all' ? orders?.length ?? 0 : orders?.filter((o) => o.status === status).length ?? 0

  const reorder = async (order) => {
    // `found` is index-aligned with `order.items` — a piece that no longer
    // exists comes back null and keeps its slot. Pair the quantity to the
    // product *before* dropping those slots: filtering first and then reading
    // `order.items[i]` shifted every quantity after the first missing piece
    // onto the wrong product.
    const found = await Promise.all(order.items.map((item) => getProduct(item.productSlug)))
    const lines = found
      .map((product, i) => (product ? { product, qty: order.items[i].qty } : null))
      .filter(Boolean)

    if (lines.length === 0) {
      toast('Those pieces are no longer available')
      return
    }

    lines.forEach(({ product, qty }) => addToCart(product, qty))

    // Say what could not be brought back, rather than quietly returning a
    // smaller bag than the order being reordered.
    const missing = order.items.length - lines.length
    if (missing > 0) {
      toast(`${missing} ${missing === 1 ? 'piece is' : 'pieces are'} no longer available`)
    }
  }

  const active = orders?.filter((o) => o.status !== 'delivered').length ?? 0
  const totalSets = orders?.reduce((n, o) => n + o.items.reduce((m, it) => m + it.qty, 0), 0) ?? 0

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <PageHeading
          eyebrow="My collection"
          title="Order History & Tracking"
          subtitle="Monitor your press-on shipments, review past sets, and quickly reorder favourites."
        />
        <div className="flex gap-3">
          <div className="card flex items-center gap-3 px-4 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-blush text-wine">
              <Icon name="truck" size={17} />
            </span>
            <span className="text-[13px] leading-tight">
              <span className="block text-muted">Active orders</span>
              {loading ? (
                <Skeleton className="mt-1 h-3 w-14" />
              ) : (
                <span className="font-medium text-ink">{active} {active === 1 ? 'set' : 'sets'}</span>
              )}
            </span>
          </div>
          <div className="card hidden items-center gap-3 px-4 py-3 sm:flex">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-blush text-wine">
              <Icon name="gift" size={17} />
            </span>
            <span className="text-[13px] leading-tight">
              <span className="block text-muted">Total ordered</span>
              {loading ? (
                <Skeleton className="mt-1 h-3 w-14" />
              ) : (
                <span className="font-medium text-ink">{totalSets} sets</span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-7 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`pill ${filter === status ? 'pill-active' : ''}`}
          >
            {status === 'all' ? 'All Orders' : status[0].toUpperCase() + status.slice(1)}
            {loading ? '' : ` (${countFor(status)})`}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-card" />)
        ) : visible.length === 0 ? (
          <EmptyState
            icon="bag"
            title="No orders here"
            body={filter === 'all' ? 'Your orders will appear here once you place one.' : `Nothing is ${filter} right now.`}
            action={<Link to="/new-arrivals" className="btn-primary">Shop new arrivals</Link>}
          />
        ) : (
          visible.map((order) => {
            const open = expanded === order.id
            return (
              <article key={order.id} className="card p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-4">
                  <img
                    src={order.items[0].image}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-[15px] font-medium text-ink">#{order.id}</h2>
                      <Badge tone={STATUS_TONE[order.status]} dot>
                        {order.status[0].toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[13px] text-muted">
                      Placed on {formatDate(order.placedAt)} · {order.items.length} {order.items.length === 1 ? 'item' : 'items'} · {formatPrice(order.total)}
                    </p>
                  </div>

                  <div className="flex w-full gap-2 sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : order.id)}
                      aria-expanded={open}
                      className="btn-ghost flex-1 sm:flex-none"
                    >
                      View Details
                      <Icon name="chevronDown" size={15} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
                    </button>
                    <button type="button" onClick={() => reorder(order)} className="btn-primary flex-1 sm:flex-none">
                      Reorder Set
                    </button>
                  </div>
                </div>

                <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="mt-4 border-t border-line pt-4">
                      <ul className="space-y-3">
                        {order.items.map((item) => (
                          <li key={item.productSlug} className="flex items-center gap-3">
                            <img src={item.image} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                            <span className="min-w-0 flex-1 text-[13px]">
                              <Link to={`/product/${item.productSlug}`} className="block truncate text-ink hover:text-wine">
                                {item.name}
                              </Link>
                              <span className="text-muted">Qty {item.qty} · {formatPrice(item.price)} each</span>
                            </span>
                            <span className="text-[13px] font-medium text-ink">{formatPrice(item.price * item.qty)}</span>
                          </li>
                        ))}
                      </ul>

                      <p className="mt-4 flex items-center gap-2 rounded-xl bg-blush px-3.5 py-2.5 text-[13px] text-ink">
                        <Icon name={order.tracking ? 'truck' : 'clock'} size={16} className="text-wine" />
                        {order.tracking
                          ? <>Tracking <strong className="font-medium">{order.tracking}</strong></>
                          : 'Being prepared — tracking follows on dispatch.'}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}

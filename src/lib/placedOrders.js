/**
 * Order handles kept on the device that placed them.
 *
 * A guest has no account to look an order up in, so the browser is the only
 * thing that remembers it. The uuid is the handle — `track_order_by_id` accepts
 * nothing else, since order numbers run in sequence and would be guessable.
 *
 * `seen` is the status the customer was last shown, which is how a change gets
 * noticed without anywhere to deliver a message to.
 */

const KEY = 'nbe:orders'
const LIMIT = 5

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function write(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, LIMIT))) } catch { /* private mode */ }
}

export const placedOrders = read

/**
 * Newest first, and capped — an old order is not worth chasing on a banner.
 *
 * Note the mapping: an order carries its *number* as `id`, because that is what
 * a customer quotes, and its uuid as `uuid`. The uuid is what gets stored, since
 * `track_order_by_id` deliberately accepts nothing else.
 */
export function rememberOrder(order) {
  const id = order?.uuid
  if (!id) return
  const rest = read().filter((o) => o.id !== id)
  write([{ id, orderNumber: order.id, seen: order.status }, ...rest])
}

export function markStatusSeen(id, status) {
  write(read().map((o) => (o.id === id ? { ...o, seen: status } : o)))
}

export function forgetOrder(id) {
  write(read().filter((o) => o.id !== id))
}

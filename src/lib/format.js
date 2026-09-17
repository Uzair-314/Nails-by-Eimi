/** Currency and date helpers. Change CURRENCY in one place to re-denominate the store. */

export const CURRENCY = { code: 'GBP', locale: 'en-GB' }

const money = new Intl.NumberFormat(CURRENCY.locale, {
  style: 'currency',
  currency: CURRENCY.code,
  minimumFractionDigits: 2,
})

export const formatPrice = (value) => money.format(value ?? 0)

const shortDate = new Intl.DateTimeFormat(CURRENCY.locale, { day: 'numeric', month: 'short', year: 'numeric' })

export const formatDate = (iso) => (iso ? shortDate.format(new Date(iso)) : '')

export const formatPoints = (n) => new Intl.NumberFormat(CURRENCY.locale).format(n ?? 0)

/** "1,240 pts" style label used across the loyalty screens. */
export const pts = (n) => `${formatPoints(n)} pts`

export const titleCase = (s) =>
  s.replace(/(^|[\s-])\w/g, (m) => m.toUpperCase()).replace(/-/g, ' ')

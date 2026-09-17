import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { searchSuggestions } from '../lib/api'
import { formatPrice } from '../lib/format'

const QUICK_LINKS = ['Press-on sets', 'Gel polish', 'Chrome powder', 'Builder gel', 'Rings', 'LED lamp']

/** Type-ahead search sheet opened from the header magnifier. */
export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const focus = setTimeout(() => inputRef.current?.focus(), 120)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
      clearTimeout(focus)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) { setQuery(''); setResults([]) }
  }, [open])

  // Debounced so we aren't querying on every keystroke once this hits a real backend.
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    let live = true
    const t = setTimeout(() => {
      searchSuggestions(query).then((r) => { if (live) setResults(r) })
    }, 180)
    return () => { live = false; clearTimeout(t) }
  }, [query])

  const submit = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    onClose()
  }

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={[
          'fixed inset-0 z-50 bg-ink/30 backdrop-blur-[2px] transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
        className={[
          'fixed inset-x-0 top-0 z-50 bg-canvas shadow-drawer transition-transform duration-300',
          'ease-[cubic-bezier(.22,1,.36,1)]',
          open ? 'translate-y-0' : '-translate-y-full',
        ].join(' ')}
      >
        <div className="container-e py-5">
          <form onSubmit={submit} className="flex items-center gap-3">
            <div className="relative flex-1">
              <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="search"
                placeholder="Search press-ons, gel polish, supplies…"
                aria-label="Search"
                className="w-full rounded-full border border-line bg-white py-3.5 pl-11 pr-4 text-[15px]
                           text-ink placeholder:text-muted/70 focus:border-wine-200"
              />
            </div>
            <button type="button" onClick={onClose} className="btn-quiet shrink-0" aria-label="Close search">
              <Icon name="close" size={20} />
            </button>
          </form>

          <div className="mt-5 max-h-[60vh] overflow-y-auto">
            {!query.trim() ? (
              <>
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-rose">Popular searches</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {QUICK_LINKS.map((term) => (
                    <button key={term} type="button" onClick={() => setQuery(term)} className="pill">
                      {term}
                    </button>
                  ))}
                </div>
              </>
            ) : results.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
                No matches for “{query}”. Try a colour, finish or product type.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {results.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={`/product/${item.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-blush"
                    >
                      <img src={item.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] text-ink">{item.name}</span>
                        <span className="block text-[12px] text-muted">{formatPrice(item.price)}</span>
                      </span>
                      <Icon name="chevronRight" size={16} className="shrink-0 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

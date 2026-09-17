import { useState } from 'react'
import ProductCard from './ProductCard'
import Icon from './Icon'
import { EmptyState, PageHeading, ProductGridSkeleton } from './ui'
import useAsync from '../hooks/useAsync'
import { listProducts } from '../lib/api'

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
]

/**
 * Shared catalogue view. Category, New Arrivals, Gel Nails and Search all render
 * through this so filtering and sorting behave identically everywhere.
 */
export default function ProductListing({
  eyebrow, title, subtitle, category, search, defaultSort = 'featured', filters = [], emptyBody,
}) {
  const [sort, setSort] = useState(defaultSort)
  const [activeFilter, setActiveFilter] = useState(null)

  const { data, loading } = useAsync(
    () => listProducts({ category, search, sort, tags: activeFilter ? [activeFilter] : undefined }),
    [category, search, sort, activeFilter]
  )

  const count = data?.length ?? 0

  return (
    <div className="container-e py-10">
      <PageHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {filters.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setActiveFilter(null)}
                className={`pill ${activeFilter === null ? 'pill-active' : ''}`}
              >
                All
              </button>
              {filters.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setActiveFilter(f.value)}
                  className={`pill ${activeFilter === f.value ? 'pill-active' : ''}`}
                >
                  {f.label}
                </button>
              ))}
            </>
          )}
        </div>

        <label className="flex shrink-0 items-center gap-2 text-sm text-muted">
          <Icon name="sliders" size={16} />
          <span className="sr-only sm:not-sr-only">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-full border border-line bg-white px-3.5 py-2 text-sm text-ink focus:border-wine-200"
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
      </div>

      <p className="mt-4 text-[13px] text-muted">
        {loading ? 'Loading…' : `${count} ${count === 1 ? 'product' : 'products'}`}
      </p>

      <div className="mt-5">
        {loading ? (
          <ProductGridSkeleton />
        ) : count === 0 ? (
          <EmptyState
            icon="search"
            title="Nothing here yet"
            body={emptyBody ?? 'Try a different filter, or browse another category from the menu.'}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {data.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductListing from '../components/ProductListing'
import Icon from '../components/Icon'

export default function Search() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [draft, setDraft] = useState(q)

  useEffect(() => { setDraft(q) }, [q])

  const submit = (e) => {
    e.preventDefault()
    const value = draft.trim()
    setParams(value ? { q: value } : {}, { replace: true })
  }

  return (
    <>
      <div className="container-e pt-10">
        <form onSubmit={submit} className="relative">
          <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            type="search"
            placeholder="Search press-ons, gel polish, supplies…"
            aria-label="Search products"
            className="w-full rounded-full border border-line bg-white py-3.5 pl-11 pr-28 text-[15px]
                       text-ink placeholder:text-muted/70 focus:border-wine-200"
          />
          <button type="submit" className="btn-primary absolute right-1.5 top-1/2 -translate-y-1/2 !py-2">
            Search
          </button>
        </form>
      </div>

      <ProductListing
        key={q}
        eyebrow={q ? 'Results' : 'Catalogue'}
        title={q ? `“${q}”` : 'Search'}
        subtitle={q ? undefined : 'Search the full catalogue, or browse everything below.'}
        search={q || undefined}
        emptyBody={`No products match “${q}”. Try a colour, finish or product type.`}
      />
    </>
  )
}

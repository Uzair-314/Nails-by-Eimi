import { Link, useParams } from 'react-router-dom'
import ProductListing from '../components/ProductListing'
import Icon from '../components/Icon'
import { useStore } from '../context/StoreContext'

/** Handles both `/category/jewellery` and `/category/jewellery/rings`. */
export default function Category() {
  const { '*': rest } = useParams()
  const slug = rest ?? ''
  const { categories } = useStore()

  const category = categories.find((c) => c.slug === slug)

  // Categories arrive asynchronously; don't call it missing until they land.
  if (!category) {
    if (categories.length === 0) {
      return <div className="container-e py-24 text-center text-sm text-muted">Loading…</div>
    }
    return (
      <div className="container-e py-20 text-center">
        <h1 className="font-display text-[32px] font-semibold text-ink">Category not found</h1>
        <p className="mt-2 text-muted">That category does not exist — try one from the menu.</p>
        <Link to="/" className="btn-primary mx-auto mt-6">Back to home</Link>
      </div>
    )
  }

  const parent = category.parent_id ? categories.find((c) => c.id === category.parent_id) : null
  const siblings = categories.filter((c) => c.parent_id === (parent?.id ?? category.id))

  return (
    <>
      {(parent || siblings.length > 0) && (
        <div className="container-e pt-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-muted">
            <Link to="/" className="transition hover:text-wine">Home</Link>
            <Icon name="chevronRight" size={13} />
            {parent && (
              <>
                <Link to={`/category/${parent.slug}`} className="transition hover:text-wine">{parent.name}</Link>
                <Icon name="chevronRight" size={13} />
              </>
            )}
            <span className="text-ink">{category.name}</span>
          </nav>

          {siblings.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {(() => {
                const top = parent ?? category
                return (
                  <Link to={`/category/${top.slug}`} className={`pill ${slug === top.slug ? 'pill-active' : ''}`}>
                    All {top.name}
                  </Link>
                )
              })()}
              {siblings.map((child) => (
                <Link
                  key={child.id}
                  to={`/category/${child.slug}`}
                  className={`pill ${slug === child.slug ? 'pill-active' : ''}`}
                >
                  {child.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <ProductListing
        key={slug}
        eyebrow="Category"
        title={category.name}
        subtitle={category.blurb}
        category={slug}
        emptyBody="Nothing in this category yet — new stock lands most Fridays."
      />
    </>
  )
}

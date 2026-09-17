import { Link, useParams } from 'react-router-dom'
import ProductListing from '../components/ProductListing'
import Icon from '../components/Icon'
import { CATEGORY_BLURBS, CATEGORY_LINKS, CATEGORY_NAMES } from '../data/navigation'

/** Handles both `/category/jewellery` and `/category/jewellery/rings`. */
export default function Category() {
  const { '*': rest } = useParams()
  const slug = rest ?? ''
  const name = CATEGORY_NAMES[slug]

  if (!name) {
    return (
      <div className="container-e py-20 text-center">
        <h1 className="font-display text-[32px] font-semibold text-ink">Category not found</h1>
        <p className="mt-2 text-muted">That category does not exist — try one from the menu.</p>
        <Link to="/" className="btn-primary mt-6">Back to home</Link>
      </div>
    )
  }

  const parentSlug = slug.includes('/') ? slug.split('/')[0] : null
  const parent = CATEGORY_LINKS.find((c) => c.slug === (parentSlug ?? slug))
  const siblings = parent?.children ?? []

  return (
    <>
      {(parentSlug || siblings.length > 0) && (
        <div className="container-e pt-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-muted">
            <Link to="/" className="transition hover:text-wine">Home</Link>
            <Icon name="chevronRight" size={13} />
            {parentSlug ? (
              <>
                <Link to={`/category/${parentSlug}`} className="transition hover:text-wine">
                  {CATEGORY_NAMES[parentSlug]}
                </Link>
                <Icon name="chevronRight" size={13} />
              </>
            ) : null}
            <span className="text-ink">{name}</span>
          </nav>

          {siblings.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              <Link to={`/category/${parent.slug}`} className={`pill ${slug === parent.slug ? 'pill-active' : ''}`}>
                All {parent.label}
              </Link>
              {siblings.map((child) => (
                <Link
                  key={child.slug}
                  to={`/category/${child.slug}`}
                  className={`pill ${slug === child.slug ? 'pill-active' : ''}`}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <ProductListing
        key={slug}
        eyebrow="Category"
        title={name}
        subtitle={CATEGORY_BLURBS[slug]}
        category={slug}
        emptyBody="Nothing in this category yet — new stock lands most Fridays."
      />
    </>
  )
}

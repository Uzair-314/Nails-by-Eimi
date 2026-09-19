import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import ProductCard from '../components/ProductCard'
import { Badge, Rating, Skeleton } from '../components/ui'
import useAsync from '../hooks/useAsync'
import { getProduct, listRelated } from '../lib/api'
import { formatPrice, pointsFor } from '../lib/format'
import { useStore } from '../context/StoreContext'

export default function ProductDetail() {
  const { slug } = useParams()
  const { data: product, loading } = useAsync(() => getProduct(slug), [slug])
  const { addToCart, toggleWishlist, inWishlist } = useStore()
  const [qty, setQty] = useState(1)

  const { data: related } = useAsync(
    () => (product ? listRelated(product) : Promise.resolve([])),
    [product?.id]
  )

  if (loading) {
    return (
      <div className="container-e grid gap-10 py-10 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-[20px]" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container-e py-20 text-center">
        <h1 className="font-display text-[32px] font-semibold text-ink">Product not found</h1>
        <p className="mt-2 text-muted">This piece may have sold out or been retired.</p>
        <Link to="/" className="btn-primary mt-6">Back to home</Link>
      </div>
    )
  }

  const saved = inWishlist(product.id)
  const soldOut = product.stock === 0
  const lowStock = !soldOut && product.stock <= 10

  return (
    <div className="pb-4">
      <div className="container-e pt-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-muted">
          <Link to="/" className="transition hover:text-wine">Home</Link>
          <Icon name="chevronRight" size={13} />
          <Link to={`/category/${product.category}`} className="transition hover:text-wine">
            {product.categoryName ?? 'Shop'}
          </Link>
          <Icon name="chevronRight" size={13} />
          <span className="truncate text-ink">{product.name}</span>
        </nav>
      </div>

      <div className="container-e grid gap-10 py-8 lg:grid-cols-2 lg:gap-14">
        <div className="relative overflow-hidden rounded-[20px] bg-blush shadow-card">
          <img src={product.image} alt={product.name} className="aspect-square w-full object-cover" />
          <div className="absolute left-4 top-4 flex flex-col gap-2">
            {product.onSale && <Badge tone="rose">Save {formatPrice(product.compareAt - product.price)}</Badge>}
            {product.tags.includes('new') && <Badge tone="lilac">New</Badge>}
          </div>
        </div>

        <div>
          <p className="eyebrow">{product.categoryName ?? 'Shop'}</p>
          <h1 className="mt-3 font-display text-[32px] font-semibold leading-tight text-ink sm:text-[40px]">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <Rating value={product.rating} count={product.reviews} size={15} />
            {lowStock && <Badge tone="amber" dot>Only {product.stock} left</Badge>}
            {soldOut && <Badge tone="neutral">Sold out</Badge>}
          </div>

          <p className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-[32px] font-semibold text-wine">{formatPrice(product.price)}</span>
            {product.onSale && (
              <span className="text-[16px] text-muted line-through">{formatPrice(product.compareAt)}</span>
            )}
          </p>

          <p className="mt-4 text-[15px] leading-relaxed text-muted">{product.description}</p>

          <ul className="mt-6 space-y-2.5">
            {product.details.map((detail) => (
              <li key={detail} className="flex items-start gap-2.5 text-[14px] text-ink">
                <Icon name="check" size={16} className="mt-0.5 shrink-0 text-wine" />
                {detail}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-line bg-white">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Decrease quantity"
                className="grid h-11 w-11 place-items-center text-muted transition hover:text-wine disabled:opacity-40"
              >
                <Icon name="minus" size={16} />
              </button>
              <span className="w-10 text-center text-[15px] font-medium tabular-nums" aria-live="polite">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                disabled={qty >= product.stock}
                aria-label="Increase quantity"
                className="grid h-11 w-11 place-items-center text-muted transition hover:text-wine disabled:opacity-40"
              >
                <Icon name="plus" size={16} />
              </button>
            </div>

            <button
              type="button"
              disabled={soldOut}
              onClick={() => addToCart(product, qty)}
              className="btn-primary h-11 flex-1 min-w-[180px]"
            >
              <Icon name="bag" size={17} />
              {soldOut ? 'Sold out' : 'Add to bag'}
            </button>

            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              aria-pressed={saved}
              aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
              className="btn-ghost h-11 w-11 !px-0"
            >
              <Icon name="heart" size={18} filled={saved} className={saved ? 'text-wine' : ''} />
            </button>
          </div>

          <div className="card mt-8 divide-y divide-line p-0">
            {[
              { icon: 'truck', title: 'Free delivery over Rs 5,000', body: 'Dispatched next working day from the studio.' },
              { icon: 'shield', title: '30-day returns', body: 'Unopened sets, prepaid label in every box.' },
              { icon: 'gift', title: `Earn ${pointsFor(product.price)} points`, body: 'Redeemable against any future order.' },
            ].map((row) => (
              <div key={row.title} className="flex items-start gap-3.5 p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blush text-wine">
                  <Icon name={row.icon} size={17} />
                </span>
                <div>
                  <p className="text-[14px] font-medium text-ink">{row.title}</p>
                  <p className="mt-0.5 text-[13px] text-muted">{row.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {related?.length > 0 && (
        <section className="container-e mt-10">
          <h2 className="mb-6 font-display text-[26px] font-semibold text-ink">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {related.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      )}
    </div>
  )
}

import { Link } from 'react-router-dom'
import Icon from './Icon'
import { Badge, Rating } from './ui'
import { formatPrice } from '../lib/format'
import { useStore } from '../context/StoreContext'

export default function ProductCard({ product, className = '' }) {
  const { addToCart, toggleWishlist, inWishlist } = useStore()
  const saved = inWishlist(product.id)
  const soldOut = product.stock === 0

  return (
    <article className={`group card overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:shadow-lift ${className}`}>
      <div className="relative">
        <Link to={`/product/${product.slug}`} className="block aspect-square overflow-hidden bg-blush">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </Link>

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.onSale && <Badge tone="rose">Save {formatPrice(product.compareAt - product.price)}</Badge>}
          {product.tags.includes('new') && <Badge tone="lilac">New</Badge>}
          {soldOut && <Badge tone="neutral">Sold out</Badge>}
        </div>

        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={saved}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-muted
                     backdrop-blur transition hover:text-wine"
        >
          <Icon name="heart" size={17} filled={saved} className={saved ? 'text-wine' : ''} />
        </button>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <Link to={`/product/${product.slug}`} className="min-w-0">
          <h3 className="truncate text-[14px] font-medium text-ink transition group-hover:text-wine">{product.name}</h3>
        </Link>

        {product.colorHex && (
          <p className="-mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
            <span
              className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
              style={{ background: product.colorHex }}
            />
            <span className="truncate">{product.color ?? 'Shade'}</span>
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          <p className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold text-wine">{formatPrice(product.price)}</span>
            {product.onSale && (
              <span className="text-[12px] text-muted line-through">{formatPrice(product.compareAt)}</span>
            )}
          </p>
          <Rating value={product.rating} />
        </div>

        <button
          type="button"
          disabled={soldOut}
          onClick={() => addToCart(product, 1)}
          className="btn-primary mt-1 w-full"
        >
          <Icon name="bag" size={16} />
          {soldOut ? 'Sold out' : 'Add to bag'}
        </button>
      </div>
    </article>
  )
}

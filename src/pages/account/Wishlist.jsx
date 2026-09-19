import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import { EmptyState, PageHeading } from '../../components/ui'
import { formatPrice } from '../../lib/format'
import { useStore } from '../../context/StoreContext'

export default function Wishlist() {
  const { wishlist, toggleWishlist, addToCart } = useStore()

  return (
    <div>
      <PageHeading
        eyebrow="Saved for later"
        title="Wishlist"
        subtitle="Pieces you have saved. They stay here until you move them to your bag."
      />

      <div className="mt-7">
        {wishlist.length === 0 ? (
          <EmptyState
            icon="heart"
            title="Nothing saved yet"
            body="Tap the heart on any product to keep it here for later."
            action={<Link to="/new-arrivals" className="btn-primary">Browse new arrivals</Link>}
          />
        ) : (
          <ul className="space-y-4">
            {wishlist.map((item) => {
              const product = item
              return (
                <li key={item.id} className="card flex flex-wrap items-center gap-4 p-4">
                  <Link to={`/product/${item.slug}`} className="shrink-0">
                    <img src={item.image} alt={item.name} className="h-16 w-16 rounded-xl object-cover" />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link to={`/product/${item.slug}`} className="block truncate text-[15px] font-medium text-ink hover:text-wine">
                      {item.name}
                    </Link>
                    <p className="mt-1 text-[14px] font-semibold text-wine">{formatPrice(item.price)}</p>
                  </div>

                  <div className="flex w-full gap-2 sm:w-auto">
                    <button
                      type="button"
                      onClick={() => product && addToCart(product, 1)}
                      disabled={false}
                      className="btn-primary flex-1 sm:flex-none"
                    >
                      <Icon name="bag" size={16} />
                      Add to bag
                    </button>
                    <button
                      type="button"
                      onClick={() => product && toggleWishlist(product)}
                      aria-label={`Remove ${item.name} from wishlist`}
                      className="btn-ghost !px-3"
                    >
                      <Icon name="trash" size={17} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

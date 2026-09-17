import { Link, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { useStore } from '../context/StoreContext'

/**
 * Minimal storefront header: hamburger on the left, wordmark centred,
 * search and cart on the right. The cart carries a live count badge.
 */
export default function Header({ onOpenMenu, onOpenSearch }) {
  const { count } = useStore()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
      <div className="container-e flex h-16 items-center justify-between gap-2">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="-ml-2 grid h-11 w-11 place-items-center rounded-full text-ink transition hover:bg-wine-50 hover:text-wine"
        >
          <Icon name="menu" size={22} />
        </button>

        <Link
          to="/"
          className="flex min-w-0 flex-col items-center leading-none"
          aria-label="Nails By Eimi — home"
        >
          <span className="font-display text-[22px] font-semibold tracking-[0.02em] text-wine sm:text-[25px]">
            Nails By Eimi
          </span>
          <span className="mt-0.5 hidden text-[9px] uppercase tracking-[0.34em] text-rose sm:block">
            Press-on Atelier
          </span>
        </Link>

        <div className="-mr-2 flex items-center">
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search"
            className="grid h-11 w-11 place-items-center rounded-full text-ink transition hover:bg-wine-50 hover:text-wine"
          >
            <Icon name="search" size={20} />
          </button>

          <button
            type="button"
            onClick={() => navigate('/cart')}
            aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
            className="relative grid h-11 w-11 place-items-center rounded-full text-ink transition hover:bg-wine-50 hover:text-wine"
          >
            <Icon name="cart" size={21} />
            {count > 0 && (
              <span
                className="absolute right-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full
                           bg-wine px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-canvas"
              >
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

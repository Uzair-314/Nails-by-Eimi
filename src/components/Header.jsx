import { Link, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { useStore } from '../context/StoreContext'

/**
 * Below `lg`: hamburger, centred wordmark, search and cart.
 * From `lg` up: the sidebar carries the brand and navigation, so this slims
 * down to just the search and cart controls.
 */
export default function Header({ onOpenMenu, onOpenSearch }) {
  const { count } = useStore()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-2 px-5 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="-ml-2 grid h-11 w-11 place-items-center rounded-full text-ink transition
                     hover:bg-wine-50 hover:text-wine lg:hidden"
        >
          <Icon name="menu" size={22} />
        </button>

        {/* Wordmark only where the sidebar is not showing it. */}
        <Link
          to="/"
          className="flex min-w-0 flex-col items-center leading-none lg:hidden"
          aria-label="Nails By Eimi — home"
        >
          <span className="font-display text-[22px] font-semibold tracking-[0.02em] text-wine sm:text-[25px]">
            Nails By Eimi
          </span>
          <span className="mt-0.5 hidden text-[9px] uppercase tracking-[0.34em] text-rose sm:block">
            Press-on Atelier
          </span>
        </Link>

        {/* Pushes the controls right on desktop, where nothing sits on the left. */}
        <div className="hidden flex-1 lg:block" />

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

import { Link, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { useStore } from '../context/StoreContext'

/**
 * Below `lg`: hamburger left, wordmark centred, search and cart right.
 * From `lg` up: the sidebar carries the brand and navigation, so this slims to
 * the wishlist, search and cart controls.
 *
 * The mobile wordmark is absolutely centred rather than laid out between the
 * two sides, so it stays on the screen's centre line however wide those sides
 * happen to be.
 */
export default function Header({ onOpenMenu, onOpenSearch }) {
  const { count, wishlist } = useStore()
  const navigate = useNavigate()

  const badge = (n) => (
    <span
      className="absolute right-0.5 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full
                 bg-wine px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-canvas"
    >
      {n > 99 ? '99+' : n}
    </span>
  )

  const iconButton =
    'relative grid h-11 w-11 place-items-center rounded-full text-ink transition hover:bg-wine-50 hover:text-wine'

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          className={`${iconButton} -ml-2 lg:hidden`}
        >
          <Icon name="menu" size={24} />
        </button>

        {/* Centred on the header's own centre line, independent of the sides. */}
        <Link
          to="/"
          aria-label="Nails By Eimi — home"
          className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center leading-none lg:hidden"
        >
          <span className="whitespace-nowrap font-display text-[19px] font-semibold tracking-[0.01em] text-wine sm:text-[24px]">
            Nails By Eimi
          </span>
        </Link>

        {/* Pushes the controls right on desktop, where nothing sits on the left. */}
        <div className="hidden flex-1 lg:block" />

        <div className="-mr-2 flex items-center">
          {/* Wishlist lives in the menu on mobile, keeping the wordmark centred. */}
          <button
            type="button"
            onClick={() => navigate('/account/wishlist')}
            aria-label={`Wishlist, ${wishlist.length} ${wishlist.length === 1 ? 'item' : 'items'}`}
            className={`${iconButton} hidden lg:grid`}
          >
            <Icon name="heart" size={20} />
            {wishlist.length > 0 && badge(wishlist.length)}
          </button>

          <button type="button" onClick={onOpenSearch} aria-label="Search" className={iconButton}>
            <Icon name="search" size={21} />
          </button>

          <button
            type="button"
            onClick={() => navigate('/cart')}
            aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
            className={iconButton}
          >
            <Icon name="cart" size={22} />
            {count > 0 && badge(count)}
          </button>
        </div>
      </div>
    </header>
  )
}

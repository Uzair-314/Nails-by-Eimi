import { Link } from 'react-router-dom'
import Icon from './Icon'
import { formatPrice } from '../lib/format'
import { useStore } from '../context/StoreContext'
import NavSections from './NavSections'

/**
 * Permanent navigation rail, shown from `lg` up. Below that the same links
 * live in SideDrawer behind the hamburger.
 *
 * Sticks full-height and scrolls independently of the page.
 */
export default function Sidebar() {
  const { shippingRules } = useStore()

  return (
    <aside
      aria-label="Site navigation"
      className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-line bg-blush lg:flex"
    >
      <Link
        to="/"
        className="flex flex-col border-b border-line/80 px-5 py-5 leading-tight"
        aria-label="Nails By Eimi — home"
      >
        <span className="font-display text-[22px] font-semibold text-wine">Nails By Eimi</span>
      </Link>

      <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-5">
        <NavSections />
      </nav>

      <div className="border-t border-line/80 px-5 py-4">
        <p className="text-[11px] text-muted">{`Free delivery over ${formatPrice(shippingRules.freeOver)}`}</p>
        <div className="mt-3 flex gap-2">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-muted transition hover:text-wine"
          >
            <Icon name="instagram" size={17} />
          </a>
          <a
            href="https://tiktok.com"
            target="_blank"
            rel="noreferrer"
            aria-label="TikTok"
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-muted transition hover:text-wine"
          >
            <Icon name="tiktok" size={17} />
          </a>
        </div>
      </div>
    </aside>
  )
}

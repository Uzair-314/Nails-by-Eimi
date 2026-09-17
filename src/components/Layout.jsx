import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import SideDrawer from './SideDrawer'
import SearchOverlay from './SearchOverlay'
import Footer from './Footer'
import { Toasts } from './ui'
import { useStore } from '../context/StoreContext'

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { toasts } = useStore()
  const { pathname } = useLocation()

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])

  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg
                   focus:bg-wine focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <Header onOpenMenu={() => setMenuOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
      <SideDrawer open={menuOpen} onClose={closeMenu} />
      <SearchOverlay open={searchOpen} onClose={closeSearch} />

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <Toasts toasts={toasts} />
    </div>
  )
}

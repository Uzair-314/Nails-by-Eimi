import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
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
    <div className="flex min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg
                   focus:bg-wine focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      {/* Always on screen from lg up; below that the drawer takes over. */}
      <Sidebar />
      <SideDrawer open={menuOpen} onClose={closeMenu} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenMenu={() => setMenuOpen(true)} onOpenSearch={() => setSearchOpen(true)} />

        <main id="main" className="flex-1">
          <Outlet />
        </main>

        <Footer />
      </div>

      <SearchOverlay open={searchOpen} onClose={closeSearch} />
      <Toasts toasts={toasts} />
    </div>
  )
}

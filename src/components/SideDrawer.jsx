import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Icon from './Icon'
import NavSections from './NavSections'

/**
 * Mobile navigation. Below `lg` the hamburger opens this; from `lg` up the
 * same links are always on screen in Sidebar, and this never renders.
 */
export default function SideDrawer({ open, onClose }) {
  const panelRef = useRef(null)
  const location = useLocation()

  // Close on route change so tapping a link dismisses the drawer.
  useEffect(() => { onClose() }, [location.pathname, location.search]) // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll and wire up Escape while the drawer is open.
  useEffect(() => {
    if (!open) return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <div className="lg:hidden">
      <div
        onClick={onClose}
        aria-hidden="true"
        className={[
          'fixed inset-0 z-50 bg-ink/30 backdrop-blur-[2px] transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
      />

      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[330px] flex-col bg-blush shadow-drawer',
          'transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] focus:outline-none',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-line/80 px-5 py-4">
          <div className="leading-tight">
            <p className="font-display text-[21px] font-semibold text-wine">Nails By Eimi</p>
            <p className="text-[9px] uppercase tracking-[0.3em] text-rose">Press-on Atelier</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-10 w-10 place-items-center rounded-full text-muted transition hover:bg-white hover:text-wine"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-5">
          <NavSections onNavigate={onClose} />
        </nav>

        <div className="border-t border-line/80 px-5 py-4">
          <p className="text-[11px] text-muted">Free delivery over Rs 5,000</p>
          <div className="mt-3 flex gap-2">
            <a href="https://instagram.com" target="_blank" rel="noreferrer"
               className="grid h-9 w-9 place-items-center rounded-full bg-white text-muted transition hover:text-wine"
               aria-label="Instagram">
              <Icon name="instagram" size={17} />
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noreferrer"
               className="grid h-9 w-9 place-items-center rounded-full bg-white text-muted transition hover:text-wine"
               aria-label="TikTok">
              <Icon name="tiktok" size={17} />
            </a>
          </div>
        </div>
      </aside>
    </div>
  )
}

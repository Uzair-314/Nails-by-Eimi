import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Icon from './Icon'
import { formatPrice } from '../lib/format'
import { useStore } from '../context/StoreContext'
import { CategoryList, MenuList } from './NavSections'

const TABS = [
  { id: 'menu', label: 'Menu' },
  { id: 'categories', label: 'Categories' },
]

/**
 * Mobile navigation. Below `lg` the hamburger opens this; from `lg` up the same
 * links are always on screen in Sidebar, and this never renders.
 *
 * Menu and Categories sit as two equal-width tabs at the top, so only one list
 * shows at a time rather than both stacked.
 */
export default function SideDrawer({ open, onClose }) {
  const [tab, setTab] = useState('menu')
  const { shippingRules } = useStore()
  const panelRef = useRef(null)
  const location = useLocation()

  // Close on route change so tapping a link dismisses the drawer.
  useEffect(() => { onClose() }, [location.pathname, location.search]) // eslint-disable-line react-hooks/exhaustive-deps

  // Open on whichever tab matches where the visitor already is.
  useEffect(() => {
    if (open) setTab(location.pathname.startsWith('/category/') ? 'categories' : 'menu')
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

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
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
          <div className="leading-tight">
            <p className="font-display text-[21px] font-semibold text-wine">Nails By Eimi</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="-mr-2 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted
                       transition hover:bg-white hover:text-wine"
          >
            <Icon name="close" size={22} />
          </button>
        </div>

        {/* Two equal-width tabs, divided, with the active one underlined. */}
        <div role="tablist" aria-label="Navigation sections" className="flex border-b border-line">
          {TABS.map((t, i) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                role="tab"
                type="button"
                id={`navtab-${t.id}`}
                aria-selected={active}
                aria-controls={`navpanel-${t.id}`}
                onClick={() => setTab(t.id)}
                className={[
                  'relative flex-1 basis-0 px-3 py-3.5 text-[12px] font-medium uppercase tracking-[0.16em] transition',
                  i === 0 ? 'border-r border-line' : '',
                  active ? 'text-wine' : 'text-muted hover:text-ink',
                ].join(' ')}
              >
                {t.label}
                <span
                  aria-hidden="true"
                  className={[
                    'absolute inset-x-0 -bottom-px mx-auto h-0.5 rounded-full bg-wine transition-all duration-300',
                    active ? 'w-full opacity-100' : 'w-0 opacity-0',
                  ].join(' ')}
                />
              </button>
            )
          })}
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          <div
            role="tabpanel"
            id="navpanel-menu"
            aria-labelledby="navtab-menu"
            hidden={tab !== 'menu'}
            className="animate-fade-in"
          >
            <MenuList onNavigate={onClose} />
          </div>

          <div
            role="tabpanel"
            id="navpanel-categories"
            aria-labelledby="navtab-categories"
            hidden={tab !== 'categories'}
            className="animate-fade-in"
          >
            <CategoryList onNavigate={onClose} />
          </div>
        </nav>

        <div className="border-t border-line/80 px-5 py-4">
          <p className="text-[11px] text-muted">{`Free delivery over ${formatPrice(shippingRules.freeOver)}`}</p>
          <div className="mt-3 flex gap-2">
            <a href="https://instagram.com" target="_blank" rel="noreferrer"
               className="grid h-10 w-10 place-items-center rounded-full bg-white text-muted transition hover:text-wine"
               aria-label="Instagram">
              <Icon name="instagram" size={18} />
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noreferrer"
               className="grid h-10 w-10 place-items-center rounded-full bg-white text-muted transition hover:text-wine"
               aria-label="TikTok">
              <Icon name="tiktok" size={18} />
            </a>
          </div>
        </div>
      </aside>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Icon from './Icon'
import { CATEGORY_LINKS, MENU_LINKS } from '../data/navigation'

/**
 * Off-canvas navigation.
 *
 * Two clearly separated groups — MENU and CATEGORIES — sharing one visual style.
 * Categories with children (Jewellery) expand in place rather than navigating away.
 */
export default function SideDrawer({ open, onClose }) {
  const [expanded, setExpanded] = useState(() => new Set())
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

  // Auto-expand the group that contains the current route.
  useEffect(() => {
    const parent = CATEGORY_LINKS.find((c) =>
      c.children?.some((child) => location.pathname === `/category/${child.slug}`)
    )
    if (parent) setExpanded((s) => new Set(s).add(parent.slug))
  }, [location.pathname])

  const toggle = (slug) =>
    setExpanded((s) => {
      const next = new Set(s)
      next.has(slug) ? next.delete(slug) : next.add(slug)
      return next
    })

  const rowClass = ({ isActive }) =>
    [
      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition duration-200',
      isActive ? 'bg-wine text-white shadow-card' : 'text-ink hover:bg-wine-50 hover:text-wine',
    ].join(' ')

  return (
    <>
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
          <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-rose">Menu</p>
          <ul className="space-y-0.5">
            {MENU_LINKS.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === '/'} className={rowClass}>
                  <Icon name={item.icon} size={19} className="shrink-0 opacity-80" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="my-5 h-px bg-line" />

          <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-rose">Categories</p>
          <ul className="space-y-0.5">
            {CATEGORY_LINKS.map((cat) => {
              if (!cat.children) {
                return (
                  <li key={cat.slug}>
                    <NavLink to={`/category/${cat.slug}`} className={rowClass}>
                      <Icon name={cat.icon} size={19} className="shrink-0 opacity-80" />
                      <span>{cat.label}</span>
                    </NavLink>
                  </li>
                )
              }

              const isOpen = expanded.has(cat.slug)
              return (
                <li key={cat.slug}>
                  <button
                    type="button"
                    onClick={() => toggle(cat.slug)}
                    aria-expanded={isOpen}
                    aria-controls={`submenu-${cat.slug}`}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-ink
                               transition duration-200 hover:bg-wine-50 hover:text-wine"
                  >
                    <Icon name={cat.icon} size={19} className="shrink-0 opacity-80" />
                    <span className="flex-1 text-left">{cat.label}</span>
                    <Icon
                      name="chevronDown"
                      size={17}
                      className={['shrink-0 opacity-60 transition-transform duration-300', isOpen && 'rotate-180'].filter(Boolean).join(' ')}
                    />
                  </button>

                  <div
                    id={`submenu-${cat.slug}`}
                    className={[
                      'grid transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)]',
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                    ].join(' ')}
                  >
                    <ul className="ml-[26px] overflow-hidden border-l border-line pl-3">
                      {cat.children.map((child) => (
                        <li key={child.slug} className="py-0.5 first:pt-1.5 last:pb-1">
                          <NavLink
                            to={`/category/${child.slug}`}
                            tabIndex={isOpen ? 0 : -1}
                            className={({ isActive }) =>
                              [
                                'block rounded-lg px-3 py-2 text-[14px] transition',
                                isActive ? 'bg-wine text-white' : 'text-muted hover:bg-wine-50 hover:text-wine',
                              ].join(' ')
                            }
                          >
                            {child.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-line/80 px-5 py-4">
          <p className="text-[11px] text-muted">Free UK delivery over £50</p>
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
    </>
  )
}

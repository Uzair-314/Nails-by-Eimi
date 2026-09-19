import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Icon from './Icon'
import { MENU_LINKS } from '../data/navigation'
import { useStore } from '../context/StoreContext'
import { useAuth } from '../context/AuthContext'
import { ADMIN_URL } from '../lib/adminLink'

/** Database rows -> the nested shape the menus render. */
export function useCategoryTree() {
  const { categories } = useStore()
  return useMemo(() => {
    const parents = categories.filter((c) => !c.parent_id)
    return parents.map((p) => ({
      ...p,
      children: categories.filter((c) => c.parent_id === p.id),
    }))
  }, [categories])
}

/**
 * Navigation lists shared by the mobile drawer and the desktop sidebar.
 *
 * The drawer tabs between MenuList and CategoryList; the sidebar stacks both
 * under headings. Either way the links come from `data/navigation.js`, so the
 * two presentations cannot drift apart.
 */

const rowClass = ({ isActive }) =>
  [
    'flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] transition duration-200',
    isActive ? 'bg-wine text-white shadow-card' : 'text-ink hover:bg-white hover:text-wine',
  ].join(' ')

export function MenuList({ onNavigate }) {
  const { isAdmin } = useAuth()

  return (
    <ul className="space-y-0.5">
      {MENU_LINKS.map((item) => (
        <li key={item.to}>
          <NavLink to={item.to} end={item.to === '/'} className={rowClass} onClick={onNavigate}>
            <Icon name={item.icon} size={19} className="shrink-0 opacity-80" />
            <span>{item.label}</span>
          </NavLink>
        </li>
      ))}

      {/* Admins get a way into the panel; nobody else sees this row. It is a
          separate application, so this leaves the shop. */}
      {isAdmin && ADMIN_URL && (
        <li>
          <a
            href={ADMIN_URL}
            target="_blank"
            rel="noreferrer"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] text-ink
                       transition duration-200 hover:bg-white hover:text-wine"
          >
            <Icon name="settings" size={19} className="shrink-0 opacity-80" />
            <span>Admin panel</span>
          </a>
        </li>
      )}
    </ul>
  )
}

export function CategoryList({ onNavigate }) {
  const [expanded, setExpanded] = useState(() => new Set())
  const location = useLocation()
  const tree = useCategoryTree()

  // Auto-expand whichever group contains the current route.
  useEffect(() => {
    const parent = tree.find((c) =>
      c.children?.some((child) => location.pathname === `/category/${child.slug}`)
    )
    if (parent) setExpanded((s) => new Set(s).add(parent.slug))
  }, [location.pathname, tree])

  const toggle = (slug) =>
    setExpanded((s) => {
      const next = new Set(s)
      next.has(slug) ? next.delete(slug) : next.add(slug)
      return next
    })

  return (
    <ul className="space-y-0.5">
      {tree.map((cat) => {
        if (!cat.children?.length) {
          return (
            <li key={cat.slug}>
              <NavLink to={`/category/${cat.slug}`} className={rowClass} onClick={onNavigate}>
                <Icon name={cat.icon} size={19} className="shrink-0 opacity-80" />
                <span>{cat.name}</span>
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
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[15px] text-ink
                         transition duration-200 hover:bg-white hover:text-wine"
            >
              <Icon name={cat.icon} size={19} className="shrink-0 opacity-80" />
              <span className="flex-1 text-left">{cat.name}</span>
              <Icon
                name="chevronDown"
                size={17}
                className={['shrink-0 opacity-60 transition-transform duration-300', isOpen && 'rotate-180']
                  .filter(Boolean)
                  .join(' ')}
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
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        [
                          'block rounded-lg px-3 py-2.5 text-[14px] transition',
                          isActive ? 'bg-wine text-white' : 'text-muted hover:bg-white hover:text-wine',
                        ].join(' ')
                      }
                    >
                      {child.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** Stacked presentation used by the desktop sidebar. */
export default function NavSections({ onNavigate }) {
  return (
    <>
      <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-rose">Menu</p>
      <MenuList onNavigate={onNavigate} />

      <div className="my-5 h-px bg-line" />

      <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-rose">Categories</p>
      <CategoryList onNavigate={onNavigate} />
    </>
  )
}

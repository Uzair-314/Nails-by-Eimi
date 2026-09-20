import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import { listAnnouncements } from '../lib/api'
import useAsync from '../hooks/useAsync'

const ROTATE_MS = 3000
const SWIPE_THRESHOLD = 40

/**
 * One line of pink across the very top of the shop.
 *
 * Deliberately a single line at every width: it sits above the black bar and
 * the header, and anything taller pushes the shop itself down the screen. Each
 * announcement is one short sentence for the same reason.
 *
 * Rotation stops on hover, on focus, while dragging, and while the tab is in
 * the background — a link that moves as it is clicked is worse than no
 * rotation at all.
 */
export default function AnnouncementBar() {
  const { data } = useAsync(listAnnouncements, [])
  const items = data ?? []

  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState(0)
  const pointer = useRef({ id: null, startX: 0, locked: null })

  // Each reason to stop is tracked separately. A single `paused` flag lets one
  // handler clear another's pause — a tab regaining visibility would restart
  // rotation under a hovering cursor, moving the link out from under it.
  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [tabHidden, setTabHidden] = useState(() => typeof document !== 'undefined' && document.hidden)
  const paused = hovered || dragging || tabHidden

  const go = useCallback((next) => {
    setIndex((i) => (items.length ? (next + items.length) % items.length : i))
  }, [items.length])

  useEffect(() => {
    if (paused || items.length < 2) return
    const timer = setInterval(() => go(index + 1), ROTATE_MS)
    return () => clearInterval(timer)
  }, [paused, items.length, index, go])

  // Nothing worth animating while nobody is looking.
  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // A pointerup that lands outside the bar — or never arrives, because the
  // gesture was cancelled by a scroll — would otherwise leave rotation stopped
  // for the rest of the visit.
  useEffect(() => {
    if (!dragging) return
    const release = () => { pointer.current = { id: null, startX: 0, locked: null }; setDrag(0); setDragging(false) }
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
    return () => {
      window.removeEventListener('pointerup', release)
      window.removeEventListener('pointercancel', release)
    }
  }, [dragging])

  // Hiding an announcement in the admin shortens the list.
  useEffect(() => {
    if (items.length && index > items.length - 1) setIndex(0)
  }, [items.length, index])

  const onPointerDown = (e) => {
    if (items.length < 2) return
    pointer.current = { id: e.pointerId, startX: e.clientX, locked: null }
    setDragging(true)
  }

  const onPointerMove = (e) => {
    const p = pointer.current
    if (p.id !== e.pointerId) return
    const dx = e.clientX - p.startX
    // Let a vertical scroll win: the bar is only one line tall and sits right
    // where a thumb lands when someone starts scrolling the page.
    if (p.locked === null) p.locked = Math.abs(dx) > 6 ? 'x' : null
    if (p.locked === 'x') setDrag(dx)
  }

  const endDrag = (e) => {
    const p = pointer.current
    if (p.id !== e.pointerId) return
    if (Math.abs(drag) > SWIPE_THRESHOLD) go(index + (drag < 0 ? 1 : -1))
    pointer.current = { id: null, startX: 0, locked: null }
    setDrag(0)
    setDragging(false)
  }

  if (!items.length) return null

  return (
    <div
      className="relative overflow-hidden bg-blush text-ink"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* A hairline of brand colour so the strip reads as part of the shop
          rather than a browser notification. */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-wine-200" />

      <div
        aria-live="polite"
        className="mx-auto flex h-9 max-w-[1200px] items-center justify-center px-4 touch-pan-y"
        style={{
          transform: `translate3d(${drag * 0.25}px, 0, 0)`,
          transition: drag ? 'none' : 'transform 300ms ease-out',
        }}
      >
        {items.map((item, i) => {
          const active = i === index
          const label = (
            <span className="flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium tracking-[0.01em] sm:text-[13px]">
              <Icon name="sparkle" size={13} className="shrink-0 text-wine" />
              {item.text}
              {item.to && <Icon name="arrowRight" size={13} className="shrink-0 text-wine" />}
            </span>
          )

          return (
            <div
              key={item.id}
              aria-hidden={!active}
              // The outgoing line clears faster than the incoming one arrives,
              // so the two are never both legible at once — a crossfade at
              // equal speed shows doubled text through the middle of it.
              className={`transition-all ease-out ${
                active
                  ? 'translate-y-0 opacity-100 duration-500'
                  : 'pointer-events-none absolute translate-y-2 opacity-0 duration-150'
              }`}
            >
              {item.to ? (
                <Link
                  to={item.to}
                  tabIndex={active ? 0 : -1}
                  className="text-wine-700 underline-offset-[3px] transition hover:text-wine hover:underline"
                >
                  {label}
                </Link>
              ) : (
                label
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

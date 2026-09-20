import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import { listHeroSlides } from '../lib/api'
import useAsync from '../hooks/useAsync'

const AUTOPLAY_MS = 5000
const SWIPE_THRESHOLD = 50 // px of horizontal travel before a drag counts as a swipe

/**
 * Full-bleed hero slider.
 *
 * - Advances on its own every 5s, pausing on hover, focus, drag and when the tab is hidden.
 * - Drag or swipe horizontally to move between slides; the track follows the finger.
 * - Capped at three slides by design, and run from the admin panel.
 *
 * Images are drawn with object-cover, which never stretches them. The slot is a
 * different shape on phone, tablet and desktop, so something has to be cropped;
 * each slide carries a focal point saying what must stay in frame.
 */
export default function HeroCarousel() {
  const { data, loading } = useAsync(listHeroSlides, [])
  const slides = data ?? []
  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState(0)
  const [paused, setPaused] = useState(false)

  const trackRef = useRef(null)
  const pointer = useRef({ id: null, startX: 0, startY: 0, locked: null })

  const goTo = useCallback((next) => {
    setIndex((next + slides.length) % slides.length)
  }, [slides.length])

  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])

  // Autoplay. Skipped entirely for visitors who prefer reduced motion.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || paused || slides.length < 2) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [paused, slides.length, index])

  // Don't burn through slides while the tab is in the background.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    pointer.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, locked: null }
    setPaused(true)
  }

  const onPointerMove = (e) => {
    const p = pointer.current
    if (p.id !== e.pointerId) return

    const dx = e.clientX - p.startX
    const dy = e.clientY - p.startY

    // Decide once whether this gesture is a horizontal swipe or a vertical page scroll.
    if (p.locked === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      p.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (p.locked === 'x') trackRef.current?.setPointerCapture?.(e.pointerId)
    }
    if (p.locked !== 'x') return

    const width = trackRef.current?.offsetWidth || 1
    // Rubber-band at the ends so the first and last slides feel bounded.
    const atEdge = (index === 0 && dx > 0) || (index === slides.length - 1 && dx < 0)
    setDrag((atEdge ? dx * 0.32 : dx) / width)
  }

  const endDrag = (e) => {
    const p = pointer.current
    if (p.id !== e.pointerId) return

    const width = trackRef.current?.offsetWidth || 1
    const travelled = drag * width

    if (travelled <= -SWIPE_THRESHOLD) next()
    else if (travelled >= SWIPE_THRESHOLD) prev()

    pointer.current = { id: null, startX: 0, startY: 0, locked: null }
    setDrag(0)
    setPaused(false)
  }

  const dragging = drag !== 0

  // Hiding a slide in the admin shortens the list, which can leave the index
  // pointing past the end.
  useEffect(() => {
    if (slides.length && index > slides.length - 1) setIndex(0)
  }, [slides.length, index])

  // Hold the space while they load, so the page below does not jump when they
  // arrive. If the admin has hidden every slide, show nothing at all.
  if (loading && !slides.length) {
    return (
      <section className="container-e" aria-hidden="true">
        <div className="aspect-[4/5] w-full animate-pulse rounded-[20px] bg-wine-50 sm:aspect-[16/9] lg:aspect-[21/9]" />
      </section>
    )
  }
  if (!slides.length) return null

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured collections"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="container-e">
        <div className="relative overflow-hidden rounded-[20px] bg-wine-50 shadow-card">
          <div
            ref={trackRef}
            className="flex touch-pan-y"
            style={{
              transform: `translate3d(${(-index + drag) * 100}%, 0, 0)`,
              transition: dragging ? 'none' : 'transform 700ms cubic-bezier(.22,1,.36,1)',
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {slides.map((slide, i) => (
              <article
                key={slide.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slides.length}`}
                aria-hidden={i !== index}
                className="relative w-full shrink-0 select-none"
              >
                <div className="relative aspect-[4/5] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
                  {/* object-cover never distorts the picture; the focal point set in
                      the admin decides which part survives the crop. */}
                  <img
                    src={slide.image}
                    alt={slide.alt}
                    draggable="false"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    style={{ objectPosition: slide.focal }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  {/* Scrim sits only under the copy so the artwork keeps its colour. */}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/15 to-transparent
                                  sm:bg-gradient-to-r sm:from-ink/55 sm:via-ink/5 sm:via-55% sm:to-transparent" />

                  <div className="absolute inset-0 flex items-end sm:items-center">
                    <div className="w-full px-6 pb-12 sm:max-w-[56%] sm:px-10 sm:pb-0 lg:px-14">
                      <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-white/85">
                        {slide.eyebrow}
                      </p>
                      <h2 className="mt-2 font-display text-[34px] font-semibold leading-[1.06] text-white sm:text-[46px] lg:text-[58px]">
                        {slide.title}
                      </h2>
                      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-white/85 sm:text-[15px]">
                        {slide.copy}
                      </p>
                      {slide.cta?.to && (
                        <Link
                          to={slide.cta.to}
                          tabIndex={i === index ? 0 : -1}
                          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm
                                     font-medium text-ink shadow-lift transition hover:bg-wine hover:text-white"
                        >
                          {slide.cta.label}
                          <Icon name="arrowRight" size={16} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Arrows sit in the corner, clear of the copy. Touch users swipe instead. */}
          <div className="absolute bottom-5 right-5 hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/85 text-ink
                         backdrop-blur transition hover:bg-white"
            >
              <Icon name="chevronLeft" size={19} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/85 text-ink
                         backdrop-blur transition hover:bg-white"
            >
              <Icon name="chevronRight" size={19} />
            </button>
          </div>

          <div className="absolute bottom-[30px] left-0 right-0 flex justify-center gap-2 sm:bottom-9">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className={[
                  'h-1.5 rounded-full transition-all duration-500',
                  i === index ? 'w-8 bg-white' : 'w-2 bg-white/55 hover:bg-white/80',
                ].join(' ')}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

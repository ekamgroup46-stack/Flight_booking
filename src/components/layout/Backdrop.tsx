import { useEffect, useRef, type ReactNode } from 'react'
import { HERO_IMAGE } from '@/config/services'
import s from './Backdrop.module.css'

/**
 * The site-wide fixed background. The photo never scrolls — pages glide over it.
 * `--sink` (0 → 1) fades in a pre-blurred copy as content covers the view, so the
 * glass sheets above look frosted without paying for live backdrop blur every frame.
 */
export function Backdrop({ hero }: { hero: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!hero) {
      el.style.setProperty('--sink', '1')
      return
    }
    let frame = 0
    const update = () => {
      frame = 0
      const h = window.innerHeight
      const sink = Math.min(1, Math.max(0, (window.scrollY - h * 0.2) / (h * 0.6)))
      el.style.setProperty('--sink', sink.toFixed(3))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [hero])

  return (
    <div ref={ref} className={s.backdrop} aria-hidden data-print="hide">
      <img src={HERO_IMAGE} alt="" className={s.sharp} fetchPriority="high" />
      <img src={HERO_IMAGE} alt="" className={s.soft} />
      <span className={s.tint} />
      <span className={s.glow} />
    </div>
  )
}

/** Frosted, glossy sheet that carries page content over the fixed backdrop. */
export function GlassSheet({ children }: { children: ReactNode }) {
  return <div className={s.sheet}>{children}</div>
}

export const sheetClass = s.sheet

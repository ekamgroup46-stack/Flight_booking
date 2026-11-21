import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/cn'
import { smoothScroll } from '@/lib/smoothScroll'
import s from './ScrollUI.module.css'

/** Publishes scroll progress (0–1) as a CSS variable on the given elements. */
function useScrollProgress(onChange?: (p: number, y: number) => void) {
  const refs = useRef<Array<HTMLElement | null>>([])
  const cb = useRef(onChange)
  useEffect(() => {
    cb.current = onChange
  })
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0
      for (const el of refs.current) el?.style.setProperty('--p', p.toFixed(4))
      cb.current?.(p, window.scrollY)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const ro = new ResizeObserver(schedule)
    ro.observe(document.body)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      ro.disconnect()
    }
  }, [])
  return (i: number) => (el: HTMLElement | null) => {
    refs.current[i] = el
  }
}

/** Five-line reading progress under the nav, plus a back-to-top control. */
export function ScrollUI({ hideTopButton }: { hideTopButton?: boolean }) {
  const [showTop, setShowTop] = useState(false)
  const bind = useScrollProgress((_, y) => setShowTop(y > 720))
  return (
    <>
      <div ref={bind(0)} className={s.progress} aria-hidden data-print="hide" />
      {!hideTopButton && (
        <button
          ref={bind(1)}
          type="button"
          className={cn(s.top, showTop && s.topOn)}
          onClick={() => smoothScroll.to(0)}
          aria-label="Back to top"
          tabIndex={showTop ? 0 : -1}
          data-print="hide"
        >
          <ArrowUp />
        </button>
      )}
    </>
  )
}

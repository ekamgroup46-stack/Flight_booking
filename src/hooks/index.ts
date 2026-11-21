import { useEffect, useRef, useState, type RefObject } from 'react'
import { smoothScroll } from '@/lib/smoothScroll'

/** Calls `onDismiss` on outside pointer-down or Escape while `active`. */
export function useDismiss(refs: Array<RefObject<HTMLElement | null>>, onDismiss: () => void, active: boolean) {
  const cb = useRef(onDismiss)
  useEffect(() => {
    cb.current = onDismiss
  })
  useEffect(() => {
    if (!active) return
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node
      if (refs.every((r) => !r.current?.contains(target))) cb.current()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cb.current()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
}

export function useScrolled(threshold = 12): boolean {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return scrolled
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false))
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

export function useDebouncedValue<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Ekam` : 'Ekam · Flights, Trains, Buses, Cabs & Cargo'
  }, [title])
}

export function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    const prevPad = document.body.style.paddingRight
    const gap = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (gap > 0) document.body.style.paddingRight = `${gap}px`
    smoothScroll.lock()
    return () => {
      document.body.style.overflow = prev
      document.body.style.paddingRight = prevPad
      smoothScroll.unlock()
    }
  }, [active])
}

/**
 * Reveals any element marked `data-reveal` as it scrolls into view.
 * Mounted once in the root layout; works for content rendered later too.
 */
export function useRevealObserver() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.setAttribute('data-reveal', 'in')
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    const scan = () => document.querySelectorAll('[data-reveal]:not([data-reveal="in"])').forEach((el) => io.observe(el))
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])
}

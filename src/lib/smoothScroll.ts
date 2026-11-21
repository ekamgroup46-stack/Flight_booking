import Lenis from 'lenis'

/**
 * Inertial smooth scrolling for wheel/trackpad (touch keeps native scrolling).
 * A single instance is shared app-wide; overlays pause it while they're open.
 * Honours `prefers-reduced-motion` (Lenis then tracks input 1:1).
 */
let lenis: Lenis | null = null
let locks = 0

export function initSmoothScroll(): () => void {
  if (lenis || typeof window === 'undefined') return () => {}
  lenis = new Lenis({
    autoRaf: true,
    lerp: 0.1,
    smoothWheel: true,
    allowNestedScroll: true,
    stopInertiaOnNavigate: true,
    anchors: { offset: -96 },
  })
  return () => {
    lenis?.destroy()
    lenis = null
  }
}

export const smoothScroll = {
  /** Scroll the page to a position or element, smoothly where possible. */
  to(target: number | string | HTMLElement, options: { offset?: number; immediate?: boolean } = {}) {
    if (lenis) {
      lenis.scrollTo(target, { offset: options.offset ?? 0, immediate: options.immediate })
      return
    }
    const top = typeof target === 'number' ? target : (typeof target === 'string' ? document.querySelector(target) : target)?.getBoundingClientRect().top
    if (top === undefined) return
    window.scrollTo({ top: typeof target === 'number' ? target : window.scrollY + top + (options.offset ?? 0), behavior: options.immediate ? 'auto' : 'smooth' })
  },
  /** Pause page scrolling (nested locks are counted). */
  lock() {
    locks++
    lenis?.stop()
  },
  unlock() {
    locks = Math.max(0, locks - 1)
    if (!locks) lenis?.start()
  },
}

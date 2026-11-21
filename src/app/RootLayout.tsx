import { useEffect } from 'react'
import { Outlet, ScrollRestoration, useLocation, useMatches, useNavigation } from 'react-router'
import { LineBundle } from '@/components/brand/Brand'
import { Backdrop, sheetClass } from '@/components/layout/Backdrop'
import { Footer } from '@/components/layout/Footer'
import { Navbar, type RouteHandle } from '@/components/layout/Navbar'
import { ScrollUI } from '@/components/layout/ScrollUI'
import { Toaster } from '@/components/ui/Feedback'
import { ROUTES } from '@/config/routes'
import { useRevealObserver } from '@/hooks'
import { cn } from '@/lib/cn'
import { initSmoothScroll } from '@/lib/smoothScroll'
import s from './RootLayout.module.css'

export function RootLayout() {
  useRevealObserver()
  useEffect(() => initSmoothScroll(), [])
  const navigation = useNavigation()
  const { pathname } = useLocation()
  const overlay = useMatches().some((m) => (m.handle as RouteHandle | undefined)?.navOverlay)

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {navigation.state === 'loading' && (
        <div className={s.progress} role="progressbar" aria-label="Loading page">
          <LineBundle thickness={2} gap={0} animated />
        </div>
      )}
      {/* The five lines sweep across on every page change. */}
      <div key={`sweep-${pathname}`} className={s.sweep} aria-hidden data-print="hide">
        <LineBundle thickness={2} gap={2} />
      </div>
      <Backdrop hero={overlay} />
      <Navbar />
      <main id="main" className={overlay ? undefined : s.offset}>
        {/* Hero pages place their own GlassSheet below the hero; every other page *is* a sheet. */}
        <div key={pathname} className={overlay ? s.page : cn(s.page, s.sheetPage, sheetClass)}>
          <Outlet />
        </div>
      </main>
      <Footer />
      <ScrollUI hideTopButton={pathname === ROUTES.checkout} />
      <Toaster />
      {/* Keyed by URL: fresh page loads otherwise share the "default" key and inherit another page's scroll. */}
      <ScrollRestoration getKey={(location) => location.pathname + location.search} />
    </>
  )
}

export function AppLoading() {
  return (
    <div className={s.boot}>
      <LineBundle thickness={3} gap={3} animated className={s.bootBundle} />
    </div>
  )
}

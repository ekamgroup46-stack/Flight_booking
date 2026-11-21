import type { ComponentType } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'
import type { RouteHandle } from '@/components/layout/Navbar'
import { AppLoading, RootLayout } from './RootLayout'
import NotFoundPage from '@/features/errors/NotFoundPage'
import { RouteError } from './RouteError'

/** Code-split page loader: each feature page ships as its own chunk. */
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default })
const overlay: RouteHandle = { navOverlay: true }

const pages: RouteObject[] = [
  { index: true, lazy: page(() => import('@/features/home/HomePage')), handle: overlay },

  // Services — landing (hero + search) and results
  { path: 'flights', lazy: page(() => import('@/features/flights/FlightsPage')), handle: overlay },
  { path: 'flights/results', lazy: page(() => import('@/features/flights/FlightResultsPage')) },
  { path: 'trains', lazy: page(() => import('@/features/trains/TrainsPage')), handle: overlay },
  { path: 'trains/results', lazy: page(() => import('@/features/trains/TrainResultsPage')) },
  { path: 'buses', lazy: page(() => import('@/features/buses/BusesPage')), handle: overlay },
  { path: 'buses/results', lazy: page(() => import('@/features/buses/BusResultsPage')) },
  { path: 'cabs', lazy: page(() => import('@/features/cabs/CabsPage')), handle: overlay },
  { path: 'cabs/results', lazy: page(() => import('@/features/cabs/CabResultsPage')) },
  { path: 'cargo', lazy: page(() => import('@/features/cargo/CargoPage')), handle: overlay },
  { path: 'cargo/quotes', lazy: page(() => import('@/features/cargo/CargoQuotesPage')) },
  { path: 'cargo/track', lazy: page(() => import('@/features/cargo/CargoTrackPage')) },

  // Booking flow
  { path: 'checkout', lazy: page(() => import('@/features/checkout/CheckoutPage')) },
  { path: 'booking/:bookingId/confirmed', lazy: page(() => import('@/features/checkout/ConfirmationPage')) },
  { path: 'bookings', lazy: page(() => import('@/features/bookings/MyBookingsPage')) },

  // Account, offers, help
  { path: 'offers', lazy: page(() => import('@/features/offers/OffersPage')) },
  { path: 'login', lazy: page(() => import('@/features/auth/AuthPage')) },
  { path: 'signup', lazy: page(() => import('@/features/auth/AuthPage')) },
  { path: 'support', lazy: page(() => import('@/features/support/SupportPage')) },

  // Company & legal
  { path: 'about', lazy: page(() => import('@/features/info/AboutPage')), handle: overlay },
  { path: 'contact', lazy: page(() => import('@/features/info/ContactPage')) },
  { path: 'policies/booking', lazy: page(() => import('@/features/info/LegalPage')) },
  { path: 'terms', lazy: page(() => import('@/features/info/LegalPage')) },
  { path: 'privacy', lazy: page(() => import('@/features/info/LegalPage')) },

  { path: '*', Component: NotFoundPage },
]

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    HydrateFallback: AppLoading,
    children: [{ ErrorBoundary: RouteError, children: pages }],
  },
])

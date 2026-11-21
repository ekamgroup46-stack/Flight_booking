/** Single source of truth for URLs. Pages and links import from here. */
export const ROUTES = {
  home: '/',
  flights: '/flights',
  flightResults: '/flights/results',
  trains: '/trains',
  trainResults: '/trains/results',
  buses: '/buses',
  busResults: '/buses/results',
  cabs: '/cabs',
  cabResults: '/cabs/results',
  cargo: '/cargo',
  cargoQuotes: '/cargo/quotes',
  cargoTrack: '/cargo/track',
  checkout: '/checkout',
  confirmation: (bookingId: string) => `/booking/${encodeURIComponent(bookingId)}/confirmed`,
  bookings: '/bookings',
  offers: '/offers',
  login: '/login',
  signup: '/signup',
  support: '/support',
  about: '/about',
  contact: '/contact',
  bookingPolicy: '/policies/booking',
  terms: '/terms',
  privacy: '/privacy',
} as const

export function withQuery(
  path: string,
  params: URLSearchParams | Record<string, string | number | undefined>,
) {
  const search =
    params instanceof URLSearchParams
      ? params
      : new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)]),
        )
  const qs = search.toString()
  return qs ? `${path}?${qs}` : path
}

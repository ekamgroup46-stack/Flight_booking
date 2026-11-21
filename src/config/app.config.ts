/**
 * Centralised application configuration.
 * Everything environment-specific is read here once, so the rest of the app
 * never touches `import.meta.env` directly.
 *
 * NOTE: Brand contact details below are placeholders for this design phase.
 */

const env = import.meta.env

function parseLatency(value: string | undefined): [number, number] {
  const [min, max] = (value ?? '350,900').split(',').map((n) => Number(n.trim()))
  const lo = Number.isFinite(min) ? Math.max(0, min) : 350
  const hi = Number.isFinite(max) ? Math.max(lo, max) : 900
  return [lo, hi]
}

export const appConfig = {
  brand: {
    name: 'Ekam',
    legalName: 'Ekam Groups Travel Pvt. Ltd.',
    devanagari: 'एकम्',
    meaning: 'one',
    tagline: 'Every way to go, one place to book it.',
    support: {
      phone: '1800 123 3526',
      phoneHref: 'tel:18001233526',
      email: 'care@ekam.travel',
      whatsapp: '+91 90000 35260',
      hours: '24 × 7, every day of the year',
    },
    businessEmail: 'business@ekam.travel',
    pressEmail: 'press@ekam.travel',
    address: 'Level 4, Ekam House, Residency Road, Bengaluru 560025',
    socials: [
      { label: 'Instagram', href: 'https://instagram.com/' },
      { label: 'X / Twitter', href: 'https://x.com/' },
      { label: 'LinkedIn', href: 'https://linkedin.com/' },
      { label: 'YouTube', href: 'https://youtube.com/' },
    ],
  },

  locale: 'en-IN',
  currency: 'INR',
  timeZone: 'Asia/Kolkata',

  api: {
    baseUrl: env.VITE_API_BASE_URL ?? '/api',
    /** When true, every service module resolves from local mock data. */
    useMocks: (env.VITE_USE_MOCKS ?? 'true') !== 'false',
    timeoutMs: 15_000,
  },

  mock: {
    latency: parseLatency(env.VITE_MOCK_LATENCY),
    failureRate: Math.min(1, Math.max(0, Number(env.VITE_MOCK_FAILURE_RATE ?? 0) || 0)),
  },

  booking: {
    /** Minutes a fare is held while the traveller completes checkout. */
    holdMinutes: 15,
    maxPassengers: 9,
    maxBusSeats: 6,
    /** Ekam's pricing promise: no convenience fee. */
    convenienceFee: 0,
  },

  search: {
    /** How far ahead (days) travellers can book. */
    maxAdvanceDays: 330,
  },
} as const

export type AppConfig = typeof appConfig

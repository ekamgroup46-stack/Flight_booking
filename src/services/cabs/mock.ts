import { diffInDays, todayISO } from '@/lib/dates'
import { haversineKm } from '@/lib/geo'
import { createRng } from '@/lib/random'
import { findPlace } from '@/services/locations/api'
import type { CabCategory, CabOption, CabQuoteResult, CabSearchParams, RentalPackage } from './types'

interface CategoryMeta {
  name: string
  model: string
  seats: number
  bags: number
  fuel: CabOption['fuel']
  perKm: number
  rentalFactor: number
  rating: number
}

const CATEGORIES: Record<CabCategory, CategoryMeta> = {
  mini: { name: 'Mini', model: 'WagonR, Celerio or similar', seats: 4, bags: 1, fuel: 'CNG', perKm: 11.5, rentalFactor: 1, rating: 4.5 },
  sedan: { name: 'Sedan', model: 'Dzire, Aura or similar', seats: 4, bags: 2, fuel: 'Petrol', perKm: 13.5, rentalFactor: 1.16, rating: 4.7 },
  ev: { name: 'Electric Sedan', model: 'Tigor EV, e-Verito or similar', seats: 4, bags: 2, fuel: 'Electric', perKm: 14, rentalFactor: 1.2, rating: 4.8 },
  suv: { name: 'SUV', model: 'Ertiga, Carens or similar', seats: 6, bags: 3, fuel: 'Diesel', perKm: 16.5, rentalFactor: 1.45, rating: 4.6 },
  suvplus: { name: 'SUV+', model: 'Innova Crysta or similar', seats: 6, bags: 4, fuel: 'Diesel', perKm: 20.5, rentalFactor: 1.8, rating: 4.8 },
  premium: { name: 'Luxury', model: 'Camry, E-Class or similar', seats: 4, bags: 3, fuel: 'Petrol', perKm: 34, rentalFactor: 3, rating: 4.9 },
  tempo: { name: 'Tempo Traveller', model: '12-seater Force Traveller', seats: 12, bags: 8, fuel: 'Diesel', perKm: 26, rentalFactor: 2.4, rating: 4.4 },
}

const RENTAL_BASE: Record<RentalPackage, [number, number, number]> = {
  // price for Mini, hours, km
  '2-20': [549, 2, 20],
  '4-40': [949, 4, 40],
  '8-80': [1799, 8, 80],
  '12-120': [2599, 12, 120],
}

const round9 = (n: number) => Math.max(99, Math.round(n / 10) * 10 - 1)

export function mockCabQuote(p: CabSearchParams): CabQuoteResult {
  const from = findPlace(p.from)
  if (!from) throw new Error('Unknown pickup')
  const to = p.trip === 'rental' ? null : (findPlace(p.to) ?? null)
  if (p.trip !== 'rental' && !to) throw new Error('Unknown drop')
  const rng = createRng(`cab|${p.trip}|${p.from}|${p.to}|${p.date}|${p.pkg}`)

  const straight = to ? haversineKm(from, to) : 0
  const pkg = p.pkg ?? '4-40'
  let distanceKm = to ? Math.max(4, Math.round(straight * 1.35)) : RENTAL_BASE[pkg][2]
  const city = distanceKm < 70
  let durationMin = to ? Math.round((distanceKm / (city ? 24 : 52)) * 60 + 8) : RENTAL_BASE[pkg][1] * 60
  const days = p.trip === 'round' && p.ret ? Math.max(1, diffInDays(p.ret, p.date) + 1) : 1
  if (p.trip === 'round') {
    distanceKm = Math.max(250 * days, distanceKm * 2)
    durationMin *= 2
  }
  const outstation = p.trip === 'oneway' || p.trip === 'round'
  const tolls = outstation ? Math.round((distanceKm * 1.15) / 10) * 10 : p.trip === 'airport' ? 120 : 0

  const categories: CabCategory[] =
    p.trip === 'airport'
      ? ['mini', 'sedan', 'ev', 'suv', 'suvplus', 'premium']
      : p.trip === 'rental'
        ? ['mini', 'sedan', 'ev', 'suv', 'suvplus', 'premium']
        : ['sedan', ...(distanceKm < 220 ? (['ev'] as const) : []), 'suv', 'suvplus', 'premium', 'tempo']

  const today = p.date === todayISO()
  const options = categories.map<CabOption>((cat) => {
    const m = CATEGORIES[cat]
    let price: number
    const inclusions: string[] = []
    const exclusions: string[] = []
    if (p.trip === 'rental') {
      price = RENTAL_BASE[pkg][0] * m.rentalFactor
      inclusions.push(`${RENTAL_BASE[pkg][2]} km & ${RENTAL_BASE[pkg][1]} hrs`, 'Fuel', 'GST')
      exclusions.push('Parking & tolls', 'Extra km / hour')
    } else if (p.trip === 'airport') {
      price = 199 + distanceKm * m.perKm * 1.05 + tolls
      inclusions.push('Airport entry & tolls', 'Fuel', 'GST', '45 min free waiting at arrivals')
      exclusions.push('Parking beyond 45 min')
    } else {
      const driver = 300 * days
      price = distanceKm * m.perKm * (p.trip === 'round' ? 0.92 : 1.12) + driver + tolls
      inclusions.push(`${distanceKm} km`, 'Driver allowance', 'Tolls & state tax', 'GST')
      exclusions.push('Parking', 'Night charges after 10 PM (₹250)')
    }
    const final = round9(price * rng.float(0.95, 1.06))
    return {
      id: `${cat}`,
      category: cat,
      name: m.name,
      model: m.model,
      seats: m.seats,
      bags: m.bags,
      fuel: m.fuel,
      price: final,
      strikePrice: rng.chance(0.3) ? round9(final * 1.14) : undefined,
      etaMin: today && !outstation ? rng.int(3, 14) : undefined,
      inclusions,
      exclusions,
      extraKm: Math.round(m.perKm * (p.trip === 'rental' ? 1.1 : 1)),
      extraHour: p.trip === 'rental' ? Math.round(140 * m.rentalFactor) : undefined,
      rating: m.rating,
      cancellation: outstation ? 'Free cancellation up to 6 hours before pickup' : 'Free cancellation up to 1 hour before pickup',
    }
  })

  const cheapest = options.reduce((a, b) => (a.price <= b.price ? a : b))
  cheapest.tag = 'Best value'
  const ev = options.find((o) => o.category === 'ev')
  if (ev) ev.tag = 'Zero tailpipe'
  const popular = options.find((o) => o.category === (outstation ? 'suv' : 'sedan'))
  if (popular && !popular.tag) popular.tag = 'Most booked'

  return { trip: p.trip, from, to, distanceKm, durationMin, days, tolls, pkg: p.trip === 'rental' ? pkg : undefined, options }
}

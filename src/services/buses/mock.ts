import { addMinutes, combineDateTime } from '@/lib/dates'
import { haversineKm } from '@/lib/geo'
import { createRng } from '@/lib/random'
import { BUS_POINTS } from '@/services/locations/data'
import { findCity } from '@/services/locations/api'
import type { Bus, BusAmenity, BusLayout, BusPoint, BusSearchResult, Deck, Seat, SeatLayout } from './types'

/* Fictional operators. */
const OPERATORS: Array<[string, number]> = [
  ['Kaveri Cruisers', 4.5],
  ['Deccan Starline', 4.3],
  ['Sahyadri Travels', 4.1],
  ['Konkan Coastliner', 4.4],
  ['NightOwl Sleepers', 4.6],
  ['Himalayan Roadways', 4.2],
  ['Royal Ghats Express', 3.9],
  ['Malabar Motion', 4.2],
  ['Northern Arc Coaches', 4.0],
  ['Greenline Electric', 4.7],
  ['Vindhya Voyages', 3.8],
  ['Coromandel Coaches', 4.3],
]

interface BusType {
  name: string
  layout: BusLayout
  ac: boolean
  rate: number
  electric?: boolean
  premium?: boolean
}

const BUS_TYPES: BusType[] = [
  { name: 'Volvo 9600 Multi-Axle A/C Sleeper (2+1)', layout: 'sleeper', ac: true, rate: 1.95, premium: true },
  { name: 'Bharat Benz A/C Sleeper (2+1)', layout: 'sleeper', ac: true, rate: 1.7 },
  { name: 'Scania Multi-Axle A/C Semi Sleeper (2+2)', layout: 'semi', ac: true, rate: 1.35, premium: true },
  { name: 'Electric A/C Seater (2+2)', layout: 'seater', ac: true, rate: 1.18, electric: true },
  { name: 'Non A/C Sleeper (2+1)', layout: 'sleeper', ac: false, rate: 1.15 },
  { name: 'A/C Seater Pushback (2+2)', layout: 'seater', ac: true, rate: 1.05 },
]

const TOTAL_SEATS: Record<BusLayout, number> = { sleeper: 36, semi: 41, seater: 45 }

function points(cityId: string, name: string, start: string, step: number, rng: ReturnType<typeof createRng>, prefix: string): BusPoint[] {
  const names = BUS_POINTS[cityId] ?? [`${name} Central Bus Stand`, `${name} Railway Station`, `${name} Bypass Road`]
  return rng
    .sample(names, Math.min(names.length, rng.int(2, 4)))
    .map((n, i) => ({ id: `${prefix}${i}`, name: n, at: addMinutes(start, i * step) }))
}

export function generateBuses(fromId: string, toId: string, date: string): Bus[] {
  const A = findCity(fromId)
  const B = findCity(toId)
  if (!A || !B || A.id === B.id) return []
  const dist = Math.round(haversineKm(A, B) * 1.32)
  if (dist > 2200) return []
  const rng = createRng(`bus|${A.id}|${B.id}|${date}`)
  const count = dist > 1200 ? rng.int(3, 6) : dist < 120 ? rng.int(6, 10) : rng.int(10, 18)
  const buses: Bus[] = []

  for (let i = 0; i < count; i++) {
    const [operator, baseRating] = rng.pick(OPERATORS)
    const type = dist < 250 ? rng.pick(BUS_TYPES.filter((t) => t.layout !== 'sleeper')) : rng.pick(BUS_TYPES)
    const overnight = dist > 280 && rng.chance(0.75)
    const departMin = overnight ? rng.int(19 * 12, 23 * 12 + 9) * 5 : rng.int(5 * 12 + 6, 21 * 12) * 5
    const durationMin = Math.round(((dist / rng.float(46, 56)) * 60 + rng.int(10, 40)) / 5) * 5
    const departAt = combineDateTime(date, departMin)
    const arriveAt = addMinutes(departAt, durationMin)
    const price = Math.max(249, Math.round((dist * type.rate * rng.float(0.88, 1.2)) / 10) * 10 - 1)
    const total = TOTAL_SEATS[type.layout]
    const amenities: BusAmenity[] = ['tracking', 'cctv']
    if (type.ac) amenities.push('charging', 'water', 'light')
    if (type.premium || rng.chance(0.3)) amenities.push('wifi')
    if (type.layout === 'sleeper' && type.ac) amenities.push('blanket')
    if (rng.chance(0.35)) amenities.push('snacks')

    buses.push({
      id: `${A.id}~${B.id}~${date}~${i}`,
      operator,
      rating: Math.round(Math.min(4.9, Math.max(3.4, baseRating + rng.float(-0.25, 0.2))) * 10) / 10,
      reviews: rng.int(80, 4200),
      busType: type.name,
      layout: type.layout,
      ac: type.ac,
      electric: !!type.electric,
      departAt,
      arriveAt,
      durationMin,
      price,
      seatsLeft: rng.int(2, Math.round(total * 0.62)),
      totalSeats: total,
      amenities,
      boarding: points(A.id, A.name, departAt, 15, rng, 'b'),
      dropping: points(B.id, B.name, addMinutes(arriveAt, -30), 15, rng, 'd'),
      liveTracking: true,
      cancellation: rng.chance(0.55) ? 'Free cancellation up to 24 hours before departure' : '₹100 fee up to 12 hours before; 50% after',
      distanceKm: dist,
    })
  }
  return buses.sort((a, b) => a.departAt.localeCompare(b.departAt))
}

export function mockSearchBuses(from: string, to: string, date: string): BusSearchResult {
  const A = findCity(from)
  const B = findCity(to)
  if (!A || !B) throw new Error('Unknown city')
  return { from: { id: A.id, name: A.name }, to: { id: B.id, name: B.name }, date, buses: generateBuses(from, to, date) }
}

function buildDeck(id: Deck['id'], layout: BusLayout, basePrice: number): Deck {
  const seats: Seat[] = []
  if (layout === 'sleeper') {
    // 6 rows × [single | aisle | double double]
    let n = 1
    for (let row = 0; row < 6; row++) {
      for (const col of [0, 2, 3]) {
        const prefix = id === 'lower' ? 'L' : 'U'
        const price = basePrice + (id === 'lower' ? 100 : 0) + (col === 0 ? 50 : 0)
        seats.push({ id: `${prefix}${n}`, label: `${prefix}${n}`, deck: id, kind: 'sleeper', row, col, status: 'available', ladiesOnly: false, price })
        n++
      }
    }
    return { id, label: id === 'lower' ? 'Lower deck' : 'Upper deck', rows: 6, cols: 4, aisleCol: 1, seats }
  }
  const rows = layout === 'semi' ? 10 : 11
  let n = 1
  for (let row = 0; row < rows; row++) {
    const last = row === rows - 1
    for (const col of last ? [0, 1, 2, 3, 4] : [0, 1, 3, 4]) {
      seats.push({ id: `S${n}`, label: String(n), deck: id, kind: 'seater', row, col, status: 'available', ladiesOnly: false, price: basePrice + (row < 3 ? 30 : 0) })
      n++
    }
  }
  return { id, label: 'Seats', rows, cols: 5, aisleCol: 2, seats }
}

export function mockSeatLayout(busId: string): SeatLayout {
  const [from, to, date] = busId.split('~')
  // Look up by id — the list is sorted by departure, so positions don't match ids.
  const bus = generateBuses(from, to, date).find((b) => b.id === busId)
  if (!bus) throw new Error('Bus not found')
  const decks = bus.layout === 'sleeper' ? [buildDeck('lower', 'sleeper', bus.price), buildDeck('upper', 'sleeper', bus.price)] : [buildDeck('lower', bus.layout, bus.price)]
  const all = decks.flatMap((d) => d.seats)
  const rng = createRng(`seats|${busId}`)
  const availableIds = new Set(rng.sample(all, bus.seatsLeft).map((s) => s.id))
  for (const s of all) {
    s.status = availableIds.has(s.id) ? 'available' : 'booked'
    s.ladiesOnly = rng.chance(0.08)
  }
  return { busId, decks }
}

import { addMinutes, combineDateTime, dateOf, diffInDays, minutesBetween, parseISODate, todayISO } from '@/lib/dates'
import { haversineKm } from '@/lib/geo'
import { createRng } from '@/lib/random'
import { findAirport } from '@/services/locations/api'
import type { Airport } from '@/services/locations/types'
import type { Airline, CabinClass, FareDay, FareOption, Flight, FlightLeg, FlightSearchParams, FlightSearchResult, SpecialFare } from './types'

/**
 * Real carriers flying to/from India (schedules and fares here are mock data).
 * - `weight`: rough share of departures, so results feel like the real market.
 * - `hub`: foreign carriers connect through their home hub.
 * - `serves`: countries an airline flies to from India (undefined = everywhere we list).
 */
interface Carrier extends Airline {
  domestic: boolean
  intl: boolean
  weight: number
  hub?: string
  serves?: string[]
  maxKm?: number
}

const AIRLINES: Carrier[] = [
  { code: '6E', name: 'IndiGo', color: '#1b2a87', tone: 'low', domestic: true, intl: true, weight: 5, serves: ['United Arab Emirates', 'Singapore', 'Thailand', 'Maldives', 'Malaysia', 'Vietnam', 'Indonesia', 'United Kingdom'] },
  { code: 'AI', name: 'Air India', color: '#c8102e', tone: 'full', domestic: true, intl: true, weight: 3.5 },
  { code: 'IX', name: 'Air India Express', color: '#e25b1f', tone: 'low', domestic: true, intl: true, weight: 2, serves: ['United Arab Emirates', 'Singapore', 'Thailand', 'Malaysia'] },
  { code: 'QP', name: 'Akasa Air', color: '#f06a2a', tone: 'low', domestic: true, intl: true, weight: 1.5, serves: ['United Arab Emirates'] },
  { code: 'SG', name: 'SpiceJet', color: '#d7262c', tone: 'low', domestic: true, intl: true, weight: 1, serves: ['United Arab Emirates', 'Thailand'] },
  { code: '9I', name: 'Alliance Air', color: '#1f5aa6', tone: 'low', domestic: true, intl: false, weight: 0.6, maxKm: 900 },
  { code: 'EK', name: 'Emirates', color: '#b4141c', tone: 'full', domestic: false, intl: true, weight: 2.5, hub: 'DXB' },
  { code: 'QR', name: 'Qatar Airways', color: '#5c0632', tone: 'full', domestic: false, intl: true, weight: 2, hub: 'DOH' },
  { code: 'EY', name: 'Etihad Airways', color: '#9c7a46', tone: 'full', domestic: false, intl: true, weight: 1.2, hub: 'AUH' },
  { code: 'SQ', name: 'Singapore Airlines', color: '#1d2a5d', tone: 'full', domestic: false, intl: true, weight: 1.6, hub: 'SIN', serves: ['Singapore', 'Indonesia', 'Thailand', 'Vietnam', 'Malaysia', 'Japan', 'Australia', 'Maldives'] },
  { code: 'TG', name: 'Thai Airways', color: '#5b2c83', tone: 'full', domestic: false, intl: true, weight: 1.2, hub: 'BKK', serves: ['Thailand', 'Vietnam', 'Japan', 'Indonesia', 'Australia'] },
  { code: 'MH', name: 'Malaysia Airlines', color: '#0a2d6e', tone: 'full', domestic: false, intl: true, weight: 1, hub: 'KUL', serves: ['Malaysia', 'Indonesia', 'Vietnam', 'Thailand', 'Australia'] },
  { code: 'BA', name: 'British Airways', color: '#075aaa', tone: 'full', domestic: false, intl: true, weight: 1.2, hub: 'LHR', serves: ['United Kingdom', 'United States'] },
  { code: 'LH', name: 'Lufthansa', color: '#05164d', tone: 'full', domestic: false, intl: true, weight: 1, hub: 'FRA', serves: ['France', 'United Kingdom', 'United States'] },
]

function eligibleCarriers(A: Airport, B: Airport, intl: boolean, dist: number): Carrier[] {
  if (!intl) return AIRLINES.filter((a) => a.domestic && (!a.maxKm || dist <= a.maxKm))
  const foreign = A.country === 'India' ? B : A
  return AIRLINES.filter((a) => {
    if (!a.intl || (a.serves && !a.serves.includes(foreign.country))) return false
    // Gulf hubs to the Gulf itself would be a silly detour (e.g. Qatar via Doha to Dubai)
    if (a.hub && foreign.country === 'United Arab Emirates' && a.hub !== foreign.code) return false
    return true
  })
}

function pickWeighted(rng: ReturnType<typeof createRng>, list: Carrier[]): Carrier {
  const total = list.reduce((s, a) => s + a.weight, 0)
  let r = rng.next() * total
  for (const a of list) {
    r -= a.weight
    if (r <= 0) return a
  }
  return list[list.length - 1]
}

export const AIRLINE_LIST: Airline[] = AIRLINES.map(({ code, name, color, tone }) => ({ code, name, color, tone }))

const TZ: Record<string, number> = {
  India: 5.5,
  'United Arab Emirates': 4,
  Singapore: 8,
  Indonesia: 8,
  Thailand: 7,
  Maldives: 5,
  Malaysia: 8,
  Vietnam: 7,
  Japan: 9,
  France: 1,
  'United Kingdom': 0,
  'United States': -5,
  Australia: 11,
  Qatar: 3,
  Germany: 1,
}
const tz = (a: Airport) => TZ[a.country] ?? 0

const CABIN_MULT: Record<CabinClass, number> = { economy: 1, premium: 1.65, business: 3.1, first: 5.2 }
const CHECKIN: Record<CabinClass, [number, number]> = { economy: [15, 25], premium: [25, 30], business: [35, 40], first: [40, 50] }
const SPECIAL: Record<SpecialFare, number> = { regular: 1, student: 0.94, senior: 0.92, armed: 0.9 }

const DOMESTIC_HUBS = ['DEL', 'BOM', 'BLR', 'HYD', 'MAA', 'CCU']
const INTL_HUBS = ['DXB', 'SIN', 'DEL', 'BOM', 'KUL', 'BKK']

const round5 = (n: number) => Math.round(n / 5) * 5

function buildFares(price: number, cabin: CabinClass, intl: boolean, low: boolean, special: SpecialFare): FareOption[] {
  const [domBag, intlBag] = CHECKIN[cabin]
  const bag = intl ? intlBag : domBag
  const specialPerk = special === 'student' ? ['Student fare: +10 kg baggage'] : special === 'armed' ? ['Armed forces fare: free date change'] : []
  return [
    {
      id: 'saver',
      name: low ? 'Saver' : 'Classic',
      price,
      cabinBag: '7 kg',
      checkinBag: `${bag} kg`,
      change: intl ? 'Date change from ₹5,500' : 'Date change from ₹3,250',
      cancellation: intl ? 'Cancellation fee from ₹7,500' : 'Cancellation fee from ₹4,000',
      refundable: false,
      perks: specialPerk,
    },
    {
      id: 'flexi',
      name: 'Flexi',
      price: Math.round(price * 1.12 + 399),
      cabinBag: '7 kg',
      checkinBag: `${bag} kg`,
      change: 'Free date change, pay fare difference',
      cancellation: intl ? 'Cancellation fee ₹4,500' : 'Cancellation fee ₹2,250',
      refundable: false,
      perks: ['Free standard seat', 'Complimentary meal', ...specialPerk],
    },
    {
      id: 'super',
      name: 'Super Flexi',
      price: Math.round(price * 1.28 + 899),
      cabinBag: '10 kg',
      checkinBag: `${bag + 10} kg`,
      change: 'Unlimited free changes',
      cancellation: 'Free cancellation up to 24h before departure',
      refundable: true,
      perks: ['Priority check-in & boarding', 'Any seat, any row', 'Complimentary meal', ...specialPerk],
    },
  ]
}

export function generateFlights(from: string, to: string, date: string, cabin: CabinClass, special: SpecialFare = 'regular'): Flight[] {
  const A = findAirport(from)
  const B = findAirport(to)
  if (!A || !B || A.code === B.code) return []
  const intl = A.country !== 'India' || B.country !== 'India'
  const dist = haversineKm(A, B)
  const rng = createRng(`fl|${A.code}|${B.code}|${date}|${cabin}`)
  const eligible = eligibleCarriers(A, B, intl, dist)
  if (!eligible.length) return []
  const hubs = (intl ? INTL_HUBS : DOMESTIC_HUBS).filter((c) => c !== A.code && c !== B.code)

  const daysAhead = Math.max(0, diffInDays(date, todayISO()))
  const demand = daysAhead < 3 ? 1.42 : daysAhead < 7 ? 1.2 : daysAhead < 21 ? 1.03 : 0.93
  const dow = parseISODate(date).getDay()
  const weekend = dow === 5 || dow === 0 ? 1.08 : 1

  const count = rng.int(intl ? 8 : 10, intl ? 13 : 17)
  const flights: Flight[] = []
  const seen = new Set<string>()

  for (let i = 0; i < count; i++) {
    const airline = pickWeighted(rng, eligible)
    const departMin = round5(rng.int(5 * 60, 23 * 60 + 20))
    let vias: Airport[]
    if (airline.hub && airline.hub !== A.code && airline.hub !== B.code) {
      // Foreign carriers connect through their home hub
      vias = [findAirport(airline.hub)!]
    } else {
      let stops: number
      if (intl) stops = dist > 5000 ? (rng.chance(0.45) ? 0 : 1) : rng.chance(0.75) ? 0 : 1
      else stops = dist < 700 ? (rng.chance(0.92) ? 0 : 1) : rng.chance(0.74) ? 0 : 1
      // Indian carriers connect through Indian metros
      const own = (intl ? ['DEL', 'BOM', 'BLR', 'HYD'] : hubs).filter((c) => c !== A.code && c !== B.code)
      vias = rng.sample(own, Math.min(stops, own.length)).map((c) => findAirport(c)!).filter(Boolean)
    }
    const stops = vias.length
    const points = [A, ...vias, B]

    // Cursor in origin-local time; converted per airport for display.
    let cursor = combineDateTime(date, departMin)
    const legs: FlightLeg[] = []
    const layovers: Flight['layovers'] = []
    for (let j = 0; j < points.length - 1; j++) {
      const p = points[j]
      const q = points[j + 1]
      const d = haversineKm(p, q)
      const dur = round5((d / (d > 2500 ? 840 : 760)) * 60 + 28 + rng.int(-5, 12))
      const flightNo = `${airline.code} ${airline.tone === 'low' ? rng.int(1000, 6999) : rng.int(100, 999)}`
      const aircraft =
        !intl && d < 600
          ? rng.pick(['ATR 72-600', 'Airbus A320neo', 'Boeing 737-8'])
          : d > 3500
            ? rng.pick(['Boeing 787-9', 'Airbus A350-900', 'Boeing 777-300ER', 'Airbus A330-900neo'])
            : rng.pick(['Airbus A320neo', 'Airbus A321neo', 'Boeing 737-8'])
      legs.push({
        from: p.code,
        to: q.code,
        departAt: addMinutes(cursor, (tz(p) - tz(A)) * 60),
        arriveAt: addMinutes(cursor, dur + (tz(q) - tz(A)) * 60),
        flightNo,
        aircraft,
        durationMin: dur,
      })
      cursor = addMinutes(cursor, dur)
      if (j < points.length - 2) {
        const lay = round5(rng.int(55, stops === 2 ? 200 : 270))
        layovers.push({ airport: q.code, durationMin: lay })
        cursor = addMinutes(cursor, lay)
      }
    }

    const id = `${legs.map((l) => l.flightNo.replace(' ', '')).join('-')}-${date}`
    if (seen.has(id)) continue
    seen.add(id)

    const durationMin = minutesBetween(combineDateTime(date, departMin), cursor)
    const base = intl ? 5200 + dist * 4.3 : 2100 + dist * 3.4
    const tod =
      departMin < 420 ? 0.9 : (departMin < 600 || (departMin >= 1020 && departMin < 1260)) ? 1.12 : departMin >= 1320 ? 0.86 : 1
    const tone = airline.tone === 'full' ? 1.14 : 0.93
    const stopF = stops === 0 ? 1.06 : stops === 1 ? 0.88 : 0.8
    const price = Math.round(base * tod * tone * stopF * demand * weekend * CABIN_MULT[cabin] * SPECIAL[special] * rng.float(0.9, 1.14))

    flights.push({
      id,
      airline: { code: airline.code, name: airline.name, color: airline.color, tone: airline.tone },
      legs,
      layovers,
      stops: layovers.length,
      departAt: legs[0].departAt,
      arriveAt: legs[legs.length - 1].arriveAt,
      durationMin,
      price,
      fares: buildFares(price, cabin, intl, airline.tone === 'low', special),
      seatsLeft: rng.chance(0.28) ? rng.int(1, 7) : undefined,
      co2Kg: Math.round(dist * (stops ? 1.08 : 1) * 0.1 * (cabin === 'economy' ? 1 : cabin === 'premium' ? 1.5 : cabin === 'business' ? 2.9 : 4)),
      onTimePct: rng.int(74, 97),
    })
  }
  return flights.sort((a, b) => a.departAt.localeCompare(b.departAt))
}

export function mockSearchFlights(p: FlightSearchParams): FlightSearchResult {
  const from = findAirport(p.from)
  const to = findAirport(p.to)
  if (!from || !to) throw new Error('Unknown airport')
  return {
    from,
    to,
    international: from.country !== 'India' || to.country !== 'India',
    outbound: generateFlights(p.from, p.to, p.depart, p.cabin, p.fare),
    inbound: p.trip === 'round' && p.ret ? generateFlights(p.to, p.from, p.ret, p.cabin, p.fare) : null,
  }
}

export function mockFareCalendar(from: string, to: string, dates: string[], cabin: CabinClass): FareDay[] {
  const today = todayISO()
  return dates.map((date) => {
    if (date < today) return { date, price: null }
    const list = generateFlights(from, to, date, cabin)
    return { date, price: list.length ? Math.min(...list.map((f) => f.price)) : null }
  })
}

export function arrivalDayOffset(f: Flight): number {
  return diffInDays(dateOf(f.arriveAt), dateOf(f.departAt))
}

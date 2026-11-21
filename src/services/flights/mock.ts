import { addMinutes, combineDateTime, dateOf, diffInDays, minutesBetween, parseISODate, todayISO } from '@/lib/dates'
import { haversineKm } from '@/lib/geo'
import { createRng } from '@/lib/random'
import { findAirport } from '@/services/locations/api'
import type { Airport } from '@/services/locations/types'
import type { Airline, CabinClass, FareDay, FareOption, Flight, FlightLeg, FlightSearchParams, FlightSearchResult, SpecialFare } from './types'

/* Fictional carriers for the prototype. */
const AIRLINES: Array<Airline & { domestic: boolean; intl: boolean }> = [
  { code: 'VY', name: 'Vayu Air', color: '#14306b', tone: 'full', domestic: true, intl: true },
  { code: 'SF', name: 'Saffron Air', color: '#d9561a', tone: 'full', domestic: true, intl: true },
  { code: 'CJ', name: 'Coral Jet', color: '#e0465f', tone: 'low', domestic: true, intl: true },
  { code: 'MN', name: 'Monsoon Airways', color: '#0f7c8c', tone: 'low', domestic: true, intl: false },
  { code: 'IW', name: 'Indus Wings', color: '#2c7a4b', tone: 'low', domestic: true, intl: false },
  { code: 'GW', name: 'Gulfwing', color: '#7a5230', tone: 'full', domestic: false, intl: true },
  { code: 'LP', name: 'Lotus Pacific', color: '#6b3fa0', tone: 'full', domestic: false, intl: true },
  { code: 'NS', name: 'Northstar Airlines', color: '#1f2d4d', tone: 'full', domestic: false, intl: true },
]

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
  const eligible = AIRLINES.filter((a) => (intl ? a.intl : a.domestic))
  const hubs = (intl ? INTL_HUBS : DOMESTIC_HUBS).filter((c) => c !== A.code && c !== B.code)

  const daysAhead = Math.max(0, diffInDays(date, todayISO()))
  const demand = daysAhead < 3 ? 1.42 : daysAhead < 7 ? 1.2 : daysAhead < 21 ? 1.03 : 0.93
  const dow = parseISODate(date).getDay()
  const weekend = dow === 5 || dow === 0 ? 1.08 : 1

  const count = rng.int(intl ? 8 : 10, intl ? 13 : 17)
  const flights: Flight[] = []
  const seen = new Set<string>()

  for (let i = 0; i < count; i++) {
    const airline = rng.pick(eligible)
    let stops: number
    if (intl) stops = dist > 5000 ? (rng.chance(0.35) ? 0 : rng.chance(0.85) ? 1 : 2) : rng.chance(0.62) ? 0 : 1
    else stops = dist < 700 ? (rng.chance(0.92) ? 0 : 1) : rng.chance(0.74) ? 0 : 1
    stops = Math.min(stops, hubs.length)

    const departMin = round5(rng.int(5 * 60, 23 * 60 + 20))
    const vias = rng.sample(hubs, stops).map((c) => findAirport(c)!).filter(Boolean)
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

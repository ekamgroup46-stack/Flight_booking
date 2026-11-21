import { appConfig } from '@/config/app.config'
import { addDays, isValidISODate, todayISO } from '@/lib/dates'
import { findAirport } from '@/services/locations/api'
import type { CabinClass, FlightSearchParams, SpecialFare, TripType } from './types'

const CABINS: CabinClass[] = ['economy', 'premium', 'business', 'first']
const FARES: SpecialFare[] = ['regular', 'student', 'senior', 'armed']

export function defaultFlightSearch(): FlightSearchParams {
  return {
    trip: 'oneway',
    from: 'DEL',
    to: 'BOM',
    depart: addDays(todayISO(), 7),
    adults: 1,
    children: 0,
    infants: 0,
    cabin: 'economy',
    fare: 'regular',
  }
}

export function flightSearchToQuery(p: FlightSearchParams): Record<string, string> {
  const q: Record<string, string> = {
    trip: p.trip,
    from: p.from,
    to: p.to,
    depart: p.depart,
    adults: String(p.adults),
    cabin: p.cabin,
  }
  if (p.trip === 'round' && p.ret) q.ret = p.ret
  if (p.children) q.children = String(p.children)
  if (p.infants) q.infants = String(p.infants)
  if (p.fare !== 'regular') q.fare = p.fare
  return q
}

const int = (v: string | null, fallback: number) => {
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 ? n : fallback
}

export function validateFlightSearch(p: FlightSearchParams): string | null {
  if (!findAirport(p.from) || !findAirport(p.to)) return 'Choose valid airports.'
  if (p.from === p.to) return 'Origin and destination can’t be the same.'
  if (!isValidISODate(p.depart) || p.depart < todayISO()) return 'Pick a departure date from today onwards.'
  if (p.trip === 'round' && (!p.ret || !isValidISODate(p.ret) || p.ret < p.depart)) return 'Return must be on or after departure.'
  if (p.adults < 1) return 'At least one adult is required.'
  if (p.adults + p.children > appConfig.booking.maxPassengers) return `Up to ${appConfig.booking.maxPassengers} travellers per booking.`
  if (p.infants > p.adults) return 'Each infant must travel with an adult.'
  return null
}

/** Returns parsed params, or null when the URL doesn't describe a valid search. */
export function parseFlightSearch(sp: URLSearchParams): FlightSearchParams | null {
  const trip: TripType = sp.get('trip') === 'round' ? 'round' : 'oneway'
  const cabin = sp.get('cabin') as CabinClass
  const fare = sp.get('fare') as SpecialFare
  const params: FlightSearchParams = {
    trip,
    from: (sp.get('from') ?? '').toUpperCase(),
    to: (sp.get('to') ?? '').toUpperCase(),
    depart: sp.get('depart') ?? '',
    ret: trip === 'round' ? (sp.get('ret') ?? undefined) : undefined,
    adults: int(sp.get('adults'), 1),
    children: int(sp.get('children'), 0),
    infants: int(sp.get('infants'), 0),
    cabin: CABINS.includes(cabin) ? cabin : 'economy',
    fare: FARES.includes(fare) ? fare : 'regular',
  }
  return validateFlightSearch(params) ? null : params
}

import { minutesOfDay } from '@/lib/dates'
import { inWindows, type TimeWindowId } from '@/services/shared/timeWindows'
import type { Flight } from './types'

export type FlightSort = 'best' | 'cheapest' | 'fastest' | 'earliest'

export interface FlightFilters {
  stops: number[]
  airlines: string[]
  departWindows: TimeWindowId[]
  maxPrice: number | null
  refundableOnly: boolean
}

export const EMPTY_FLIGHT_FILTERS: FlightFilters = {
  stops: [],
  airlines: [],
  departWindows: [],
  maxPrice: null,
  refundableOnly: false,
}

export function countActiveFlightFilters(f: FlightFilters): number {
  return f.stops.length + f.airlines.length + f.departWindows.length + (f.maxPrice !== null ? 1 : 0) + (f.refundableOnly ? 1 : 0)
}

export function applyFlightFilters(list: Flight[], f: FlightFilters): Flight[] {
  return list.filter(
    (fl) =>
      (!f.stops.length || f.stops.includes(Math.min(fl.stops, 2))) &&
      (!f.airlines.length || f.airlines.includes(fl.airline.code)) &&
      inWindows(minutesOfDay(fl.departAt), f.departWindows) &&
      (f.maxPrice === null || fl.price <= f.maxPrice) &&
      (!f.refundableOnly || fl.fares.some((fa) => fa.refundable)),
  )
}

function bestScore(f: Flight, minPrice: number, minDur: number) {
  return f.price / minPrice + 0.65 * (f.durationMin / minDur) + f.stops * 0.18
}

export function sortFlights(list: Flight[], sort: FlightSort): Flight[] {
  if (!list.length) return list
  const minPrice = Math.min(...list.map((f) => f.price))
  const minDur = Math.min(...list.map((f) => f.durationMin))
  const sorted = [...list]
  switch (sort) {
    case 'cheapest':
      return sorted.sort((a, b) => a.price - b.price)
    case 'fastest':
      return sorted.sort((a, b) => a.durationMin - b.durationMin || a.price - b.price)
    case 'earliest':
      return sorted.sort((a, b) => a.departAt.localeCompare(b.departAt))
    default:
      return sorted.sort((a, b) => bestScore(a, minPrice, minDur) - bestScore(b, minPrice, minDur))
  }
}

export function flightSortSummary(list: Flight[]): Partial<Record<FlightSort, Flight>> {
  if (!list.length) return {}
  return {
    best: sortFlights(list, 'best')[0],
    cheapest: sortFlights(list, 'cheapest')[0],
    fastest: sortFlights(list, 'fastest')[0],
    earliest: sortFlights(list, 'earliest')[0],
  }
}

export function airlineFacets(list: Flight[]) {
  const map = new Map<string, { code: string; name: string; color: string; count: number; min: number }>()
  for (const f of list) {
    const cur = map.get(f.airline.code)
    if (cur) {
      cur.count++
      cur.min = Math.min(cur.min, f.price)
    } else map.set(f.airline.code, { code: f.airline.code, name: f.airline.name, color: f.airline.color, count: 1, min: f.price })
  }
  return [...map.values()].sort((a, b) => a.min - b.min)
}

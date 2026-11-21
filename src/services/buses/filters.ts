import { minutesOfDay } from '@/lib/dates'
import { inWindows, type TimeWindowId } from '@/services/shared/timeWindows'
import type { Bus, BusAmenity } from './types'

export type BusSort = 'departure' | 'price' | 'rating' | 'duration' | 'seats'
export type BusTypeFilter = 'ac' | 'nonac' | 'sleeper' | 'seater' | 'electric'

export interface BusFilters {
  types: BusTypeFilter[]
  departWindows: TimeWindowId[]
  operators: string[]
  amenities: BusAmenity[]
  minRating: number | null
  maxPrice: number | null
}

export const EMPTY_BUS_FILTERS: BusFilters = { types: [], departWindows: [], operators: [], amenities: [], minRating: null, maxPrice: null }

export const countActiveBusFilters = (f: BusFilters) =>
  f.types.length + f.departWindows.length + f.operators.length + f.amenities.length + (f.minRating ? 1 : 0) + (f.maxPrice ? 1 : 0)

function matchesType(b: Bus, t: BusTypeFilter) {
  switch (t) {
    case 'ac':
      return b.ac
    case 'nonac':
      return !b.ac
    case 'sleeper':
      return b.layout === 'sleeper'
    case 'seater':
      return b.layout !== 'sleeper'
    case 'electric':
      return b.electric
  }
}

export function applyBusFilters(list: Bus[], f: BusFilters): Bus[] {
  // Within the "type" group, AC/Non-AC and Sleeper/Seater each OR internally, AND across.
  const comfort = f.types.filter((t) => t === 'ac' || t === 'nonac')
  const berth = f.types.filter((t) => t === 'sleeper' || t === 'seater')
  return list.filter(
    (b) =>
      (!comfort.length || comfort.some((t) => matchesType(b, t))) &&
      (!berth.length || berth.some((t) => matchesType(b, t))) &&
      (!f.types.includes('electric') || b.electric) &&
      inWindows(minutesOfDay(b.departAt), f.departWindows) &&
      (!f.operators.length || f.operators.includes(b.operator)) &&
      f.amenities.every((a) => b.amenities.includes(a)) &&
      (!f.minRating || b.rating >= f.minRating) &&
      (!f.maxPrice || b.price <= f.maxPrice),
  )
}

export function sortBuses(list: Bus[], sort: BusSort): Bus[] {
  const out = [...list]
  switch (sort) {
    case 'price':
      return out.sort((a, b) => a.price - b.price)
    case 'rating':
      return out.sort((a, b) => b.rating - a.rating)
    case 'duration':
      return out.sort((a, b) => a.durationMin - b.durationMin)
    case 'seats':
      return out.sort((a, b) => b.seatsLeft - a.seatsLeft)
    default:
      return out.sort((a, b) => a.departAt.localeCompare(b.departAt))
  }
}

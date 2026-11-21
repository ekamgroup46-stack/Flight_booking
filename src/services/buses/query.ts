import { addDays, isValidISODate, todayISO } from '@/lib/dates'
import { findCity } from '@/services/locations/api'
import type { BusSearchParams } from './types'

export const defaultBusSearch = (): BusSearchParams => ({ from: 'bengaluru', to: 'goa', date: addDays(todayISO(), 1) })

export const busSearchToQuery = (p: BusSearchParams): Record<string, string> => ({ from: p.from, to: p.to, date: p.date })

export function validateBusSearch(p: BusSearchParams): string | null {
  if (!findCity(p.from) || !findCity(p.to)) return 'Choose valid cities.'
  if (p.from === p.to) return 'Origin and destination can’t be the same.'
  if (!isValidISODate(p.date) || p.date < todayISO()) return 'Pick a travel date from today onwards.'
  return null
}

export function parseBusSearch(sp: URLSearchParams): BusSearchParams | null {
  const p: BusSearchParams = { from: sp.get('from') ?? '', to: sp.get('to') ?? '', date: sp.get('date') ?? '' }
  return validateBusSearch(p) ? null : p
}

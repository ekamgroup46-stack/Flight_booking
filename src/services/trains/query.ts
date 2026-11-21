import { addDays, isValidISODate, todayISO } from '@/lib/dates'
import { findStation } from '@/services/locations/api'
import type { Quota, TrainClass, TrainSearchParams } from './types'

const CLASSES: Array<TrainClass | 'ALL'> = ['ALL', '1A', '2A', '3A', '3E', 'SL', 'CC', 'EC']
const QUOTAS: Quota[] = ['GN', 'TQ', 'LD', 'SS']

export function defaultTrainSearch(): TrainSearchParams {
  return { from: 'NDLS', to: 'JP', date: addDays(todayISO(), 3), cls: 'ALL', quota: 'GN', pax: 1 }
}

export function trainSearchToQuery(p: TrainSearchParams): Record<string, string> {
  const q: Record<string, string> = { from: p.from, to: p.to, date: p.date }
  if (p.cls !== 'ALL') q.cls = p.cls
  if (p.quota !== 'GN') q.quota = p.quota
  if (p.pax !== 1) q.pax = String(p.pax)
  return q
}

export function validateTrainSearch(p: TrainSearchParams): string | null {
  if (!findStation(p.from) || !findStation(p.to)) return 'Choose valid stations.'
  if (p.from === p.to) return 'Origin and destination can’t be the same.'
  if (!isValidISODate(p.date) || p.date < todayISO()) return 'Pick a journey date from today onwards.'
  if (p.date > addDays(todayISO(), 60)) return 'Train reservations open 60 days in advance.'
  if (p.quota === 'TQ' && p.date > addDays(todayISO(), 1)) return 'Tatkal opens one day before the journey.'
  if (p.pax < 1 || p.pax > 6) return 'Book 1–6 passengers per ticket.'
  return null
}

export function parseTrainSearch(sp: URLSearchParams): TrainSearchParams | null {
  const cls = (sp.get('cls') ?? 'ALL') as TrainClass | 'ALL'
  const quota = (sp.get('quota') ?? 'GN') as Quota
  const pax = Number(sp.get('pax') ?? 1)
  const params: TrainSearchParams = {
    from: (sp.get('from') ?? '').toUpperCase(),
    to: (sp.get('to') ?? '').toUpperCase(),
    date: sp.get('date') ?? '',
    cls: CLASSES.includes(cls) ? cls : 'ALL',
    quota: QUOTAS.includes(quota) ? quota : 'GN',
    pax: Number.isInteger(pax) ? pax : 1,
  }
  return validateTrainSearch(params) ? null : params
}

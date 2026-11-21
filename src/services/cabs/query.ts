import { addDays, isValidISODate, todayISO } from '@/lib/dates'
import { findPlace } from '@/services/locations/api'
import type { CabSearchParams, CabTrip, RentalPackage } from './types'

const TRIPS: CabTrip[] = ['airport', 'rental', 'oneway', 'round']
const PACKAGES: RentalPackage[] = ['2-20', '4-40', '8-80', '12-120']

export function defaultCabSearch(trip: CabTrip = 'airport'): CabSearchParams {
  const date = addDays(todayISO(), 1)
  switch (trip) {
    case 'rental':
      return { trip, from: 'loc-blr-indiranagar', date, time: '10:00', pkg: '4-40' }
    case 'oneway':
      return { trip, from: 'loc-bom-bandra', to: 'city-lonavala', date, time: '07:00' }
    case 'round':
      return { trip, from: 'loc-blr-koramangala', to: 'city-mysuru', date, time: '06:30', ret: addDays(date, 1) }
    default:
      return { trip: 'airport', from: 'apt-BLR', to: 'loc-blr-indiranagar', date, time: '09:30' }
  }
}

export function cabSearchToQuery(p: CabSearchParams): Record<string, string> {
  const q: Record<string, string> = { trip: p.trip, from: p.from, date: p.date, time: p.time }
  if (p.trip !== 'rental' && p.to) q.to = p.to
  if (p.trip === 'round' && p.ret) q.ret = p.ret
  if (p.trip === 'rental' && p.pkg) q.pkg = p.pkg
  return q
}

export function validateCabSearch(p: CabSearchParams): string | null {
  const from = findPlace(p.from)
  if (!from) return 'Choose a pickup location.'
  if (p.trip !== 'rental') {
    const to = findPlace(p.to)
    if (!to) return 'Choose a drop location.'
    if (to.id === from.id) return 'Pickup and drop can’t be the same.'
    if (p.trip === 'airport' && from.kind !== 'airport' && to.kind !== 'airport') return 'Airport transfers need an airport at pickup or drop.'
  }
  if (!isValidISODate(p.date) || p.date < todayISO()) return 'Pick a date from today onwards.'
  if (!/^\d{2}:\d{2}$/.test(p.time)) return 'Pick a pickup time.'
  if (p.trip === 'round' && (!p.ret || !isValidISODate(p.ret) || p.ret < p.date)) return 'Return must be on or after the pickup date.'
  return null
}

export function parseCabSearch(sp: URLSearchParams): CabSearchParams | null {
  const trip = sp.get('trip') as CabTrip
  const pkg = sp.get('pkg') as RentalPackage
  const p: CabSearchParams = {
    trip: TRIPS.includes(trip) ? trip : 'airport',
    from: sp.get('from') ?? '',
    to: sp.get('to') ?? undefined,
    date: sp.get('date') ?? '',
    time: sp.get('time') ?? '',
    ret: sp.get('ret') ?? undefined,
    pkg: PACKAGES.includes(pkg) ? pkg : '4-40',
  }
  return validateCabSearch(p) ? null : p
}

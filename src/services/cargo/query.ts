import { addDays, isValidISODate, todayISO } from '@/lib/dates'
import { findCity } from '@/services/locations/api'
import type { CargoSearchParams, ShipmentType } from './types'

const TYPES: ShipmentType[] = ['documents', 'parcel', 'pallet', 'truckload']

export const defaultCargoSearch = (): CargoSearchParams => ({
  from: 'mumbai',
  to: 'bengaluru',
  type: 'parcel',
  weight: 12,
  pieces: 1,
  date: addDays(todayISO(), 1),
})

export function cargoSearchToQuery(p: CargoSearchParams): Record<string, string> {
  const q: Record<string, string> = { from: p.from, to: p.to, type: p.type, weight: String(p.weight), pieces: String(p.pieces), date: p.date }
  if (p.l && p.w && p.h) Object.assign(q, { l: String(p.l), w: String(p.w), h: String(p.h) })
  return q
}

export const WEIGHT_LIMITS: Record<ShipmentType, [number, number]> = {
  documents: [0.1, 2],
  parcel: [0.5, 70],
  pallet: [50, 5000],
  truckload: [500, 15000],
}

export function validateCargoSearch(p: CargoSearchParams): string | null {
  if (!findCity(p.from) || !findCity(p.to)) return 'Choose pickup and delivery cities.'
  if (p.from === p.to) return 'For same-city deliveries, choose a different destination.'
  const [min, max] = WEIGHT_LIMITS[p.type]
  if (!(p.weight >= min && p.weight <= max)) return `${p.type === 'truckload' ? 'Truckloads' : 'This shipment type'} takes ${min}–${max} kg.`
  if (!(p.pieces >= 1 && p.pieces <= 200)) return 'Enter 1–200 pieces.'
  if (!isValidISODate(p.date) || p.date < todayISO()) return 'Pick a pickup date from today onwards.'
  return null
}

const num = (v: string | null) => (v === null || v === '' ? undefined : Number(v))

export function parseCargoSearch(sp: URLSearchParams): CargoSearchParams | null {
  const type = sp.get('type') as ShipmentType
  const p: CargoSearchParams = {
    from: sp.get('from') ?? '',
    to: sp.get('to') ?? '',
    type: TYPES.includes(type) ? type : 'parcel',
    weight: Number(sp.get('weight') ?? 0),
    pieces: Number(sp.get('pieces') ?? 1),
    l: num(sp.get('l')),
    w: num(sp.get('w')),
    h: num(sp.get('h')),
    date: sp.get('date') ?? '',
  }
  return validateCargoSearch(p) ? null : p
}

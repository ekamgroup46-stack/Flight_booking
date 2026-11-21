import { appConfig } from '@/config/app.config'
import { http } from '@/lib/api/http'
import { mockResponse } from '@/lib/api/mock'
import { AIRPORTS, CAB_PLACES, CITIES, STATIONS } from './data'
import type { Airport, City, LocationKind, LocationOption, Place, Station } from './types'

/* ---------- Synchronous lookups (used by mocks and to render saved ids) ---------- */

export const findAirport = (code?: string | null): Airport | undefined =>
  code ? AIRPORTS.find((a) => a.code === code.toUpperCase()) : undefined
export const findStation = (code?: string | null): Station | undefined =>
  code ? STATIONS.find((s) => s.code === code.toUpperCase()) : undefined
export const findCity = (id?: string | null): City | undefined => (id ? CITIES.find((c) => c.id === id) : undefined)
export const findPlace = (id?: string | null): Place | undefined => (id ? CAB_PLACES.find((p) => p.id === id) : undefined)

function toOption(kind: LocationKind, id: string): LocationOption | undefined {
  switch (kind) {
    case 'airport': {
      const a = findAirport(id)
      return a && { id: a.code, label: a.city, sublabel: `${a.name}${a.country !== 'India' ? `, ${a.country}` : ''}`, code: a.code, group: a.country === 'India' ? 'India' : 'International' }
    }
    case 'station': {
      const s = findStation(id)
      return s && { id: s.code, label: s.name, sublabel: s.city, code: s.code }
    }
    case 'busCity':
    case 'cargoCity': {
      const c = findCity(id)
      return c && { id: c.id, label: c.name, sublabel: kind === 'cargoCity' ? `${c.state} · ${c.pincode}` : c.state }
    }
    case 'cabPlace': {
      const p = findPlace(id)
      if (!p) return undefined
      const group = p.kind === 'airport' ? 'Airports' : p.kind === 'locality' ? 'Areas' : 'Cities'
      return { id: p.id, label: p.name, sublabel: p.kind === 'city' ? `${p.city} · Outstation` : p.city, code: p.code, group }
    }
  }
}

export function resolveLocation(kind: LocationKind, id?: string | null): LocationOption | undefined {
  return id ? toOption(kind, id) : undefined
}

function allIds(kind: LocationKind): string[] {
  switch (kind) {
    case 'airport':
      return AIRPORTS.map((a) => a.code)
    case 'station':
      return STATIONS.map((s) => s.code)
    case 'busCity':
    case 'cargoCity':
      return CITIES.map((c) => c.id)
    case 'cabPlace':
      return CAB_PLACES.map((p) => p.id)
  }
}

const POPULAR: Record<LocationKind, string[]> = {
  airport: ['DEL', 'BOM', 'BLR', 'HYD', 'MAA', 'CCU', 'GOX', 'DXB', 'SIN'],
  station: ['NDLS', 'CSMT', 'MAS', 'SBC', 'HWH', 'SC', 'JP', 'BSB'],
  busCity: ['bengaluru', 'hyderabad', 'chennai', 'mumbai', 'pune', 'goa', 'new-delhi', 'manali'],
  cabPlace: ['apt-BLR', 'apt-BOM', 'apt-DEL', 'loc-blr-indiranagar', 'loc-bom-bandra', 'loc-del-cp', 'city-mysuru', 'city-lonavala'],
  cargoCity: ['mumbai', 'new-delhi', 'bengaluru', 'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad'],
}

function scoreMatch(option: LocationOption, q: string): number {
  const query = q.trim().toLowerCase()
  const code = option.code?.toLowerCase() ?? ''
  const label = option.label.toLowerCase()
  const sub = option.sublabel.toLowerCase()
  if (code && code === query) return 100
  if (label.startsWith(query)) return 80
  if (code.startsWith(query)) return 70
  if (label.split(/[\s,(–-]+/).some((w) => w.startsWith(query))) return 60
  if (label.includes(query)) return 40
  if (sub.includes(query)) return 20
  return 0
}

function searchLocal(kind: LocationKind, query: string, limit = 8): LocationOption[] {
  if (!query.trim()) return POPULAR[kind].map((id) => toOption(kind, id)).filter((o): o is LocationOption => !!o)
  return allIds(kind)
    .map((id) => toOption(kind, id))
    .filter((o): o is LocationOption => !!o)
    .map((o) => ({ o, s: scoreMatch(o, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.o)
}

export const locationsApi = {
  search(kind: LocationKind, query: string, signal?: AbortSignal): Promise<LocationOption[]> {
    if (appConfig.api.useMocks) return mockResponse(() => searchLocal(kind, query), { latency: [90, 220], failureRate: 0, signal })
    return http.get<LocationOption[]>('/locations/search', { kind, q: query }, { signal })
  },
}

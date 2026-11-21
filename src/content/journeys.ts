import { withQuery } from '@/config/routes'
import { SERVICES, type ServiceId } from '@/config/services'
import { addDays, todayISO } from '@/lib/dates'

const inDays = (n: number) => addDays(todayISO(), n)

/* ---------- Popular routes (departure-board table) ---------- */
export interface PopularRoute {
  id: string
  service: ServiceId
  from: string
  to: string
  fromCode: string
  toCode: string
  duration: string
  frequency: string
  fromPrice: number
  query: Record<string, string>
}

export const POPULAR_ROUTES: PopularRoute[] = [
  { id: 'del-bom', service: 'flights', from: 'New Delhi', to: 'Mumbai', fromCode: 'DEL', toCode: 'BOM', duration: '2h 10m', frequency: '64 flights a day', fromPrice: 4890, query: { trip: 'oneway', from: 'DEL', to: 'BOM', depart: inDays(7), adults: '1', cabin: 'economy' } },
  { id: 'ndls-jp', service: 'trains', from: 'New Delhi', to: 'Jaipur', fromCode: 'NDLS', toCode: 'JP', duration: '4h 30m', frequency: '18 trains a day', fromPrice: 545, query: { from: 'NDLS', to: 'JP', date: inDays(5) } },
  { id: 'blr-goa', service: 'buses', from: 'Bengaluru', to: 'Goa', fromCode: 'BLR', toCode: 'GOA', duration: '11h 20m', frequency: '40+ buses nightly', fromPrice: 1099, query: { from: 'bengaluru', to: 'goa', date: inDays(3) } },
  { id: 'bom-pune', service: 'cabs', from: 'Mumbai', to: 'Pune', fromCode: 'BOM', toCode: 'PNQ', duration: '3h 10m', frequency: 'On demand', fromPrice: 2499, query: { trip: 'oneway', from: 'loc-bom-bandra', to: 'city-pune', date: inDays(2), time: '08:00' } },
  { id: 'hyd-dxb', service: 'flights', from: 'Hyderabad', to: 'Dubai', fromCode: 'HYD', toCode: 'DXB', duration: '3h 55m', frequency: '11 flights a day', fromPrice: 12400, query: { trip: 'oneway', from: 'HYD', to: 'DXB', depart: inDays(16), adults: '1', cabin: 'economy' } },
  { id: 'bom-blr-cargo', service: 'cargo', from: 'Mumbai', to: 'Bengaluru', fromCode: 'BOM', toCode: 'BLR', duration: '2 – 3 days', frequency: 'Daily line-haul', fromPrice: 449, query: { from: 'mumbai', to: 'bengaluru', type: 'parcel', weight: '10', pieces: '1', date: inDays(1) } },
  { id: 'sbc-mys', service: 'trains', from: 'Bengaluru', to: 'Mysuru', fromCode: 'SBC', toCode: 'MYS', duration: '2h 05m', frequency: '22 trains a day', fromPrice: 185, query: { from: 'SBC', to: 'MYS', date: inDays(4) } },
  { id: 'maa-pondy', service: 'cabs', from: 'Chennai', to: 'Puducherry', fromCode: 'MAA', toCode: 'PNY', duration: '3h 00m', frequency: 'On demand', fromPrice: 2799, query: { trip: 'oneway', from: 'loc-maa-adyar', to: 'city-puducherry', date: inDays(6), time: '07:00' } },
  { id: 'del-manali', service: 'buses', from: 'New Delhi', to: 'Manali', fromCode: 'DEL', toCode: 'MNL', duration: '12h 40m', frequency: '30+ buses nightly', fromPrice: 1299, query: { from: 'new-delhi', to: 'manali', date: inDays(8) } },
  { id: 'blr-sin', service: 'flights', from: 'Bengaluru', to: 'Singapore', fromCode: 'BLR', toCode: 'SIN', duration: '4h 25m', frequency: '9 flights a day', fromPrice: 14100, query: { trip: 'oneway', from: 'BLR', to: 'SIN', depart: inDays(30), adults: '1', cabin: 'economy' } },
]

export const routeLink = (r: { service: ServiceId; query: Record<string, string> }) => withQuery(SERVICES[r.service].resultsPath, r.query)

/* ---------- Hero departure board ---------- */
export interface Departure {
  time: string
  service: ServiceId
  route: string
  status: string
  tone: 'ok' | 'warn' | 'info'
}

export const DEPARTURES: Departure[] = [
  { time: '06:40', service: 'flights', route: 'DEL → BOM', status: 'Boarding', tone: 'ok' },
  { time: '07:15', service: 'trains', route: 'NDLS → JP', status: 'Platform 4', tone: 'info' },
  { time: '07:30', service: 'cabs', route: 'BLR T1 → MG RD', status: '4 min away', tone: 'ok' },
  { time: '08:05', service: 'cargo', route: 'BOM → BLR', status: 'In transit', tone: 'info' },
  { time: '08:20', service: 'buses', route: 'HYD → VJA', status: '12 seats', tone: 'ok' },
  { time: '09:10', service: 'flights', route: 'BLR → GOX', status: 'On time', tone: 'ok' },
  { time: '09:45', service: 'trains', route: 'MAS → SBC', status: 'RAC 4', tone: 'warn' },
  { time: '10:30', service: 'flights', route: 'HYD → DXB', status: 'Gate 21', tone: 'info' },
  { time: '11:00', service: 'cabs', route: 'BOM → PUNE', status: 'Driver set', tone: 'ok' },
  { time: '12:25', service: 'buses', route: 'PUNE → GOA', status: '3 berths', tone: 'warn' },
  { time: '13:40', service: 'cargo', route: 'DEL → CCU', status: 'Picked up', tone: 'ok' },
  { time: '14:55', service: 'trains', route: 'CSMT → MAO', status: 'On time', tone: 'ok' },
]

/* ---------- Editorial experiences ---------- */
export interface Experience {
  id: string
  title: string
  kicker: string
  blurb: string
  image: string
  service: ServiceId
  query: Record<string, string>
}

export const EXPERIENCES: Experience[] = [
  { id: 'rail', title: 'Slow travel by heritage rail', kicker: 'Trains · 6 min read', blurb: 'Window seats, chai at every halt and mountain lines that take the long way round — on purpose.', image: '/images/experiences/heritage-rail.webp', service: 'trains', query: { from: 'MAS', to: 'CBE', date: inDays(12) } },
  { id: 'houseboat', title: 'Two nights on the backwaters', kicker: 'Flights + cabs · 4 min read', blurb: 'Fly into Kochi, ride ninety minutes south, and let the houseboat do the rest.', image: '/images/experiences/houseboat.webp', service: 'flights', query: { trip: 'oneway', from: 'BLR', to: 'COK', depart: inDays(21), adults: '2', cabin: 'economy' } },
  { id: 'road', title: 'Road trips, reimagined', kicker: 'Outstation cabs · 5 min read', blurb: 'One-way cabs mean no driving back. Pick a car, pick a playlist, pick a direction.', image: '/images/experiences/road-trip.webp', service: 'cabs', query: { trip: 'oneway', from: 'loc-blr-koramangala', to: 'city-coorg', date: inDays(5), time: '06:00' } },
  { id: 'monsoon', title: 'The city in the monsoon', kicker: 'Hourly rentals · 3 min read', blurb: 'Eight hours, eighty kilometres and a driver who knows where the best cutting chai is.', image: '/images/experiences/monsoon-city.webp', service: 'cabs', query: { trip: 'rental', from: 'loc-bom-colaba', date: inDays(2), time: '10:00', pkg: '8-80' } },
  { id: 'temples', title: 'Temple towns of the south', kicker: 'Trains · 7 min read', blurb: 'Gopurams at dusk, filter coffee at dawn — an overnight sleeper connects them all.', image: '/images/experiences/temple-town.webp', service: 'trains', query: { from: 'MAS', to: 'MDU', date: inDays(9) } },
]

export interface TrendingItem {
  name: string
  change: number
}

export const TRENDING: TrendingItem[] = [
  { name: 'Goa', change: 18 },
  { name: 'Manali', change: 24 },
  { name: 'Dubai', change: 12 },
  { name: 'Udaipur', change: 9 },
  { name: 'Bali', change: 15 },
  { name: 'Pondicherry', change: 21 },
  { name: 'Srinagar', change: 31 },
  { name: 'Singapore', change: 7 },
  { name: 'Hampi', change: 14 },
  { name: 'Varanasi', change: 11 },
]

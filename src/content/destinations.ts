import { withQuery } from '@/config/routes'
import { SERVICES, type ServiceId } from '@/config/services'
import { addDays, todayISO } from '@/lib/dates'

/* Marketing content. Prices are "starting from" placeholders until the
   pricing service feeds this section. Kept typed so it can move to a CMS. */

export type DestinationCategory = 'beach' | 'mountain' | 'heritage' | 'international'

export interface Destination {
  id: string
  name: string
  region: string
  category: DestinationCategory
  image: string
  coords: string
  tagline: string
  fromPrice: number
  via: ServiceId
  modes: ServiceId[]
  season: string
  search: { service: ServiceId; query: Record<string, string> }
}

const inDays = (n: number) => addDays(todayISO(), n)

export const DESTINATIONS: Destination[] = [
  { id: 'goa', name: 'Goa', region: 'Konkan coast', category: 'beach', image: '/images/destinations/goa.webp', coords: '15.49° N · 73.83° E', tagline: 'Palm-lined beaches and Portuguese lanes', fromPrice: 2899, via: 'flights', modes: ['flights', 'trains', 'buses'], season: 'Oct – Mar', search: { service: 'flights', query: { trip: 'oneway', from: 'BLR', to: 'GOX', depart: inDays(14), adults: '1', cabin: 'economy' } } },
  { id: 'jaipur', name: 'Jaipur', region: 'Rajasthan', category: 'heritage', image: '/images/destinations/jaipur.webp', coords: '26.91° N · 75.79° E', tagline: 'The pink city at golden hour', fromPrice: 545, via: 'trains', modes: ['trains', 'flights', 'buses', 'cabs'], season: 'Oct – Mar', search: { service: 'trains', query: { from: 'NDLS', to: 'JP', date: inDays(10) } } },
  { id: 'kerala', name: 'Alappuzha', region: 'Kerala', category: 'beach', image: '/images/destinations/kerala.webp', coords: '9.50° N · 76.34° E', tagline: 'Backwaters, by houseboat', fromPrice: 3190, via: 'flights', modes: ['flights', 'trains'], season: 'Sep – Mar', search: { service: 'flights', query: { trip: 'oneway', from: 'BLR', to: 'COK', depart: inDays(21), adults: '1', cabin: 'economy' } } },
  { id: 'ladakh', name: 'Leh', region: 'Ladakh', category: 'mountain', image: '/images/destinations/ladakh.webp', coords: '34.15° N · 77.58° E', tagline: 'High passes, higher skies', fromPrice: 5480, via: 'flights', modes: ['flights', 'cabs'], season: 'May – Sep', search: { service: 'flights', query: { trip: 'oneway', from: 'DEL', to: 'IXL', depart: inDays(30), adults: '1', cabin: 'economy' } } },
  { id: 'kashmir', name: 'Srinagar', region: 'Kashmir', category: 'mountain', image: '/images/destinations/kashmir.webp', coords: '34.08° N · 74.80° E', tagline: 'Shikaras across Dal Lake', fromPrice: 4620, via: 'flights', modes: ['flights', 'cabs'], season: 'Apr – Oct', search: { service: 'flights', query: { trip: 'oneway', from: 'DEL', to: 'SXR', depart: inDays(20), adults: '1', cabin: 'economy' } } },
  { id: 'varanasi', name: 'Varanasi', region: 'Uttar Pradesh', category: 'heritage', image: '/images/destinations/varanasi.webp', coords: '25.32° N · 82.97° E', tagline: 'Dawn boats along the ghats', fromPrice: 1140, via: 'trains', modes: ['trains', 'flights'], season: 'Oct – Mar', search: { service: 'trains', query: { from: 'NDLS', to: 'BSB', date: inDays(12) } } },
  { id: 'agra', name: 'Agra', region: 'Uttar Pradesh', category: 'heritage', image: '/images/destinations/agra.webp', coords: '27.18° N · 78.04° E', tagline: 'The Taj, framed in sandstone', fromPrice: 540, via: 'trains', modes: ['trains', 'cabs', 'buses'], season: 'Oct – Mar', search: { service: 'trains', query: { from: 'NDLS', to: 'AGC', date: inDays(7) } } },
  { id: 'manali', name: 'Manali', region: 'Himachal Pradesh', category: 'mountain', image: '/images/destinations/manali.webp', coords: '32.24° N · 77.19° E', tagline: 'Pine valleys and river roads', fromPrice: 1299, via: 'buses', modes: ['buses', 'cabs', 'flights'], season: 'Mar – Jun', search: { service: 'buses', query: { from: 'new-delhi', to: 'manali', date: inDays(9) } } },
  { id: 'andaman', name: 'Port Blair', region: 'Andaman Islands', category: 'beach', image: '/images/destinations/andaman.webp', coords: '11.62° N · 92.73° E', tagline: 'Glass-clear water, white sand', fromPrice: 6140, via: 'flights', modes: ['flights'], season: 'Nov – Apr', search: { service: 'flights', query: { trip: 'oneway', from: 'MAA', to: 'IXZ', depart: inDays(25), adults: '1', cabin: 'economy' } } },
  { id: 'dubai', name: 'Dubai', region: 'United Arab Emirates', category: 'international', image: '/images/destinations/dubai.webp', coords: '25.20° N · 55.27° E', tagline: 'Skyline sundowners, desert dawns', fromPrice: 11890, via: 'flights', modes: ['flights'], season: 'Nov – Mar', search: { service: 'flights', query: { trip: 'oneway', from: 'BOM', to: 'DXB', depart: inDays(18), adults: '1', cabin: 'economy' } } },
  { id: 'singapore', name: 'Singapore', region: 'Singapore', category: 'international', image: '/images/destinations/singapore.webp', coords: '1.35° N · 103.82° E', tagline: 'Gardens, hawkers, harbour lights', fromPrice: 13450, via: 'flights', modes: ['flights'], season: 'All year', search: { service: 'flights', query: { trip: 'oneway', from: 'MAA', to: 'SIN', depart: inDays(24), adults: '1', cabin: 'economy' } } },
  { id: 'bali', name: 'Bali', region: 'Indonesia', category: 'international', image: '/images/destinations/bali.webp', coords: '8.34° S · 115.09° E', tagline: 'Temples that float on lakes', fromPrice: 19800, via: 'flights', modes: ['flights'], season: 'Apr – Oct', search: { service: 'flights', query: { trip: 'oneway', from: 'BLR', to: 'DPS', depart: inDays(35), adults: '1', cabin: 'economy' } } },
  { id: 'maldives', name: 'Maldives', region: 'Malé atoll', category: 'beach', image: '/images/destinations/maldives.webp', coords: '4.18° N · 73.51° E', tagline: 'Overwater mornings', fromPrice: 14700, via: 'flights', modes: ['flights'], season: 'Nov – Apr', search: { service: 'flights', query: { trip: 'oneway', from: 'COK', to: 'MLE', depart: inDays(28), adults: '1', cabin: 'economy' } } },
  { id: 'shimla', name: 'Shimla', region: 'Himachal Pradesh', category: 'mountain', image: '/images/destinations/shimla.webp', coords: '31.10° N · 77.17° E', tagline: 'Toy-train town in the clouds', fromPrice: 899, via: 'buses', modes: ['buses', 'trains', 'cabs'], season: 'Mar – Jun · Dec', search: { service: 'buses', query: { from: 'new-delhi', to: 'shimla', date: inDays(6) } } },
]

export const CATEGORY_LABEL: Record<DestinationCategory | 'all', string> = {
  all: 'All',
  beach: 'Coast & islands',
  mountain: 'Mountains',
  heritage: 'Heritage',
  international: 'International',
}

export function destinationLink(d: Destination): string {
  return withQuery(SERVICES[d.search.service].resultsPath, d.search.query)
}

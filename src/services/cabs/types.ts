import type { Place } from '@/services/locations/types'

export type CabTrip = 'airport' | 'rental' | 'oneway' | 'round'
export type RentalPackage = '2-20' | '4-40' | '8-80' | '12-120'
export type CabCategory = 'mini' | 'sedan' | 'ev' | 'suv' | 'suvplus' | 'premium' | 'tempo'

export interface CabSearchParams {
  trip: CabTrip
  from: string
  to?: string
  date: string
  time: string
  ret?: string
  pkg?: RentalPackage
}

export interface CabOption {
  id: string
  category: CabCategory
  name: string
  model: string
  /** Representative photo of the category */
  image: string
  seats: number
  bags: number
  fuel: 'Petrol' | 'CNG' | 'Diesel' | 'Electric'
  price: number
  strikePrice?: number
  etaMin?: number
  inclusions: string[]
  exclusions: string[]
  extraKm: number
  extraHour?: number
  rating: number
  cancellation: string
  tag?: string
}

export interface CabQuoteResult {
  trip: CabTrip
  from: Place
  to: Place | null
  distanceKm: number
  durationMin: number
  days: number
  tolls: number
  pkg?: RentalPackage
  options: CabOption[]
}

export const TRIP_LABEL: Record<CabTrip, string> = {
  airport: 'Airport transfer',
  rental: 'Hourly rental',
  oneway: 'Outstation · One way',
  round: 'Outstation · Round trip',
}

export const PACKAGE_LABEL: Record<RentalPackage, string> = {
  '2-20': '2 hrs · 20 km',
  '4-40': '4 hrs · 40 km',
  '8-80': '8 hrs · 80 km',
  '12-120': '12 hrs · 120 km',
}

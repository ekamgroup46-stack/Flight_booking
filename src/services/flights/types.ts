import type { Airport } from '@/services/locations/types'

export type CabinClass = 'economy' | 'premium' | 'business' | 'first'
export type TripType = 'oneway' | 'round'
export type SpecialFare = 'regular' | 'student' | 'senior' | 'armed'

export interface FlightSearchParams {
  trip: TripType
  from: string
  to: string
  depart: string
  ret?: string
  adults: number
  children: number
  infants: number
  cabin: CabinClass
  fare: SpecialFare
}

export interface Airline {
  code: string
  name: string
  color: string
  tone: 'full' | 'low'
}

export interface FlightLeg {
  from: string
  to: string
  departAt: string
  arriveAt: string
  flightNo: string
  aircraft: string
  durationMin: number
}

export type FareId = 'saver' | 'flexi' | 'super'

export interface FareOption {
  id: FareId
  name: string
  price: number
  cabinBag: string
  checkinBag: string
  change: string
  cancellation: string
  refundable: boolean
  perks: string[]
}

export interface Flight {
  id: string
  airline: Airline
  legs: FlightLeg[]
  layovers: { airport: string; durationMin: number }[]
  stops: number
  departAt: string
  arriveAt: string
  durationMin: number
  /** Lowest fare per adult. */
  price: number
  fares: FareOption[]
  seatsLeft?: number
  co2Kg: number
  onTimePct: number
}

export interface FlightSearchResult {
  from: Airport
  to: Airport
  international: boolean
  outbound: Flight[]
  inbound: Flight[] | null
}

export interface FareDay {
  date: string
  price: number | null
}

export const CABIN_LABEL: Record<CabinClass, string> = {
  economy: 'Economy',
  premium: 'Premium Economy',
  business: 'Business',
  first: 'First',
}

export const SPECIAL_FARE_LABEL: Record<SpecialFare, string> = {
  regular: 'Regular',
  student: 'Student',
  senior: 'Senior citizen',
  armed: 'Armed forces',
}

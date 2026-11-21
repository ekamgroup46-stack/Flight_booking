export interface BusSearchParams {
  from: string
  to: string
  date: string
}

export type BusLayout = 'sleeper' | 'semi' | 'seater'
export type BusAmenity = 'wifi' | 'charging' | 'water' | 'blanket' | 'snacks' | 'light' | 'cctv' | 'tracking'

export interface BusPoint {
  id: string
  name: string
  at: string
}

export interface Bus {
  id: string
  operator: string
  rating: number
  reviews: number
  busType: string
  layout: BusLayout
  ac: boolean
  electric: boolean
  departAt: string
  arriveAt: string
  durationMin: number
  /** Lowest seat price. */
  price: number
  seatsLeft: number
  totalSeats: number
  amenities: BusAmenity[]
  boarding: BusPoint[]
  dropping: BusPoint[]
  liveTracking: boolean
  cancellation: string
  distanceKm: number
}

export interface BusSearchResult {
  from: { id: string; name: string }
  to: { id: string; name: string }
  date: string
  buses: Bus[]
}

export interface Seat {
  id: string
  label: string
  deck: 'lower' | 'upper'
  kind: 'sleeper' | 'seater'
  row: number
  col: number
  status: 'available' | 'booked'
  ladiesOnly: boolean
  price: number
}

export interface Deck {
  id: 'lower' | 'upper'
  label: string
  rows: number
  cols: number
  aisleCol: number
  seats: Seat[]
}

export interface SeatLayout {
  busId: string
  decks: Deck[]
}

export const AMENITY_LABEL: Record<BusAmenity, string> = {
  wifi: 'Wi-Fi',
  charging: 'Charging point',
  water: 'Water bottle',
  blanket: 'Blanket',
  snacks: 'Snacks',
  light: 'Reading light',
  cctv: 'CCTV',
  tracking: 'Live tracking',
}

import type { City } from '@/services/locations/types'

export type ShipmentType = 'documents' | 'parcel' | 'pallet' | 'truckload'
export type CargoMode = 'express' | 'air' | 'surface' | 'economy' | 'rail' | 'ptl' | 'ftl'

export interface CargoSearchParams {
  from: string
  to: string
  type: ShipmentType
  weight: number
  pieces: number
  l?: number
  w?: number
  h?: number
  date: string
}

export interface CargoQuote {
  id: string
  mode: CargoMode
  name: string
  tagline: string
  transitDays: [number, number]
  deliveryBy: string
  price: number
  co2Kg: number
  features: string[]
  badge?: 'Fastest' | 'Best value' | 'Greenest'
  vehicle?: string
}

export interface CargoQuoteResult {
  from: City
  to: City
  distanceKm: number
  actualKg: number
  volumetricKg: number
  chargeableKg: number
  quotes: CargoQuote[]
  pickupSlots: string[]
}

export type ShipmentStage = 'booked' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered'

export interface TrackingEvent {
  at: string
  title: string
  location: string
  detail?: string
  state: 'done' | 'current' | 'upcoming'
}

export interface Shipment {
  trackingId: string
  from: string
  to: string
  service: string
  stage: ShipmentStage
  eta: string
  weightKg: number
  pieces: number
  events: TrackingEvent[]
  progress: number
}

export const SHIPMENT_TYPE_LABEL: Record<ShipmentType, string> = {
  documents: 'Documents',
  parcel: 'Parcel',
  pallet: 'Pallets / bulk',
  truckload: 'Full truckload',
}

export const STAGE_LABEL: Record<ShipmentStage, string> = {
  booked: 'Pickup scheduled',
  picked_up: 'Picked up',
  in_transit: 'In transit',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
}

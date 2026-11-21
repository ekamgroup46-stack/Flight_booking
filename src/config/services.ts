import type { LucideIcon } from 'lucide-react'
import { Bus, CarTaxiFront, Package, Plane, TrainFront } from 'lucide-react'

/** The single fixed backdrop photograph used across the whole site (see components/layout/Backdrop). */
export const HERO_IMAGE = '/images/hero/home.webp'

export type ServiceId = 'flights' | 'trains' | 'buses' | 'cabs' | 'cargo'

export interface ServiceMeta {
  id: ServiceId
  label: string
  noun: string
  /** One-letter line code used in roundels and the departure board. */
  line: string
  path: string
  resultsPath: string
  icon: LucideIcon
  /** Raw hex of the service line (for SVG / inline use). Prefer CSS `var(--accent)`. */
  color: string
  ink: string
  blurb: string
  heroTitle: [string, string]
}

export const SERVICES: Record<ServiceId, ServiceMeta> = {
  flights: {
    id: 'flights',
    label: 'Flights',
    noun: 'flight',
    line: 'F',
    path: '/flights',
    resultsPath: '/flights/results',
    icon: Plane,
    color: '#2f6bff',
    ink: '#ffffff',
    blurb: 'Domestic & international fares across 40+ airlines',
    heroTitle: ['Above the clouds,', 'below the usual fares.'],
  },
  trains: {
    id: 'trains',
    label: 'Trains',
    noun: 'train',
    line: 'T',
    path: '/trains',
    resultsPath: '/trains/results',
    icon: TrainFront,
    color: '#e4473b',
    ink: '#ffffff',
    blurb: 'Live berth availability, every class, every quota',
    heroTitle: ['Window seat,', 'whole country.'],
  },
  buses: {
    id: 'buses',
    label: 'Buses',
    noun: 'bus',
    line: 'B',
    path: '/buses',
    resultsPath: '/buses/results',
    icon: Bus,
    color: '#0e9f6e',
    ink: '#ffffff',
    blurb: 'Pick your exact seat on 2,300+ verified operators',
    heroTitle: ['Sleep through the miles,', 'wake up somewhere new.'],
  },
  cabs: {
    id: 'cabs',
    label: 'Cabs',
    noun: 'cab',
    line: 'C',
    path: '/cabs',
    resultsPath: '/cabs/results',
    icon: CarTaxiFront,
    color: '#ffc21a',
    ink: '#1d1600',
    blurb: 'Airport transfers, hourly rentals & outstation trips',
    heroTitle: ['Door to door,', 'on your clock.'],
  },
  cargo: {
    id: 'cargo',
    label: 'Cargo',
    noun: 'shipment',
    line: 'X',
    path: '/cargo',
    resultsPath: '/cargo/quotes',
    icon: Package,
    color: '#7b5cff',
    ink: '#ffffff',
    blurb: 'Parcels to full truckloads, tracked end to end',
    heroTitle: ['From one box', 'to a full truckload.'],
  },
}

export const SERVICE_ORDER: ServiceId[] = ['flights', 'trains', 'buses', 'cabs', 'cargo']

export function isServiceId(value: unknown): value is ServiceId {
  return typeof value === 'string' && value in SERVICES
}

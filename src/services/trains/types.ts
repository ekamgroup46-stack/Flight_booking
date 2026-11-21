import type { Station } from '@/services/locations/types'

export type TrainClass = '1A' | '2A' | '3A' | '3E' | 'SL' | 'CC' | 'EC'
export type Quota = 'GN' | 'TQ' | 'LD' | 'SS'
export type TrainType = 'rajdhani' | 'shatabdi' | 'vande' | 'duronto' | 'superfast' | 'express' | 'humsafar' | 'garib'
export type AvailabilityStatus = 'AVL' | 'RAC' | 'WL' | 'REGRET'

export interface TrainSearchParams {
  from: string
  to: string
  date: string
  cls: TrainClass | 'ALL'
  quota: Quota
  pax: number
}

export interface ClassAvailability {
  cls: TrainClass
  fare: number
  status: AvailabilityStatus
  count: number
  /** Probability (0–100) a waitlisted ticket confirms. */
  confirmChance?: number
}

export interface RouteStop {
  code: string
  name: string
  arrive: string | null
  depart: string | null
  day: number
  haltMin: number
  distanceKm: number
}

export interface Train {
  id: string
  number: string
  name: string
  type: TrainType
  from: Station
  to: Station
  departAt: string
  arriveAt: string
  durationMin: number
  distanceKm: number
  /** Mon → Sun */
  runsOn: boolean[]
  classes: ClassAvailability[]
  pantry: boolean
  rating: number
  stops: RouteStop[]
}

export interface TrainSearchResult {
  from: Station
  to: Station
  date: string
  trains: Train[]
}

export const CLASS_INFO: Record<TrainClass, { label: string; description: string; ac: boolean; sleeper: boolean }> = {
  '1A': { label: 'First AC', description: 'Private cabins of 2 or 4 berths, linen and meals on premium trains.', ac: true, sleeper: true },
  '2A': { label: 'AC 2 Tier', description: 'Open bays of 4 + 2 side berths with curtains and reading lights.', ac: true, sleeper: true },
  '3A': { label: 'AC 3 Tier', description: 'The popular choice: 6 + 2 berths per bay, fully air-conditioned.', ac: true, sleeper: true },
  '3E': { label: 'AC 3 Economy', description: 'Slimmer 3-tier AC berths at a lower fare.', ac: true, sleeper: true },
  SL: { label: 'Sleeper', description: 'Non-AC 3-tier berths with fans and open windows.', ac: false, sleeper: true },
  CC: { label: 'AC Chair Car', description: 'Reclining 3 + 2 seats for daytime intercity runs.', ac: true, sleeper: false },
  EC: { label: 'Executive Chair', description: 'Wide 2 + 2 recliners, extra legroom, priority catering.', ac: true, sleeper: false },
}

export const QUOTA_LABEL: Record<Quota, string> = {
  GN: 'General',
  TQ: 'Tatkal',
  LD: 'Ladies',
  SS: 'Senior citizen',
}

export const TRAIN_TYPE_LABEL: Record<TrainType, string> = {
  rajdhani: 'Rajdhani',
  shatabdi: 'Shatabdi',
  vande: 'Vande Bharat',
  duronto: 'Duronto',
  superfast: 'Superfast',
  express: 'Express',
  humsafar: 'Humsafar',
  garib: 'Garib Rath',
}

export const BERTH_PREFERENCES = ['No preference', 'Lower', 'Middle', 'Upper', 'Side lower', 'Side upper', 'Window'] as const

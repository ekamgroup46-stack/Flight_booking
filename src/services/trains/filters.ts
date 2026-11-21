import { minutesOfDay } from '@/lib/dates'
import { inWindows, type TimeWindowId } from '@/services/shared/timeWindows'
import type { Train, TrainClass, TrainType } from './types'

export type TrainSort = 'departure' | 'duration' | 'arrival' | 'availability'

export interface TrainFilters {
  classes: TrainClass[]
  types: TrainType[]
  departWindows: TimeWindowId[]
  availableOnly: boolean
}

export const EMPTY_TRAIN_FILTERS: TrainFilters = { classes: [], types: [], departWindows: [], availableOnly: false }

export function countActiveTrainFilters(f: TrainFilters) {
  return f.classes.length + f.types.length + f.departWindows.length + (f.availableOnly ? 1 : 0)
}

export function applyTrainFilters(list: Train[], f: TrainFilters): Train[] {
  return list.filter((t) => {
    if (f.types.length && !f.types.includes(t.type)) return false
    if (!inWindows(minutesOfDay(t.departAt), f.departWindows)) return false
    const relevant = f.classes.length ? t.classes.filter((c) => f.classes.includes(c.cls)) : t.classes
    if (!relevant.length) return false
    if (f.availableOnly && !relevant.some((c) => c.status === 'AVL' || c.status === 'RAC')) return false
    return true
  })
}

const availabilityScore = (t: Train) =>
  Math.max(...t.classes.map((c) => (c.status === 'AVL' ? 1000 + c.count : c.status === 'RAC' ? 500 - c.count : c.status === 'WL' ? 200 - c.count : 0)))

export function sortTrains(list: Train[], sort: TrainSort): Train[] {
  const out = [...list]
  switch (sort) {
    case 'duration':
      return out.sort((a, b) => a.durationMin - b.durationMin)
    case 'arrival':
      return out.sort((a, b) => a.arriveAt.localeCompare(b.arriveAt))
    case 'availability':
      return out.sort((a, b) => availabilityScore(b) - availabilityScore(a))
    default:
      return out.sort((a, b) => a.departAt.localeCompare(b.departAt))
  }
}

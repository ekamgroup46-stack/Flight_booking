import type { LucideIcon } from 'lucide-react'
import { Moon, Sun, Sunrise, Sunset } from 'lucide-react'

export type TimeWindowId = 'early' | 'morning' | 'afternoon' | 'night'

export interface TimeWindow {
  id: TimeWindowId
  label: string
  range: string
  from: number
  to: number
  icon: LucideIcon
}

export const TIME_WINDOWS: TimeWindow[] = [
  { id: 'early', label: 'Early', range: 'Before 6 AM', from: 0, to: 360, icon: Sunrise },
  { id: 'morning', label: 'Morning', range: '6 AM – 12 PM', from: 360, to: 720, icon: Sun },
  { id: 'afternoon', label: 'Afternoon', range: '12 PM – 6 PM', from: 720, to: 1080, icon: Sunset },
  { id: 'night', label: 'Night', range: 'After 6 PM', from: 1080, to: 1440, icon: Moon },
]

export function inWindows(minuteOfDay: number, windows: TimeWindowId[]): boolean {
  if (!windows.length) return true
  return TIME_WINDOWS.some((w) => windows.includes(w.id) && minuteOfDay >= w.from && minuteOfDay < w.to)
}

export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

import { appConfig } from '@/config/app.config'
import { dateOf, diffInDays, parseISODate, timeOf, todayISO } from './dates'

const moneyFmt = new Intl.NumberFormat(appConfig.locale, {
  style: 'currency',
  currency: appConfig.currency,
  maximumFractionDigits: 0,
})

export function formatMoney(amount: number): string {
  return moneyFmt.format(Math.round(amount))
}

/** "₹4.2k" style compact price for tight spaces such as calendar cells. */
export function formatMoneyCompact(amount: number): string {
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1).replace(/\.0$/, '')}L`
  if (amount >= 10_000) return `₹${Math.round(amount / 1000)}k`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return `₹${Math.round(amount)}`
}

export function formatNumber(n: number, digits = 0): string {
  return new Intl.NumberFormat(appConfig.locale, { maximumFractionDigits: digits }).format(n)
}

export function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = Math.round(totalMinutes % 60)
  if (!h) return `${m}m`
  if (!m) return `${h}h`
  return `${h}h ${m}m`
}

type DateStyle = 'short' | 'medium' | 'long' | 'weekday' | 'dayMonth' | 'monthYear'

const DATE_OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  short: { day: 'numeric', month: 'short' },
  medium: { weekday: 'short', day: 'numeric', month: 'short' },
  long: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  weekday: { weekday: 'short' },
  dayMonth: { day: '2-digit', month: 'short' },
  monthYear: { month: 'long', year: 'numeric' },
}

export function formatDate(iso: string, style: DateStyle = 'medium'): string {
  return new Intl.DateTimeFormat(appConfig.locale, DATE_OPTIONS[style]).format(parseISODate(iso))
}

export function relativeDay(iso: string): string {
  const diff = diffInDays(iso, todayISO())
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return formatDate(iso, 'medium')
}

/** "Tue, 24 Nov · 06:40" from a local datetime. */
export function formatDateTime(dt: string): string {
  return `${formatDate(dateOf(dt), 'medium')} · ${timeOf(dt)}`
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

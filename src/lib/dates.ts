/**
 * Date helpers. Dates travel through the app as ISO strings:
 *  - calendar dates:  `YYYY-MM-DD`
 *  - local datetimes: `YYYY-MM-DDTHH:MM` (local to the departure point)
 * Keeping them as strings avoids timezone drift and maps 1:1 to API payloads.
 */

export const pad2 = (n: number) => String(n).padStart(2, '0')

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function isValidISODate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = parseISODate(value)
  return !Number.isNaN(d.getTime()) && toISODate(d) === value
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

/** a - b, in whole days. */
export function diffInDays(a: string, b: string): number {
  return Math.round((parseISODate(a).getTime() - parseISODate(b).getTime()) / 86_400_000)
}

export function parseDateTime(dt: string): Date {
  const [date, time = '00:00'] = dt.split('T')
  const d = parseISODate(date)
  const [h, m] = time.split(':').map(Number)
  d.setHours(h || 0, m || 0, 0, 0)
  return d
}

export function toLocalDateTime(d: Date): string {
  return `${toISODate(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function combineDateTime(dateISO: string, minutesFromMidnight: number): string {
  const days = Math.floor(minutesFromMidnight / 1440)
  const mins = ((minutesFromMidnight % 1440) + 1440) % 1440
  return `${addDays(dateISO, days)}T${pad2(Math.floor(mins / 60))}:${pad2(mins % 60)}`
}

export function addMinutes(dt: string, minutes: number): string {
  const d = parseDateTime(dt)
  d.setMinutes(d.getMinutes() + minutes)
  return toLocalDateTime(d)
}

export function minutesBetween(a: string, b: string): number {
  return Math.round((parseDateTime(b).getTime() - parseDateTime(a).getTime()) / 60_000)
}

export const timeOf = (dt: string) => dt.slice(11, 16)
export const dateOf = (dt: string) => dt.slice(0, 10)

export function minutesOfDay(dt: string): number {
  const [h, m] = timeOf(dt).split(':').map(Number)
  return h * 60 + m
}

export function nowLocalDateTime(): string {
  return toLocalDateTime(new Date())
}

/** Days of a month grid (Mon-first), padded with nulls. */
export function monthGrid(year: number, month: number): Array<string | null> {
  const first = new Date(year, month, 1)
  const lead = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: Array<string | null> = Array.from({ length: lead }, () => null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(toISODate(new Date(year, month, d)))
  while (cells.length % 7) cells.push(null)
  return cells
}

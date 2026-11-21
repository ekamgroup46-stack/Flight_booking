import { addMinutes, combineDateTime, diffInDays, parseISODate, timeOf, todayISO } from '@/lib/dates'
import { haversineKm, projectOnSegment } from '@/lib/geo'
import { createRng } from '@/lib/random'
import { JUNCTIONS } from '@/services/locations/data'
import { findStation } from '@/services/locations/api'
import type { AvailabilityStatus, ClassAvailability, Quota, RouteStop, Train, TrainClass, TrainSearchResult, TrainType } from './types'

interface TypeMeta {
  speed: number
  classes: TrainClass[]
  premium: boolean
  pantry: boolean
  minKm?: number
  maxKm?: number
  day?: boolean
  maxHalts: number
  weight: number
}

const TYPE_META: Record<TrainType, TypeMeta> = {
  rajdhani: { speed: 76, classes: ['1A', '2A', '3A'], premium: true, pantry: true, minKm: 400, maxHalts: 5, weight: 1.2 },
  shatabdi: { speed: 78, classes: ['EC', 'CC'], premium: true, pantry: true, maxKm: 760, day: true, maxHalts: 4, weight: 1 },
  vande: { speed: 84, classes: ['EC', 'CC'], premium: true, pantry: true, maxKm: 880, day: true, maxHalts: 4, weight: 1.3 },
  duronto: { speed: 72, classes: ['1A', '2A', '3A', 'SL'], premium: true, pantry: true, minKm: 700, maxHalts: 2, weight: 0.8 },
  superfast: { speed: 58, classes: ['1A', '2A', '3A', 'SL'], premium: false, pantry: true, maxHalts: 8, weight: 3 },
  express: { speed: 48, classes: ['2A', '3A', '3E', 'SL'], premium: false, pantry: false, maxHalts: 12, weight: 3 },
  humsafar: { speed: 62, classes: ['3A', '3E'], premium: false, pantry: true, minKm: 600, maxHalts: 6, weight: 0.8 },
  garib: { speed: 60, classes: ['3A', 'CC'], premium: false, pantry: false, minKm: 500, maxHalts: 6, weight: 0.7 },
}

const RATE: Record<TrainClass, [number, number]> = {
  SL: [0.52, 50],
  '3E': [1.22, 85],
  '3A': [1.38, 85],
  '2A': [1.98, 95],
  '1A': [3.3, 135],
  CC: [1.12, 85],
  EC: [2.35, 135],
}

const NAMED = ['Konkan Kanya', 'Mandovi', 'Malabar', 'Brindavan', 'Godavari', 'Navjeevan', 'Chetak', 'Udyan', 'Lalbagh', 'Sahyadri', 'Hirakud', 'Coromandel', 'Vaigai', 'Avadh', 'Paschim', 'Swaraj', 'Poorva', 'Kaveri', 'Narmada', 'Sabari', 'Shalimar', 'Tapti Ganga', 'Ganga Kaveri', 'Mahananda']

const round5 = (n: number) => Math.round(n / 5) * 5

function pickType(rng: ReturnType<typeof createRng>, dist: number, delhiEnd: boolean): TrainType {
  const options = (Object.keys(TYPE_META) as TrainType[]).filter((t) => {
    const m = TYPE_META[t]
    if (m.minKm && dist < m.minKm) return false
    if (m.maxKm && dist > m.maxKm) return false
    if (t === 'rajdhani' && !delhiEnd) return false
    return true
  })
  const total = options.reduce((s, t) => s + TYPE_META[t].weight, 0)
  let r = rng.next() * total
  for (const t of options) {
    r -= TYPE_META[t].weight
    if (r <= 0) return t
  }
  return options[0]
}

function nameFor(type: TrainType, fromCity: string, toCity: string, rng: ReturnType<typeof createRng>): string {
  const far = fromCity === 'New Delhi' ? toCity : fromCity
  switch (type) {
    case 'rajdhani':
      return `${far} Rajdhani`
    case 'shatabdi':
      return `${toCity} Shatabdi`
    case 'vande':
      return `${fromCity}–${toCity} Vande Bharat`
    case 'duronto':
      return `${fromCity} ${toCity} Duronto`
    case 'humsafar':
      return `${far} Humsafar`
    case 'garib':
      return `${far} Garib Rath`
    case 'superfast':
      return rng.chance(0.5) ? `${fromCity} ${toCity} SF Express` : `${rng.pick(NAMED)} SF Express`
    default:
      return `${rng.pick(NAMED)} Express`
  }
}

export function fareFor(cls: TrainClass, km: number, type: TrainType, quota: Quota): number {
  const [perKm, charges] = RATE[cls]
  const premium = TYPE_META[type].premium ? 1.24 : 1
  const tatkal = quota === 'TQ' ? 1.3 : 1
  return Math.max(cls === 'SL' ? 145 : 305, Math.round((km * perKm + charges) * premium * tatkal))
}

function availability(rng: ReturnType<typeof createRng>, cls: TrainClass, daysAhead: number, quota: Quota): Pick<ClassAvailability, 'status' | 'count' | 'confirmChance'> {
  let p = 0.42 + Math.min(daysAhead, 60) / 140
  if (cls === 'SL' || cls === '3A') p -= 0.12
  if (cls === '1A' || cls === 'EC') p += 0.1
  if (quota === 'TQ') p = daysAhead <= 1 ? p - 0.1 : 0.3
  if (quota === 'LD' || quota === 'SS') p += 0.12
  const r = rng.next()
  let status: AvailabilityStatus
  let count: number
  let confirmChance: number | undefined
  if (r < p) {
    status = 'AVL'
    count = rng.int(1, cls === 'SL' ? 320 : 140)
  } else if (r < p + 0.12) {
    status = 'RAC'
    count = rng.int(1, 46)
    confirmChance = rng.int(82, 97)
  } else if (r < 0.965) {
    status = 'WL'
    count = rng.int(1, 160)
    confirmChance = Math.max(4, Math.min(94, Math.round(96 - count * 0.55 + Math.min(daysAhead, 30) - rng.int(0, 12))))
  } else {
    status = 'REGRET'
    count = 0
  }
  return { status, count, confirmChance }
}

function buildStops(from: { code: string; name: string; lat: number; lon: number }, to: { code: string; name: string; lat: number; lon: number }, dist: number, durationMin: number, departAt: string, maxHalts: number, rng: ReturnType<typeof createRng>): RouteStop[] {
  const candidates = JUNCTIONS.filter((j) => j.code !== from.code && j.code !== to.code)
    .map((j) => ({ j, ...projectOnSegment(from, to, j) }))
    .filter((x) => x.t > 0.06 && x.t < 0.94 && x.offset < 0.2)
    .sort((a, b) => a.t - b.t)
  const chosen = candidates.length > maxHalts ? rng.sample(candidates, maxHalts).sort((a, b) => a.t - b.t) : candidates
  const startDate = departAt.slice(0, 10)
  const stops: RouteStop[] = [{ code: from.code, name: from.name, arrive: null, depart: timeOf(departAt), day: 1, haltMin: 0, distanceKm: 0 }]
  let extra = 0
  for (const c of chosen) {
    const halt = rng.pick([2, 2, 5, 5, 10])
    const arr = addMinutes(departAt, Math.round(durationMin * c.t) + extra)
    const dep = addMinutes(arr, halt)
    extra += halt
    stops.push({
      code: c.j.code,
      name: c.j.name,
      arrive: timeOf(arr),
      depart: timeOf(dep),
      day: diffInDays(arr.slice(0, 10), startDate) + 1,
      haltMin: halt,
      distanceKm: Math.round(dist * c.t),
    })
  }
  const arriveAt = addMinutes(departAt, durationMin)
  stops.push({ code: to.code, name: to.name, arrive: timeOf(arriveAt), depart: null, day: diffInDays(arriveAt.slice(0, 10), startDate) + 1, haltMin: 0, distanceKm: dist })
  return stops
}

export function generateTrains(fromCode: string, toCode: string, date: string, quota: Quota = 'GN'): Train[] {
  const A = findStation(fromCode)
  const B = findStation(toCode)
  if (!A || !B || A.code === B.code) return []
  const dist = Math.round(haversineKm(A, B) * 1.22)
  const schedule = createRng(`tr|${A.code}|${B.code}`)
  const avail = createRng(`tr|${A.code}|${B.code}|${date}|${quota}`)
  const weekday = (parseISODate(date).getDay() + 6) % 7
  const daysAhead = Math.max(0, diffInDays(date, todayISO()))
  const delhiEnd = A.city === 'New Delhi' || B.city === 'New Delhi'

  const count = dist > 2200 ? schedule.int(5, 8) : schedule.int(9, 15)
  const trains: Train[] = []
  const numbers = new Set<string>()

  for (let i = 0; i < count; i++) {
    const type = pickType(schedule, dist, delhiEnd)
    const meta = TYPE_META[type]
    const number = String(type === 'express' ? schedule.int(11001, 19999) : schedule.int(12001, 22999))
    if (numbers.has(number)) continue
    numbers.add(number)

    const daily = schedule.chance(0.55) || meta.day
    const runsOn = daily ? Array(7).fill(true) : Array.from({ length: 7 }, () => schedule.chance(0.5))
    if (!runsOn.some(Boolean)) runsOn[schedule.int(0, 6)] = true

    const departMin = meta.day ? round5(schedule.int(5 * 60 + 30, 16 * 60)) : round5(schedule.int(0, 23 * 60 + 50))
    const durationMin = round5((dist / meta.speed) * 60 + schedule.int(0, 25))
    const name = nameFor(type, A.city, B.city, schedule)
    const rating = Math.round(schedule.float(3.5, 4.8) * 10) / 10
    const halts = Math.min(meta.maxHalts, Math.max(1, Math.round(dist / 260)))

    if (!runsOn[weekday]) continue

    const departAt = combineDateTime(date, departMin)
    const classes: ClassAvailability[] = meta.classes.map((cls) => ({
      cls,
      fare: fareFor(cls, dist, type, quota),
      ...availability(avail, cls, daysAhead, quota),
    }))

    trains.push({
      id: `${number}-${date}`,
      number,
      name,
      type,
      from: A,
      to: B,
      departAt,
      arriveAt: addMinutes(departAt, durationMin),
      durationMin,
      distanceKm: dist,
      runsOn,
      classes,
      pantry: meta.pantry,
      rating,
      stops: buildStops(A, B, dist, durationMin, departAt, halts, createRng(`stops|${number}`)),
    })
  }
  return trains.sort((a, b) => a.departAt.localeCompare(b.departAt))
}

export function mockSearchTrains(from: string, to: string, date: string, quota: Quota): TrainSearchResult {
  const A = findStation(from)
  const B = findStation(to)
  if (!A || !B) throw new Error('Unknown station')
  return { from: A, to: B, date, trains: generateTrains(from, to, date, quota) }
}

/** Minimal availability snapshot for neighbouring dates (date strip). */
export function mockTrainDateSummary(from: string, to: string, dates: string[]) {
  return dates.map((date) => {
    const list = date < todayISO() ? [] : generateTrains(from, to, date)
    const available = list.filter((t) => t.classes.some((c) => c.status === 'AVL')).length
    return { date, trains: list.length, available }
  })
}

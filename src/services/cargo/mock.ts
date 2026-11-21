import { ApiError } from '@/lib/api/errors'
import { addDays, addMinutes, nowLocalDateTime, toISODate } from '@/lib/dates'
import { haversineKm } from '@/lib/geo'
import { createRng } from '@/lib/random'
import { CITIES } from '@/services/locations/data'
import { findCity } from '@/services/locations/api'
import type { CargoMode, CargoQuote, CargoQuoteResult, CargoSearchParams, Shipment, ShipmentStage, TrackingEvent } from './types'

const EMISSION: Record<CargoMode, number> = { express: 0.602, air: 0.602, surface: 0.105, economy: 0.095, rail: 0.028, ptl: 0.09, ftl: 0.075 }

const TRUCKS: Array<{ name: string; capacity: number; perKm: number }> = [
  { name: 'Tata Ace · 750 kg', capacity: 750, perKm: 22 },
  { name: 'Eicher 14 ft · 4 T', capacity: 4000, perKm: 38 },
  { name: '19 ft container · 7 T', capacity: 7000, perKm: 52 },
  { name: '32 ft MXL · 15 T', capacity: 15000, perKm: 78 },
]

const round9 = (n: number) => Math.max(99, Math.round(n / 10) * 10 - 1)

export function mockCargoQuote(p: CargoSearchParams): CargoQuoteResult {
  const from = findCity(p.from)
  const to = findCity(p.to)
  if (!from || !to) throw new Error('Unknown city')
  const distanceKm = Math.max(15, Math.round(haversineKm(from, to) * 1.3))
  const volumetricKg = p.l && p.w && p.h ? Math.round(((p.l * p.w * p.h) / 5000) * p.pieces * 10) / 10 : 0
  const chargeableKg = Math.max(0.5, Math.ceil(Math.max(p.weight, volumetricKg) * 2) / 2)
  const rng = createRng(`cargo|${p.from}|${p.to}|${p.type}|${chargeableKg}`)
  const airF = 0.85 + distanceKm / 3000
  const roadF = 0.6 + distanceKm / 1500
  const tonneKm = (chargeableKg / 1000) * distanceKm

  const q = (mode: CargoMode, name: string, tagline: string, price: number, days: [number, number], features: string[], vehicle?: string): CargoQuote => ({
    id: `${mode}${vehicle ? `-${vehicle.split(' ')[0]}` : ''}`,
    mode,
    name,
    tagline,
    price: round9(price * rng.float(0.96, 1.05)),
    transitDays: days,
    deliveryBy: addDays(p.date, days[1]),
    co2Kg: Math.round(tonneKm * EMISSION[mode] * 10) / 10,
    features,
    vehicle,
  })

  const quotes: CargoQuote[] = []
  const surfaceDays = (div: number, extra = 0): [number, number] => {
    const d = Math.max(1, Math.ceil(distanceKm / div)) + extra
    return [d, d + 1]
  }

  if (p.type === 'documents' || p.type === 'parcel') {
    quotes.push(q('express', 'Express Air', 'Next-flight-out for urgent shipments', Math.max(349, 140 + chargeableKg * 95 * airF), distanceKm < 400 ? [1, 1] : [1, 2], ['Doorstep pickup today', 'Priority handling', 'Live tracking', 'SMS & WhatsApp updates']))
    quotes.push(q('surface', 'Priority Surface', 'Dedicated line-haul with fewer hops', Math.max(199, 90 + chargeableKg * 32 * roadF), surfaceDays(550), ['Doorstep pickup', 'Live tracking', 'Proof of delivery']))
    quotes.push(q('economy', 'Economy Surface', 'Our lowest price for non-urgent parcels', Math.max(149, 70 + chargeableKg * 19 * roadF), surfaceDays(380, 1), ['Doorstep pickup', 'Milestone tracking']))
    if (chargeableKg >= 10) quotes.push(q('rail', 'Rail Parcel Saver', 'Rides the overnight parcel vans', Math.max(249, 400 + chargeableKg * 11 * roadF * 0.8), surfaceDays(600, 2), ['Hub drop-off or pickup', 'Lowest emissions', 'Milestone tracking']))
  }
  if (p.type === 'pallet') {
    if (chargeableKg <= 500) quotes.push(q('air', 'Air Cargo', 'Belly-hold space on scheduled flights', 1800 + chargeableKg * 62 * airF, [1, 2], ['Airport-to-door', 'Priority handling', 'Live tracking']))
    quotes.push(q('ptl', 'Part Truck Load', 'Share a truck, pay for your pallets', 1500 + chargeableKg * 9.5 * roadF, surfaceDays(450, 1), ['Doorstep pickup', 'Forklift on request', 'Live GPS tracking']))
    quotes.push(q('rail', 'Rail Freight', 'Containerised rail between major hubs', 2200 + chargeableKg * 6.2 * roadF, surfaceDays(600, 2), ['Hub-to-door', 'Lowest emissions', 'Weatherproof containers']))
  }
  if (p.type === 'truckload' || chargeableKg > 1000) {
    for (const t of TRUCKS.filter((t) => t.capacity >= Math.min(chargeableKg, 15000)).slice(0, 3)) {
      quotes.push(q('ftl', `Full Truck · ${t.name.split(' · ')[0]}`, 'Dedicated vehicle, direct to destination', 800 + distanceKm * t.perKm, surfaceDays(500), ['Dedicated driver & vehicle', 'Live GPS tracking', 'E-way bill assistance'], t.name))
    }
  }

  if (quotes.length) {
    const fastest = [...quotes].sort((a, b) => a.transitDays[0] - b.transitDays[0] || a.price - b.price)[0]
    fastest.badge = 'Fastest'
    const cheapest = quotes.reduce((a, b) => (a.price <= b.price ? a : b))
    if (!cheapest.badge) cheapest.badge = 'Best value'
    const greenest = quotes.reduce((a, b) => (a.co2Kg <= b.co2Kg ? a : b))
    if (!greenest.badge) greenest.badge = 'Greenest'
  }

  return {
    from,
    to,
    distanceKm,
    actualKg: p.weight,
    volumetricKg,
    chargeableKg,
    quotes: quotes.sort((a, b) => a.price - b.price),
    pickupSlots: ['09:00 – 12:00', '12:00 – 15:00', '15:00 – 18:00'],
  }
}

const STAGES: ShipmentStage[] = ['booked', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered']

/** Builds a timeline for a shipment at a given stage. */
export function buildTimeline(trackingId: string, fromName: string, toName: string, stage: ShipmentStage, startAt: string, days: number): TrackingEvent[] {
  const idx = STAGES.indexOf(stage)
  const hub = (city: string) => `${city} Gateway Hub`
  const span = Math.max(1, days) * 24 * 60
  const plan: Array<Omit<TrackingEvent, 'state'>> = [
    { at: startAt, title: 'Shipment booked', location: fromName, detail: `Tracking ID ${trackingId} generated` },
    { at: addMinutes(startAt, 240), title: 'Picked up', location: fromName, detail: 'Collected from sender, weight verified' },
    { at: addMinutes(startAt, 420), title: 'Departed origin hub', location: hub(fromName), detail: 'Sorted and loaded for line-haul' },
    { at: addMinutes(startAt, Math.round(span * 0.65)), title: 'Arrived at destination hub', location: hub(toName), detail: 'Unloaded and scanned' },
    { at: addMinutes(startAt, Math.round(span * 0.9)), title: 'Out for delivery', location: toName, detail: 'With delivery partner' },
    { at: addMinutes(startAt, Math.round(span * 0.96)), title: 'Delivered', location: toName, detail: 'Signed by receiver' },
  ]
  // Map stage → how many events are complete
  const doneCount = [1, 2, 4, 5, 6][idx]
  return plan.map((e, i) => ({ ...e, state: i < doneCount - 1 ? 'done' : i === doneCount - 1 ? (stage === 'delivered' ? 'done' : 'current') : 'upcoming' }))
}

export function mockTrack(rawId: string): Shipment {
  const id = rawId.trim().toUpperCase()
  if (!/^EKC\d{9}$/.test(id)) throw new ApiError('Tracking IDs look like EKC204611238 — 3 letters and 9 digits.', 422, 'INVALID_TRACKING_ID')
  const rng = createRng(`track|${id}`)
  if (id.endsWith('000')) throw new ApiError(`We couldn’t find a shipment with ID ${id}.`, 404, 'NOT_FOUND')
  const [a, b] = rng.sample(CITIES, 2)
  const stage = STAGES[Number(id.at(-1)) % 5]
  const days = rng.int(2, 5)
  const startAt = addMinutes(nowLocalDateTime(), -Math.round(days * 24 * 60 * [0.05, 0.25, 0.5, 0.92, 1.2][STAGES.indexOf(stage)]))
  const events = buildTimeline(id, a.name, b.name, stage, startAt, days)
  return {
    trackingId: id,
    from: a.name,
    to: b.name,
    service: rng.pick(['Priority Surface', 'Express Air', 'Part Truck Load', 'Economy Surface']),
    stage,
    eta: toISODate(new Date(Date.now() + (days - STAGES.indexOf(stage)) * 86_400_000)),
    weightKg: rng.int(1, 340),
    pieces: rng.int(1, 6),
    events,
    progress: [0.06, 0.24, 0.55, 0.85, 1][STAGES.indexOf(stage)],
  }
}

export const SAMPLE_TRACKING_IDS = ['EKC204611238', 'EKC981200457', 'EKC550019874']

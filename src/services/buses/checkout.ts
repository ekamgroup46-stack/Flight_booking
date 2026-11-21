import { timeOf } from '@/lib/dates'
import { formatDate, pluralize } from '@/lib/format'
import type { CheckoutItem } from '@/services/bookings/types'
import type { Bus, BusPoint, BusSearchParams, BusSearchResult, Seat } from './types'

export function busToCheckoutItem(
  params: BusSearchParams,
  result: Pick<BusSearchResult, 'from' | 'to'>,
  bus: Bus,
  seats: Seat[],
  boarding: BusPoint,
  dropping: BusPoint,
): CheckoutItem {
  const gross = seats.reduce((s, x) => s + x.price, 0)
  const gst = bus.ac ? Math.round(gross - gross / 1.05) : 0
  const labels = seats.map((s) => s.label)
  const sleeper = bus.layout === 'sleeper'

  return {
    service: 'buses',
    title: `${result.from.name} → ${result.to.name}`,
    subtitle: `${formatDate(params.date)} · ${bus.operator} · ${pluralize(seats.length, 'seat')} (${labels.join(', ')})`,
    start: boarding.at,
    end: dropping.at,
    segments: [
      {
        from: { name: boarding.name, sub: result.from.name, at: boarding.at },
        to: { name: dropping.name, sub: result.to.name, at: dropping.at },
        carrier: bus.operator,
        reference: bus.busType,
        durationMin: bus.durationMin,
        notes: [`Seats ${labels.join(', ')}`, `${bus.distanceKm} km`, ...(bus.liveTracking ? ['Live tracking link sent by SMS'] : [])],
      },
    ],
    highlights: [bus.busType, `Boarding ${boarding.name} at ${timeOf(boarding.at)}`, bus.cancellation, 'Show the m-ticket on your phone while boarding'],
    fareLines: [
      { id: 'base', label: `Seat fare · ${labels.join(', ')}`, amount: gross - gst, kind: 'base' },
      ...(gst ? [{ id: 'gst', label: 'GST (5%)', amount: gst, kind: 'tax' as const }] : []),
    ],
    addons: [
      { id: 'free-cancel', label: 'Free cancellation', description: 'Full refund up to 2 hours before departure', price: 69, per: 'traveller', recommended: true },
      { id: 'insurance', label: 'Journey insurance', description: 'Accident & luggage cover', price: 19, per: 'traveller' },
    ],
    details: 'passengers',
    passengers: { adults: seats.length, children: 0, infants: 0, seats: labels },
    policy: { refundable: true, summary: bus.cancellation, cancellationFeePct: bus.cancellation.startsWith('Free') ? 0 : 0.15 },
    couponTags: sleeper ? ['sleeper'] : ['seater'],
    referenceLabel: 'Ticket no.',
    meta: {
      Operator: bus.operator,
      Coach: bus.busType,
      Seats: labels.join(', '),
      Boarding: `${boarding.name} · ${timeOf(boarding.at)}`,
      Dropping: `${dropping.name} · ${timeOf(dropping.at)}`,
    },
  }
}

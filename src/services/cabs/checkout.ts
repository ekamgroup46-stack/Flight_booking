import { addMinutes, combineDateTime } from '@/lib/dates'
import { formatDate, formatDuration } from '@/lib/format'
import type { CheckoutItem } from '@/services/bookings/types'
import { PACKAGE_LABEL, TRIP_LABEL, type CabOption, type CabQuoteResult, type CabSearchParams } from './types'

export function cabToCheckoutItem(params: CabSearchParams, quote: CabQuoteResult, option: CabOption): CheckoutItem {
  const start = combineDateTime(params.date, Number(params.time.slice(0, 2)) * 60 + Number(params.time.slice(3, 5)))
  const end = params.trip === 'round' && params.ret ? combineDateTime(params.ret, 21 * 60) : addMinutes(start, quote.durationMin)
  const outstation = params.trip === 'oneway' || params.trip === 'round'
  const gst = Math.round(option.price - option.price / 1.05)
  const driver = outstation ? 300 * quote.days : 0
  const tolls = params.trip === 'rental' ? 0 : quote.tolls
  const base = option.price - gst - driver - tolls
  const dropName = quote.to?.name ?? (quote.pkg ? PACKAGE_LABEL[quote.pkg] : 'Rental')

  return {
    service: 'cabs',
    title: quote.to ? `${quote.from.name} → ${quote.to.name}` : `${quote.from.name} · ${PACKAGE_LABEL[quote.pkg ?? '4-40']}`,
    subtitle: `${formatDate(params.date)} · ${params.time} · ${option.name} (${option.model})`,
    start,
    end,
    segments: [
      {
        from: { code: quote.from.code, name: quote.from.name, sub: quote.from.city, at: start },
        to: { code: quote.to?.code, name: dropName, sub: quote.to?.city, at: end },
        carrier: `${option.name} · ${option.model}`,
        reference: TRIP_LABEL[params.trip],
        durationMin: quote.durationMin,
        notes: [`${quote.distanceKm} km${params.trip === 'round' ? ` over ${quote.days} day${quote.days > 1 ? 's' : ''}` : ''}`, `Approx. ${formatDuration(quote.durationMin)}`, `${option.seats} seats · ${option.bags} bags`],
      },
    ],
    highlights: [...option.inclusions.slice(0, 3).map((i) => `Includes ${i.toLowerCase()}`), option.cancellation, `Extra km at ₹${option.extraKm}/km`],
    fareLines: [
      { id: 'base', label: `Trip fare · ${quote.distanceKm} km`, amount: base, kind: 'base' },
      ...(driver ? [{ id: 'driver', label: 'Driver allowance', amount: driver, kind: 'fee' as const }] : []),
      ...(tolls ? [{ id: 'tolls', label: params.trip === 'airport' ? 'Airport entry & tolls' : 'Tolls & state tax', amount: tolls, kind: 'fee' as const }] : []),
      { id: 'gst', label: 'GST (5%)', amount: gst, kind: 'tax' },
    ],
    addons: [
      { id: 'wait', label: 'Extra waiting · 30 min', description: 'Useful for delayed flights or long check-outs', price: 150, per: 'booking', recommended: params.trip === 'airport' },
      { id: 'child-seat', label: 'Child seat', description: 'Rear-facing or booster, fitted before pickup', price: 199, per: 'booking' },
      { id: 'pet', label: 'Pet-friendly ride', description: 'Seat cover included; one pet up to 20 kg', price: 249, per: 'booking' },
    ],
    details: 'cab',
    passengers: { adults: 1, children: 0, infants: 0 },
    policy: { refundable: true, summary: option.cancellation, cancellationFeePct: 0 },
    couponTags: [params.trip === 'airport' ? 'airport' : outstation ? 'outstation' : 'rental'],
    referenceLabel: 'Trip ID',
    meta: {
      Trip: TRIP_LABEL[params.trip],
      Vehicle: `${option.name} · ${option.model}`,
      Distance: `${quote.distanceKm} km`,
      Pickup: `${formatDate(params.date)}, ${params.time}`,
      ...(params.trip === 'round' && params.ret ? { Return: formatDate(params.ret) } : {}),
    },
  }
}

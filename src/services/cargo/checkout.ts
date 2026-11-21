import { combineDateTime } from '@/lib/dates'
import { formatDate, formatNumber } from '@/lib/format'
import type { CheckoutItem } from '@/services/bookings/types'
import { SHIPMENT_TYPE_LABEL, type CargoQuote, type CargoQuoteResult, type CargoSearchParams } from './types'

export function cargoToCheckoutItem(params: CargoSearchParams, result: CargoQuoteResult, quote: CargoQuote, slot: string): CheckoutItem {
  const startHour = Number(slot.slice(0, 2))
  const start = combineDateTime(params.date, startHour * 60)
  const end = combineDateTime(quote.deliveryBy, 19 * 60)
  const gst = Math.round(quote.price - quote.price / 1.18)
  const fuel = Math.round((quote.price - gst) * 0.08)
  const air = quote.mode === 'express' || quote.mode === 'air'

  return {
    service: 'cargo',
    title: `${result.from.name} → ${result.to.name}`,
    subtitle: `${SHIPMENT_TYPE_LABEL[params.type]} · ${formatNumber(result.chargeableKg, 1)} kg · ${quote.name}`,
    start,
    end,
    segments: [
      {
        from: { name: result.from.name, sub: `Pickup ${formatDate(params.date)}, ${slot}`, at: start },
        to: { name: result.to.name, sub: `Delivery by ${formatDate(quote.deliveryBy)}`, at: end },
        carrier: quote.name,
        reference: quote.vehicle ?? SHIPMENT_TYPE_LABEL[params.type],
        durationMin: Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000),
        notes: [`${result.distanceKm} km`, `${params.pieces} piece${params.pieces > 1 ? 's' : ''}`, `≈ ${quote.co2Kg} kg CO₂e`],
      },
    ],
    highlights: [`Pickup ${formatDate(params.date)}, ${slot}`, `Delivery in ${quote.transitDays[0]}–${quote.transitDays[1]} days`, ...quote.features.slice(0, 2)],
    fareLines: [
      { id: 'freight', label: `Freight · ${formatNumber(result.chargeableKg, 1)} kg chargeable`, amount: quote.price - gst - fuel, kind: 'base' },
      { id: 'fuel', label: 'Fuel surcharge', amount: fuel, kind: 'fee' },
      { id: 'gst', label: 'GST (18%)', amount: gst, kind: 'tax' },
    ],
    addons: [
      { id: 'insurance', label: 'Shipment protection', description: 'Covers loss or damage up to ₹50,000', price: 199, per: 'booking', recommended: true },
      { id: 'packaging', label: 'Professional packing', description: 'Boxes, bubble wrap & sealing at pickup', price: 149, per: 'booking' },
      { id: 'fragile', label: 'Fragile handling', description: 'Separate stowage and handle-with-care labels', price: 199, per: 'booking' },
      { id: 'pod', label: 'Signed proof of delivery', description: 'Scanned POD emailed within 2 hours', price: 49, per: 'booking' },
    ],
    details: 'cargo',
    passengers: { adults: 1, children: 0, infants: 0 },
    policy: { refundable: true, summary: 'Free cancellation until the pickup partner is assigned.', cancellationFeePct: 0.05 },
    couponTags: air ? ['air'] : ['surface'],
    referenceLabel: 'Tracking ID',
    meta: {
      Service: quote.name,
      Type: SHIPMENT_TYPE_LABEL[params.type],
      Weight: `${formatNumber(params.weight, 1)} kg actual · ${formatNumber(result.chargeableKg, 1)} kg chargeable`,
      Pieces: String(params.pieces),
      Pickup: `${formatDate(params.date)}, ${slot}`,
      ...(quote.vehicle ? { Vehicle: quote.vehicle } : {}),
    },
  }
}

import { formatDate, pluralize } from '@/lib/format'
import type { CheckoutItem } from '@/services/bookings/types'
import { CLASS_INFO, QUOTA_LABEL, TRAIN_TYPE_LABEL, type ClassAvailability, type Train, type TrainSearchParams } from './types'

export function trainToCheckoutItem(params: TrainSearchParams, train: Train, availability: ClassAvailability): CheckoutItem {
  const info = CLASS_INFO[availability.cls]
  const pax = params.pax
  const gross = availability.fare * pax
  const gst = info.ac ? Math.round(gross * 0.05) : 0
  const charges = (availability.cls === 'SL' ? 50 : 85) * pax
  const statusText = availability.status === 'AVL' ? `Available (${availability.count})` : availability.status === 'REGRET' ? 'Regret' : `${availability.status} ${availability.count}`

  return {
    service: 'trains',
    title: `${train.from.name} → ${train.to.name}`,
    subtitle: `${formatDate(params.date)} · ${train.number} ${train.name} · ${availability.cls} · ${pluralize(pax, 'passenger')}`,
    start: train.departAt,
    end: train.arriveAt,
    segments: [
      {
        from: { code: train.from.code, name: train.from.name, sub: train.from.city, at: train.departAt },
        to: { code: train.to.code, name: train.to.name, sub: train.to.city, at: train.arriveAt },
        carrier: `${train.number} · ${train.name}`,
        reference: `${availability.cls} · ${info.label}`,
        durationMin: train.durationMin,
        notes: [TRAIN_TYPE_LABEL[train.type], `${train.stops.length - 2} halts · ${train.distanceKm} km`, ...(train.pantry ? ['Pantry car'] : [])],
      },
    ],
    highlights: [
      `${info.label} (${availability.cls})`,
      `${QUOTA_LABEL[params.quota]} quota · ${statusText}`,
      ...(availability.confirmChance && availability.status !== 'AVL' ? [`${availability.confirmChance}% chance of confirmation`] : []),
      'Berths are allotted by the railway at charting',
    ],
    fareLines: [
      { id: 'base', label: `Ticket fare · ${pluralize(pax, 'passenger')}`, amount: gross - charges, kind: 'base' },
      { id: 'charges', label: 'Reservation & superfast charges', amount: charges, kind: 'fee' },
      ...(gst ? [{ id: 'gst', label: 'GST (5%)', amount: gst, kind: 'tax' as const }] : []),
    ],
    addons: [
      { id: 'free-cancel', label: 'Free cancellation', description: 'Full refund of ticket fare if you cancel before charting', price: 99, per: 'traveller', recommended: true },
      { id: 'insurance', label: 'Travel insurance', description: 'Accident cover up to ₹10 lakh per passenger', price: 10, per: 'traveller' },
      ...(!train.pantry ? [{ id: 'meal', label: 'Meal at your seat', description: 'Delivered at a station en route', price: 189, per: 'traveller' as const }] : []),
    ],
    details: 'passengers',
    passengers: { adults: pax, children: 0, infants: 0, berthPreference: info.sleeper },
    policy: { refundable: true, summary: 'Cancellation charges as per railway rules; up to 50% within 12 hours of departure.', cancellationFeePct: 0.25 },
    couponTags: [...(info.ac ? ['ac-class'] : []), ...(params.quota === 'TQ' ? ['tatkal'] : [])],
    referenceLabel: 'PNR',
    meta: {
      Train: `${train.number} ${train.name}`,
      Class: `${availability.cls} · ${info.label}`,
      Quota: QUOTA_LABEL[params.quota],
      Status: statusText,
    },
  }
}

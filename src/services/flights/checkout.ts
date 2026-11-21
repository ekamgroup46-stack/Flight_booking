import { formatDate, formatDuration, pluralize } from '@/lib/format'
import type { CheckoutItem, ItinerarySegment } from '@/services/bookings/types'
import { findAirport } from '@/services/locations/api'
import { CABIN_LABEL, SPECIAL_FARE_LABEL, type FareOption, type Flight, type FlightSearchParams } from './types'

interface Selection {
  params: FlightSearchParams
  outbound: Flight
  outboundFare: FareOption
  inbound?: Flight
  inboundFare?: FareOption
}

function segmentsOf(f: Flight): ItinerarySegment[] {
  return f.legs.map((leg, i) => {
    const a = findAirport(leg.from)
    const b = findAirport(leg.to)
    const layover = f.layovers[i]
    return {
      from: { code: leg.from, name: a?.city ?? leg.from, sub: a?.name, at: leg.departAt },
      to: { code: leg.to, name: b?.city ?? leg.to, sub: b?.name, at: leg.arriveAt },
      carrier: f.airline.name,
      reference: leg.flightNo,
      durationMin: leg.durationMin,
      notes: [leg.aircraft, ...(layover ? [`${formatDuration(layover.durationMin)} layover in ${findAirport(layover.airport)?.city ?? layover.airport}`] : [])],
    }
  })
}

export function flightToCheckoutItem({ params, outbound, outboundFare, inbound, inboundFare }: Selection): CheckoutItem {
  const from = findAirport(params.from)
  const to = findAirport(params.to)
  const intl = from?.country !== 'India' || to?.country !== 'India'
  const pax = params.adults + params.children + params.infants
  const perAdult = outboundFare.price + (inboundFare?.price ?? 0)
  const legsCount = inbound ? 2 : 1
  const total =
    perAdult * params.adults + Math.round(perAdult * 0.78) * params.children + (intl ? 4500 : 1650) * params.infants * legsCount
  const base = Math.round(total * 0.82)

  const fareName = inboundFare && inboundFare.id !== outboundFare.id ? `${outboundFare.name} + ${inboundFare.name}` : outboundFare.name
  const refundable = outboundFare.refundable && (inboundFare?.refundable ?? true)

  return {
    service: 'flights',
    title: `${from?.city ?? params.from} → ${to?.city ?? params.to}${inbound ? ' · Round trip' : ''}`,
    subtitle: `${formatDate(params.depart)}${inbound && params.ret ? ` – ${formatDate(params.ret)}` : ''} · ${pluralize(pax, 'traveller')} · ${CABIN_LABEL[params.cabin]}`,
    start: outbound.departAt,
    end: (inbound ?? outbound).arriveAt,
    segments: [...segmentsOf(outbound), ...(inbound ? segmentsOf(inbound) : [])],
    highlights: [
      `${fareName} fare`,
      `Cabin ${outboundFare.cabinBag} · Check-in ${outboundFare.checkinBag}`,
      outboundFare.change,
      outboundFare.cancellation,
    ],
    fareLines: [
      { id: 'base', label: `Base fare · ${pluralize(pax, 'traveller')}`, amount: base, kind: 'base' },
      { id: 'taxes', label: 'Taxes & airport fees', amount: total - base, kind: 'tax' },
    ],
    addons: [
      { id: 'insurance', label: 'Trip Secure', description: 'Delay, lost baggage & medical cover', price: 249, per: 'traveller', recommended: true },
      { id: 'seat', label: 'Preferred seat', description: 'Window or aisle in the front rows', price: 349, per: 'traveller' },
      { id: 'meal', label: 'Hot meal', description: 'Pre-book a chef-curated meal', price: 399, per: 'traveller' },
      { id: 'bag', label: 'Extra 5 kg check-in', description: 'Cheaper than paying at the airport', price: 1750, per: 'booking' },
    ],
    details: 'passengers',
    passengers: { adults: params.adults, children: params.children, infants: params.infants },
    policy: { refundable, summary: outboundFare.cancellation, cancellationFeePct: refundable ? 0.08 : 0.65 },
    couponTags: [intl ? 'international' : 'domestic'],
    referenceLabel: 'PNR',
    meta: {
      Airline: outbound.airline.name,
      Cabin: CABIN_LABEL[params.cabin],
      Fare: fareName,
      ...(params.fare !== 'regular' ? { 'Special fare': SPECIAL_FARE_LABEL[params.fare] } : {}),
    },
  }
}

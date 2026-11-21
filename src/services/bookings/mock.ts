import type { ServiceId } from '@/config/services'
import { ApiError } from '@/lib/api/errors'
import { createMockTable } from '@/lib/api/mock'
import { addDays, nowLocalDateTime, todayISO } from '@/lib/dates'
import { randomCode, randomDigits } from '@/lib/random'
import { busToCheckoutItem } from '@/services/buses/checkout'
import { generateBuses, mockSeatLayout } from '@/services/buses/mock'
import { cabToCheckoutItem } from '@/services/cabs/checkout'
import { mockCabQuote } from '@/services/cabs/mock'
import { cargoToCheckoutItem } from '@/services/cargo/checkout'
import { mockCargoQuote } from '@/services/cargo/mock'
import { flightToCheckoutItem } from '@/services/flights/checkout'
import { generateFlights } from '@/services/flights/mock'
import { trainToCheckoutItem } from '@/services/trains/checkout'
import { generateTrains } from '@/services/trains/mock'
import { computePricing } from './pricing'
import type { Booking, CancellationQuote, CheckoutItem, CreateBookingPayload, Traveller } from './types'

export function referenceFor(service: ServiceId): string {
  switch (service) {
    case 'flights':
      return randomCode(6)
    case 'trains':
      return `4${randomDigits(9)}`
    case 'buses':
      return `EKB${randomDigits(8)}`
    case 'cabs':
      return `CAB${randomDigits(7)}`
    case 'cargo':
      return `EKC${randomDigits(9)}`
  }
}

const traveller = (firstName: string, lastName: string, age: string, gender: Traveller['gender'], extra: Partial<Traveller> = {}): Traveller => ({
  id: randomCode(5),
  type: 'adult',
  firstName,
  lastName,
  age,
  gender,
  ...extra,
})

function seedBooking(item: CheckoutItem, travellers: Traveller[], createdDaysAgo: number, status: Booking['status'] = 'confirmed'): Booking {
  const pricing = computePricing(item, item.addons.filter((a) => a.recommended).map((a) => a.id))
  const createdAt = `${addDays(todayISO(), -createdDaysAgo)}T10:${String(10 + createdDaysAgo).slice(-2)}`
  return {
    id: `EK${randomCode(8)}`,
    reference: { label: item.referenceLabel, value: referenceFor(item.service) },
    service: item.service,
    status,
    createdAt,
    item,
    travellers,
    contact: { email: 'aarav.sharma@example.com', phone: '98450 12345' },
    cab: item.details === 'cab' ? { passengerName: 'Aarav Sharma', pickupAddress: 'Terminal 2, Arrivals Gate 4', flightNumber: '6E 512' } : undefined,
    cargo:
      item.details === 'cargo'
        ? {
            sender: { name: 'Aarav Sharma', phone: '98450 12345', address: '14 Hill Road, Bandra West', pincode: '400050' },
            receiver: { name: 'Meera Iyer', phone: '99001 23456', address: '221, 6th Cross, Indiranagar', pincode: '560038' },
            contents: 'Books and personal effects',
            declaredValue: '18000',
          }
        : undefined,
    addons: item.addons.filter((a) => a.recommended).map((a) => a.id),
    pricing,
    payment: { method: 'upi', label: 'UPI · aarav@okbank', txnId: `T${randomDigits(12)}`, paidAt: createdAt },
    cancellation:
      status === 'cancelled' ? { at: addDays(todayISO(), -createdDaysAgo + 1) + 'T09:00', fee: 0, refundAmount: pricing.total, status: 'refunded' } : undefined,
  }
}

function seed(): Booking[] {
  const out: Booking[] = []
  try {
    const flightDate = addDays(todayISO(), 12)
    const flights = generateFlights('BLR', 'GOX', flightDate, 'economy')
    const f = flights.find((x) => x.stops === 0) ?? flights[0]
    if (f) {
      const params = { trip: 'oneway' as const, from: 'BLR', to: 'GOX', depart: flightDate, adults: 2, children: 0, infants: 0, cabin: 'economy' as const, fare: 'regular' as const }
      out.push(seedBooking(flightToCheckoutItem({ params, outbound: f, outboundFare: f.fares[1] }), [traveller('Aarav', 'Sharma', '34', 'male'), traveller('Isha', 'Sharma', '31', 'female')], 2))
    }

    const busDate = addDays(todayISO(), 4)
    const bus = generateBuses('bengaluru', 'goa', busDate).find((b) => b.layout === 'sleeper')
    if (bus) {
      const seats = mockSeatLayout(bus.id).decks.flatMap((d) => d.seats).filter((s) => s.status === 'available').slice(0, 2)
      const item = busToCheckoutItem({ from: 'bengaluru', to: 'goa', date: busDate }, { from: { id: 'bengaluru', name: 'Bengaluru' }, to: { id: 'goa', name: 'Goa (Panaji)' } }, bus, seats, bus.boarding[0], bus.dropping[0])
      out.push(seedBooking(item, [traveller('Aarav', 'Sharma', '34', 'male', { seat: seats[0]?.label }), traveller('Isha', 'Sharma', '31', 'female', { seat: seats[1]?.label })], 1))
    }

    const trainDate = addDays(todayISO(), -18)
    const train = generateTrains('NDLS', 'JP', trainDate).find((t) => t.classes.some((c) => c.cls === 'CC' || c.cls === '3A'))
    if (train) {
      const cls = train.classes.find((c) => c.cls === 'CC' || c.cls === '3A')!
      const item = trainToCheckoutItem({ from: 'NDLS', to: 'JP', date: trainDate, cls: 'ALL', quota: 'GN', pax: 2 }, train, { ...cls, status: 'AVL', count: 40 })
      out.push(seedBooking(item, [traveller('Aarav', 'Sharma', '34', 'male', { berth: 'Window' }), traveller('Isha', 'Sharma', '31', 'female')], 30))
    }

    const cabDate = addDays(todayISO(), -6)
    const cabParams = { trip: 'airport' as const, from: 'apt-BOM', to: 'loc-bom-bandra', date: cabDate, time: '21:15' }
    const quote = mockCabQuote(cabParams)
    const sedan = quote.options.find((o) => o.category === 'sedan') ?? quote.options[0]
    out.push(seedBooking(cabToCheckoutItem(cabParams, quote, sedan), [traveller('Aarav', 'Sharma', '34', 'male')], 9, 'cancelled'))

    const cargoParams = { from: 'mumbai', to: 'bengaluru', type: 'parcel' as const, weight: 12, pieces: 2, date: addDays(todayISO(), -1) }
    const cq = mockCargoQuote(cargoParams)
    const surface = cq.quotes.find((q) => q.mode === 'surface') ?? cq.quotes[0]
    if (surface) out.push(seedBooking(cargoToCheckoutItem(cargoParams, cq, surface, cq.pickupSlots[0]), [traveller('Aarav', 'Sharma', '34', 'male')], 2))
  } catch {
    /* seeds are best-effort */
  }
  return out
}

export const bookingsTable = createMockTable<Booking>('bookings', seed)

export function createBookingLocal(payload: CreateBookingPayload): Booking {
  if (payload.simulateDecline)
    throw new ApiError('Your bank declined this payment. No money was deducted — try another card or UPI.', 402, 'PAYMENT_DECLINED')
  const now = nowLocalDateTime()
  const pricing = computePricing(payload.item, payload.addons, payload.coupon)
  const booking: Booking = {
    id: `EK${randomCode(8)}`,
    reference: { label: payload.item.referenceLabel, value: referenceFor(payload.item.service) },
    service: payload.item.service,
    status: 'confirmed',
    createdAt: now,
    item: payload.item,
    travellers: payload.travellers,
    contact: payload.contact,
    cab: payload.cab,
    cargo: payload.cargo,
    addons: payload.addons,
    coupon: pricing.discount > 0 ? payload.coupon : undefined,
    pricing,
    payment: { ...payload.payment, txnId: `T${randomDigits(12)}`, paidAt: now },
  }
  return bookingsTable.insert(booking)
}

export function cancellationQuoteLocal(id: string): CancellationQuote {
  const b = bookingsTable.get(id)
  if (!b) throw new ApiError('Booking not found.', 404, 'NOT_FOUND')
  const paid = b.pricing.total
  if (b.status === 'cancelled') return { bookingId: id, paid, fee: 0, refund: 0, cancellable: false, reason: 'This booking is already cancelled.' }
  if (b.item.start <= nowLocalDateTime()) return { bookingId: id, paid, fee: 0, refund: 0, cancellable: false, reason: 'This journey has already started.' }
  const fee = Math.round(paid * b.item.policy.cancellationFeePct)
  return { bookingId: id, paid, fee, refund: paid - fee, cancellable: true }
}

export function cancelBookingLocal(id: string): Booking {
  const q = cancellationQuoteLocal(id)
  if (!q.cancellable) throw new ApiError(q.reason ?? 'This booking can’t be cancelled.', 409, 'NOT_CANCELLABLE')
  const updated = bookingsTable.update(id, { status: 'cancelled', cancellation: { at: nowLocalDateTime(), fee: q.fee, refundAmount: q.refund, status: 'processing' } })
  if (!updated) throw new ApiError('Booking not found.', 404, 'NOT_FOUND')
  return updated
}

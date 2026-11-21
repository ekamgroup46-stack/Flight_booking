import type { ServiceId } from '@/config/services'

/**
 * The checkout contract. Every service module converts its own selection
 * (a flight + fare, a train class, bus seats, a cab, a cargo quote) into a
 * `CheckoutItem`, so checkout, confirmation and My Bookings stay generic.
 */

export type PriceLineKind = 'base' | 'tax' | 'fee' | 'addon' | 'discount'

export interface PriceLine {
  id: string
  label: string
  amount: number
  kind: PriceLineKind
  note?: string
}

export interface Addon {
  id: string
  label: string
  description: string
  price: number
  per: 'booking' | 'traveller'
  recommended?: boolean
}

export interface ItineraryPoint {
  code?: string
  name: string
  sub?: string
  /** Local datetime `YYYY-MM-DDTHH:MM` */
  at: string
}

export interface ItinerarySegment {
  from: ItineraryPoint
  to: ItineraryPoint
  carrier: string
  reference: string
  durationMin: number
  notes: string[]
}

export type DetailsKind = 'passengers' | 'cab' | 'cargo'

export interface PassengerRequirements {
  adults: number
  children: number
  infants: number
  /** Pre-selected seats/berths, assigned to travellers in order. */
  seats?: string[]
  berthPreference?: boolean
}

export interface CheckoutItem {
  service: ServiceId
  title: string
  subtitle: string
  start: string
  end: string
  segments: ItinerarySegment[]
  highlights: string[]
  fareLines: PriceLine[]
  addons: Addon[]
  details: DetailsKind
  passengers: PassengerRequirements
  policy: { refundable: boolean; summary: string; cancellationFeePct: number }
  couponTags: string[]
  referenceLabel: string
  /** Display-only facts, e.g. { Class: '3A', Quota: 'General' }. */
  meta: Record<string, string>
}

export interface Traveller {
  id: string
  type: 'adult' | 'child' | 'infant'
  firstName: string
  lastName: string
  age: string
  gender: '' | 'female' | 'male' | 'other'
  berth?: string
  seat?: string
}

export interface Contact {
  email: string
  phone: string
  gstin?: string
}

export interface CabDetails {
  passengerName: string
  pickupAddress: string
  dropAddress?: string
  flightNumber?: string
  notes?: string
}

export interface CargoParty {
  name: string
  phone: string
  address: string
  pincode: string
}

export interface CargoDetails {
  sender: CargoParty
  receiver: CargoParty
  contents: string
  declaredValue: string
}

export interface DiscountRule {
  type: 'percent' | 'flat'
  value: number
  cap?: number
}

export interface AppliedCoupon {
  code: string
  title: string
  rule: DiscountRule
  minAmount: number
}

export interface PricingSummary {
  lines: PriceLine[]
  subtotal: number
  discount: number
  total: number
  couponNote?: string
}

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet'

export interface Booking {
  id: string
  reference: { label: string; value: string }
  service: ServiceId
  status: 'confirmed' | 'cancelled'
  createdAt: string
  item: CheckoutItem
  travellers: Traveller[]
  contact: Contact
  cab?: CabDetails
  cargo?: CargoDetails
  addons: string[]
  coupon?: AppliedCoupon
  pricing: PricingSummary
  payment: { method: PaymentMethod; label: string; txnId: string; paidAt: string }
  cancellation?: { at: string; refundAmount: number; fee: number; status: 'processing' | 'refunded' }
}

export interface CreateBookingPayload {
  item: CheckoutItem
  travellers: Traveller[]
  contact: Contact
  cab?: CabDetails
  cargo?: CargoDetails
  addons: string[]
  coupon?: AppliedCoupon
  payment: { method: PaymentMethod; label: string }
  /** Demo hook: card numbers ending 0002 decline. */
  simulateDecline?: boolean
}

export interface CancellationQuote {
  bookingId: string
  paid: number
  fee: number
  refund: number
  cancellable: boolean
  reason?: string
}

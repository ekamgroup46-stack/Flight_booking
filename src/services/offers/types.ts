import type { ServiceId } from '@/config/services'
import type { DiscountRule } from '@/services/bookings/types'

export type OfferKind = 'welcome' | 'seasonal' | 'service' | 'payment'

export interface Offer {
  id: string
  code: string
  title: string
  /** Big type on the ticket, e.g. "12% off" */
  headline: string
  description: string
  service: ServiceId | 'all'
  kind: OfferKind
  validTill: string
  minAmount: number
  discount: DiscountRule
  /** Item must carry this coupon tag (e.g. 'sleeper', 'airport'). */
  requiresTag?: string
  terms: string[]
  featured?: boolean
}

export interface CouponContext {
  service: ServiceId
  subtotal: number
  tags: string[]
}

import { useQuery } from '@tanstack/react-query'
import { appConfig } from '@/config/app.config'
import { SERVICES } from '@/config/services'
import { ApiError } from '@/lib/api/errors'
import { http } from '@/lib/api/http'
import { mockResponse } from '@/lib/api/mock'
import { formatMoney } from '@/lib/format'
import type { AppliedCoupon } from '@/services/bookings/types'
import { OFFERS } from './data'
import type { CouponContext, Offer } from './types'

const TAG_LABEL: Record<string, string> = {
  'ac-class': 'AC classes',
  sleeper: 'sleeper berths',
  airport: 'airport transfers',
  outstation: 'outstation trips',
  surface: 'surface & rail shipments',
}

function validateLocal(code: string, ctx: CouponContext): AppliedCoupon {
  const offer = OFFERS.find((o) => o.code === code.trim().toUpperCase())
  if (!offer) throw new ApiError(`“${code.toUpperCase()}” isn’t a valid code.`, 404, 'COUPON_NOT_FOUND')
  if (offer.service !== 'all' && offer.service !== ctx.service)
    throw new ApiError(`${offer.code} works on ${SERVICES[offer.service].label.toLowerCase()} only.`, 422, 'COUPON_NOT_APPLICABLE')
  if (offer.requiresTag && !ctx.tags.includes(offer.requiresTag))
    throw new ApiError(`${offer.code} applies to ${TAG_LABEL[offer.requiresTag] ?? 'selected bookings'} only.`, 422, 'COUPON_NOT_APPLICABLE')
  if (ctx.subtotal < offer.minAmount)
    throw new ApiError(`${offer.code} needs a minimum booking of ${formatMoney(offer.minAmount)}.`, 422, 'COUPON_MIN_AMOUNT')
  return { code: offer.code, title: offer.title, rule: offer.discount, minAmount: offer.minAmount }
}

export const offersApi = {
  list(): Promise<Offer[]> {
    if (appConfig.api.useMocks) return mockResponse(() => OFFERS, { latency: [200, 450], failureRate: 0 })
    return http.get<Offer[]>('/offers')
  },
  validate(code: string, ctx: CouponContext): Promise<AppliedCoupon> {
    if (appConfig.api.useMocks) return mockResponse(() => validateLocal(code, ctx), { latency: [350, 700], failureRate: 0 })
    return http.post<AppliedCoupon>('/offers/validate', { code, ...ctx })
  },
}

export function useOffers() {
  return useQuery({ queryKey: ['offers'], queryFn: offersApi.list, staleTime: 5 * 60_000 })
}

/** Offers relevant to a service, for inline suggestions at checkout. */
export function offersFor(service: Offer['service']): Offer[] {
  return OFFERS.filter((o) => o.service === 'all' || o.service === service)
}

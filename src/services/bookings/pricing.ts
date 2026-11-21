import { formatMoney } from '@/lib/format'
import type { AppliedCoupon, CheckoutItem, DiscountRule, PriceLine, PricingSummary } from './types'

export function travellerCount(item: CheckoutItem): number {
  if (item.details !== 'passengers') return 1
  return item.passengers.adults + item.passengers.children + item.passengers.infants
}

export function discountFor(rule: DiscountRule, amount: number): number {
  const raw = rule.type === 'percent' ? (amount * rule.value) / 100 : rule.value
  return Math.round(Math.min(raw, rule.cap ?? Infinity, amount))
}

/** Single place where a booking total is computed — UI and mock API both use it. */
export function computePricing(item: CheckoutItem, addonIds: string[], coupon?: AppliedCoupon): PricingSummary {
  const pax = travellerCount(item)
  const addonLines: PriceLine[] = item.addons
    .filter((a) => addonIds.includes(a.id))
    .map((a) => ({
      id: `addon-${a.id}`,
      label: a.per === 'traveller' && pax > 1 ? `${a.label} × ${pax}` : a.label,
      amount: a.per === 'traveller' ? a.price * pax : a.price,
      kind: 'addon',
    }))

  const lines: PriceLine[] = [
    ...item.fareLines,
    ...addonLines,
    { id: 'convenience', label: 'Convenience fee', amount: 0, kind: 'fee', note: 'Always ₹0 on Ekam' },
  ]
  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0)

  let discount = 0
  let couponNote: string | undefined
  if (coupon) {
    if (subtotal < coupon.minAmount) {
      couponNote = `Add ${formatMoney(coupon.minAmount - subtotal)} more to use ${coupon.code}`
    } else {
      discount = discountFor(coupon.rule, subtotal)
    }
  }

  return { lines, subtotal, discount, total: Math.max(0, subtotal - discount), couponNote }
}

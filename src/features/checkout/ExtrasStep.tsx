import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Check, Plus, Tag, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Display'
import { Input } from '@/components/ui/Field'
import { getErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import { travellerCount } from '@/services/bookings/pricing'
import type { PricingSummary } from '@/services/bookings/types'
import { offersApi, offersFor } from '@/services/offers/api'
import { useCheckoutStore } from '@/store/checkout.store'
import { toast } from '@/store/toast.store'
import s from './Checkout.module.css'

export function ExtrasStep({ pricing }: { pricing: PricingSummary }) {
  const draft = useCheckoutStore((st) => st.draft!)
  const toggleAddon = useCheckoutStore((st) => st.toggleAddon)
  const setCoupon = useCheckoutStore((st) => st.setCoupon)
  const [code, setCode] = useState('')
  const pax = travellerCount(draft.item)
  const suggestions = offersFor(draft.item.service).slice(0, 4)

  const validate = useMutation({
    mutationFn: (c: string) =>
      offersApi.validate(c, {
        service: draft.item.service,
        subtotal: pricing.subtotal,
        tags: draft.item.couponTags,
      }),
    onSuccess: (coupon) => {
      setCoupon(coupon)
      setCode('')
      toast.success(`${coupon.code} applied`, coupon.title)
    },
  })

  const apply = (e?: FormEvent, value = code) => {
    e?.preventDefault()
    if (value.trim()) validate.mutate(value.trim())
  }

  return (
    <div className={s.stepBody}>
      <section className={s.block}>
        <h2 className={s.blockTitle}>Make the trip smoother</h2>
        <p className={s.blockSub}>Optional. Nothing here is pre-selected — add only what you need.</p>
        <div className={s.addons}>
          {draft.item.addons.map((a) => {
            const on = draft.addons.includes(a.id)
            const price = a.per === 'traveller' ? a.price * pax : a.price
            return (
              <button key={a.id} type="button" aria-pressed={on} className={cn(s.addon, on && s.addonOn)} onClick={() => toggleAddon(a.id)}>
                <span className={s.addonCheck}>{on ? <Check /> : <Plus />}</span>
                <span className={s.addonText}>
                  <strong>
                    {a.label} {a.recommended && <Badge tone="accent">Popular</Badge>}
                  </strong>
                  <span>{a.description}</span>
                </span>
                <span className={s.addonPrice}>
                  {formatMoney(price)}
                  {a.per === 'traveller' && pax > 1 && <em>{formatMoney(a.price)} × {pax}</em>}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className={s.block}>
        <h2 className={s.blockTitle}>Offers & coupons</h2>
        {draft.coupon ? (
          <div className={s.applied}>
            <Tag />
            <div>
              <strong>{draft.coupon.code}</strong>
              <span>{pricing.discount > 0 ? `You save ${formatMoney(pricing.discount)} · ${draft.coupon.title}` : pricing.couponNote}</span>
            </div>
            <button type="button" onClick={() => setCoupon(undefined)} aria-label="Remove coupon">
              <X />
            </button>
          </div>
        ) : (
          <>
            <form className={s.couponRow} onSubmit={apply}>
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Enter coupon code" icon={<Tag />} aria-label="Coupon code" invalid={validate.isError} />
              <Button type="submit" variant="secondary" loading={validate.isPending}>
                Apply
              </Button>
            </form>
            {validate.isError && <p className={s.couponError}>{getErrorMessage(validate.error)}</p>}
            <div className={s.suggestions}>
              {suggestions.map((o) => (
                <button key={o.id} type="button" className={s.suggestion} onClick={() => apply(undefined, o.code)} disabled={validate.isPending}>
                  <span className="mono">{o.code}</span>
                  <span>{o.description}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

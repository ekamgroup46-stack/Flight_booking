import { useState } from 'react'
import { ChevronUp, Tag } from 'lucide-react'
import { Roundel } from '@/components/brand/Brand'
import { HoldTimer } from '@/components/ui/Display'
import { SERVICES } from '@/config/services'
import { cn } from '@/lib/cn'
import { dateOf, timeOf } from '@/lib/dates'
import { formatDate, formatMoney } from '@/lib/format'
import type { PricingSummary } from '@/services/bookings/types'
import type { CheckoutDraft } from '@/store/checkout.store'
import s from './Checkout.module.css'

export function PriceBreakdown({ pricing, couponCode }: { pricing: PricingSummary; couponCode?: string }) {
  return (
    <>
      <dl className={s.lines}>
        {pricing.lines.map((l) => (
          <div key={l.id} className={l.kind === 'addon' ? s.lineAddon : undefined}>
            <dt>
              {l.label}
              {l.note && <em>{l.note}</em>}
            </dt>
            <dd>{l.amount === 0 && l.kind === 'fee' ? <span className={s.free}>₹0</span> : formatMoney(l.amount)}</dd>
          </div>
        ))}
        {pricing.discount > 0 && (
          <div className={s.lineDiscount}>
            <dt>
              <Tag size={13} /> {couponCode}
            </dt>
            <dd>−{formatMoney(pricing.discount)}</dd>
          </div>
        )}
      </dl>
      {pricing.couponNote && <p className={s.couponNote}>{pricing.couponNote}</p>}
      <div className={s.total}>
        <span>Total</span>
        <strong>{formatMoney(pricing.total)}</strong>
      </div>
    </>
  )
}

export function CheckoutSummary({ draft, pricing, onExpire }: { draft: CheckoutDraft; pricing: PricingSummary; onExpire: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { item } = draft
  const meta = SERVICES[item.service]
  return (
    <aside className={cn(s.summary, mobileOpen && s.summaryOpen)} aria-label="Booking summary">
      <button type="button" className={s.summaryToggle} onClick={() => setMobileOpen((o) => !o)} aria-expanded={mobileOpen}>
        <span>
          Total <strong>{formatMoney(pricing.total)}</strong>
        </span>
        <span className={s.toggleHint}>
          {mobileOpen ? 'Hide' : 'Details'} <ChevronUp />
        </span>
      </button>
      <div className={s.summaryBody}>
        <div className={s.summaryHead}>
          <span className={s.summaryService}>
            <Roundel service={item.service} size={24} /> {meta.label}
          </span>
          {item.service !== 'cargo' && <HoldTimer until={draft.holdUntil} onExpire={onExpire} />}
        </div>
        <h2 className={s.summaryTitle}>{item.title}</h2>
        <p className={s.summarySub}>{item.subtitle}</p>
        <ol className={s.segs}>
          {item.segments.map((seg, i) => (
            <li key={i}>
              <div className={s.segRail} aria-hidden />
              <div>
                <span className={s.segTime}>
                  {timeOf(seg.from.at)} <em>{formatDate(dateOf(seg.from.at), 'short')}</em>
                </span>
                <strong>
                  {seg.from.code && <b className="mono">{seg.from.code}</b>} {seg.from.name}
                </strong>
              </div>
              <div className={s.segCarrier}>
                {seg.carrier} · {seg.reference}
              </div>
              <div>
                <span className={s.segTime}>
                  {timeOf(seg.to.at)} <em>{formatDate(dateOf(seg.to.at), 'short')}</em>
                </span>
                <strong>
                  {seg.to.code && <b className="mono">{seg.to.code}</b>} {seg.to.name}
                </strong>
              </div>
            </li>
          ))}
        </ol>
        <PriceBreakdown pricing={pricing} couponCode={draft.coupon?.code} />
        <p className={s.policy}>{item.policy.summary}</p>
      </div>
    </aside>
  )
}

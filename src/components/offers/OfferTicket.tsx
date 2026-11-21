import { useState } from 'react'
import { SERVICES } from '@/config/services'
import { cn } from '@/lib/cn'
import { formatDate, formatMoney } from '@/lib/format'
import type { Offer } from '@/services/offers/types'
import { Roundel, Ticket } from '../brand/Brand'
import { CopyButton } from '../ui/Display'
import s from './OfferTicket.module.css'

const KIND_LABEL: Record<Offer['kind'], string> = {
  welcome: 'Welcome offer',
  seasonal: 'Seasonal',
  service: 'Everyday',
  payment: 'Payment offer',
}

export function OfferTicket({ offer, className }: { offer: Offer; className?: string }) {
  const [showTerms, setShowTerms] = useState(false)
  const service = offer.service === 'all' ? null : SERVICES[offer.service]
  return (
    <Ticket notch="70%" className={cn(s.wrap, className)} innerClassName={s.ticket}>
      <div className={s.main} data-service={offer.service === 'all' ? undefined : offer.service}>
        <div className={s.top}>
          {service ? <Roundel service={service.id} size={26} /> : <span className={s.allDot} aria-hidden />}
          <span className={s.kind}>
            {service ? service.label : 'All modes'} · {KIND_LABEL[offer.kind]}
          </span>
        </div>
        <p className={s.headline}>{offer.headline}</p>
        <h3 className={s.title}>{offer.title}</h3>
        <p className={s.desc}>{offer.description}</p>
        <button type="button" className={s.termsBtn} onClick={() => setShowTerms((v) => !v)} aria-expanded={showTerms}>
          {showTerms ? 'Hide terms' : 'Terms apply'}
        </button>
        {showTerms && (
          <ul className={s.terms}>
            {offer.terms.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
      </div>
      <div className={s.stub}>
        <span className={s.codeLabel}>Code</span>
        <span className={s.code}>{offer.code}</span>
        <CopyButton value={offer.code} />
        <span className={s.valid}>
          Min. {formatMoney(offer.minAmount)}
          <br />
          Till {formatDate(offer.validTill, 'short')}
        </span>
      </div>
    </Ticket>
  )
}

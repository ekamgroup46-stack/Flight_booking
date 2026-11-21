import { useMemo, useState } from 'react'
import { ArrowRight, BadgePercent } from 'lucide-react'
import { LineBundle } from '@/components/brand/Brand'
import { SectionHead } from '@/components/layout/Section'
import { OfferTicket } from '@/components/offers/OfferTicket'
import { ButtonLink } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/Display'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Chip } from '@/components/ui/Field'
import { ROUTES } from '@/config/routes'
import { SERVICE_ORDER, SERVICES, type ServiceId } from '@/config/services'
import { useDocumentTitle } from '@/hooks'
import { useOffers } from '@/services/offers/api'
import s from './Offers.module.css'

type Filter = ServiceId | 'all' | 'payment'

export default function OffersPage() {
  useDocumentTitle('Offers & deals')
  const { data, isLoading, isError, error, refetch } = useOffers()
  const [filter, setFilter] = useState<Filter>('all')
  const list = useMemo(
    () => (data ?? []).filter((o) => filter === 'all' || (filter === 'payment' ? o.kind === 'payment' : o.service === filter || (o.service === 'all' && o.kind !== 'payment'))),
    [data, filter],
  )

  return (
    <div className="container" style={{ paddingTop: 56 }}>
      <SectionHead
        eyebrow="Offers & deals"
        title={
          <>
            Deals that <span className="serif-i">don’t</span> hide in fine print.
          </>
        }
        lede="Every condition is on the ticket. Copy a code, or let checkout apply the best one for you."
      />

      <div className={s.featured}>
        <div className={s.welcome} data-reveal>
          <LineBundle thickness={3} gap={3} className={s.welcomeBundle} />
          <span className={s.welcomeKicker}>
            <BadgePercent /> New to Ekam
          </span>
          <h2>
            12% off your <span className="serif-i">first</span> journey.
          </h2>
          <p>Any mode, any route. Up to ₹1,500 off when you book your first trip or shipment.</p>
          <div className={s.welcomeCode}>
            <span className="mono">EKAMFIRST</span>
            <CopyButton value="EKAMFIRST" />
          </div>
        </div>
        <div className={s.resort} data-reveal data-reveal-media data-service="flights">
          <img src="/images/misc/offer-resort.webp" alt="" loading="lazy" />
          <div className={s.resortText}>
            <span>Long-weekend escapes</span>
            <h3>Fly out Friday, back by Monday.</h3>
            <ButtonLink to={ROUTES.flights} variant="glass" iconRight={<ArrowRight />}>
              Explore flights
            </ButtonLink>
          </div>
        </div>
      </div>

      <div className={s.filters} role="group" aria-label="Filter offers">
        {(['all', ...SERVICE_ORDER, 'payment'] as Filter[]).map((f) => (
          <Chip key={f} selected={filter === f} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All offers' : f === 'payment' ? 'Payment offers' : SERVICES[f].label}
          </Chip>
        ))}
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <div className={s.grid}>
          {isLoading
            ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} h={236} r={16} />)
            : list.map((o) => (
                <div key={o.id} data-reveal>
                  <OfferTicket offer={o} />
                </div>
              ))}
        </div>
      )}
    </div>
  )
}

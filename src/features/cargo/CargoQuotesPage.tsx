import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Check, Gauge, Leaf, Scale } from 'lucide-react'
import { Roundel } from '@/components/brand/Brand'
import { InvalidSearchGuard, Notice, ResultSkeletons, ResultsHeader, ResultsLayout, SortBar } from '@/components/results'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Display'
import { EmptyState, ErrorState } from '@/components/ui/Feedback'
import { Chip } from '@/components/ui/Field'
import { useDocumentTitle } from '@/hooks'
import { cn } from '@/lib/cn'
import { formatDate, formatMoney, formatNumber } from '@/lib/format'
import { useCargoQuote } from '@/services/cargo/api'
import { cargoToCheckoutItem } from '@/services/cargo/checkout'
import { parseCargoSearch } from '@/services/cargo/query'
import { SHIPMENT_TYPE_LABEL, type CargoQuote, type CargoSearchParams } from '@/services/cargo/types'
import { useStartCheckout } from '../checkout/useStartCheckout'
import { CargoSearchForm } from './CargoSearchForm'
import s from './CargoQuotes.module.css'

export default function CargoQuotesPage() {
  const [sp] = useSearchParams()
  const params = useMemo(() => parseCargoSearch(sp), [sp])
  return (
    <div data-service="cargo">
      <InvalidSearchGuard service="cargo" valid={!!params} form={<CargoSearchForm tone="light" />}>
        {params && <CargoQuotes key={sp.toString()} params={params} />}
      </InvalidSearchGuard>
    </div>
  )
}

type CargoSort = 'price' | 'speed' | 'green'

function CargoQuotes({ params }: { params: CargoSearchParams }) {
  const { data, isLoading, isError, error, refetch } = useCargoQuote(params)
  const [sort, setSort] = useState<CargoSort>('price')
  const [slots, setSlots] = useState<Record<string, string>>({})
  const startCheckout = useStartCheckout()
  useDocumentTitle(data ? `Ship ${data.from.name} to ${data.to.name}` : 'Cargo quotes')

  const quotes = useMemo(() => {
    const list = [...(data?.quotes ?? [])]
    if (sort === 'speed') list.sort((a, b) => a.transitDays[0] - b.transitDays[0] || a.price - b.price)
    if (sort === 'green') list.sort((a, b) => a.co2Kg - b.co2Kg)
    if (sort === 'price') list.sort((a, b) => a.price - b.price)
    return list
  }, [data, sort])
  const maxCo2 = Math.max(1, ...quotes.map((q) => q.co2Kg))

  const book = (q: CargoQuote) => {
    if (!data) return
    startCheckout(cargoToCheckoutItem(params, data, q, slots[q.id] ?? data.pickupSlots[0]))
  }

  return (
    <>
      <ResultsHeader
        eyebrow={
          <>
            <Roundel service="cargo" size={20} /> Cargo · {SHIPMENT_TYPE_LABEL[params.type]}
          </>
        }
        title={data ? `${data.from.name} → ${data.to.name}` : 'Cargo quotes'}
        meta={`Pickup ${formatDate(params.date, 'long')} · ${formatNumber(params.weight, 1)} kg · ${params.pieces} piece${params.pieces > 1 ? 's' : ''}`}
        form={<CargoSearchForm initial={params} compact tone="light" />}
      />
      <ResultsLayout>
        {isLoading ? (
          <ResultSkeletons height={170} count={4} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : !data || !quotes.length ? (
          <EmptyState title="No services for this shipment" body="Try a different shipment type or weight — for example, switch to Pallets for anything above 70 kg." />
        ) : (
          <>
            <div className={s.weights}>
              <div>
                <Scale />
                <span>Actual weight</span>
                <strong>{formatNumber(data.actualKg, 1)} kg</strong>
              </div>
              <div>
                <Gauge />
                <span>Volumetric weight</span>
                <strong>{data.volumetricKg ? `${formatNumber(data.volumetricKg, 1)} kg` : 'Add dimensions'}</strong>
              </div>
              <div className={s.charge}>
                <span>You’re charged for</span>
                <strong>{formatNumber(data.chargeableKg, 1)} kg</strong>
                <em>the higher of the two · {data.distanceKm} km by road</em>
              </div>
            </div>
            <SortBar
              value={sort}
              onChange={setSort}
              count={quotes.length}
              options={[
                { id: 'price', label: 'Lowest price', meta: formatMoney(Math.min(...quotes.map((q) => q.price))) },
                { id: 'speed', label: 'Fastest', meta: `${Math.min(...quotes.map((q) => q.transitDays[0]))} day min` },
                { id: 'green', label: 'Greenest', meta: `${Math.min(...quotes.map((q) => q.co2Kg))} kg CO₂e` },
              ]}
            />
            {quotes.map((q) => (
              <article key={q.id} className={cn(s.quote, q.badge && s.featured)}>
                <div className={s.main}>
                  <div className={s.head}>
                    <h3>{q.name}</h3>
                    {q.badge && <Badge tone={q.badge === 'Greenest' ? 'ok' : 'accent'}>{q.badge}</Badge>}
                  </div>
                  <p className={s.tagline}>{q.vehicle ?? q.tagline}</p>
                  <ul className={s.features}>
                    {q.features.map((f) => (
                      <li key={f}>
                        <Check /> {f}
                      </li>
                    ))}
                  </ul>
                  <div className={s.co2}>
                    <span>
                      <Leaf /> {q.co2Kg} kg CO₂e
                    </span>
                    <i>
                      <b style={{ width: `${Math.max(3, (q.co2Kg / maxCo2) * 100)}%` }} />
                    </i>
                  </div>
                </div>
                <div className={s.when}>
                  <span className={s.label}>Delivery</span>
                  <strong>
                    {q.transitDays[0] === q.transitDays[1] ? q.transitDays[0] : `${q.transitDays[0]}–${q.transitDays[1]}`} day{q.transitDays[1] > 1 ? 's' : ''}
                  </strong>
                  <span>by {formatDate(q.deliveryBy, 'medium')}</span>
                  <span className={s.label} style={{ marginTop: 14 }}>
                    Pickup slot
                  </span>
                  <div className={s.slots}>
                    {data.pickupSlots.map((slot) => (
                      <Chip key={slot} selected={(slots[q.id] ?? data.pickupSlots[0]) === slot} onClick={() => setSlots((x) => ({ ...x, [q.id]: slot }))}>
                        {slot}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div className={s.priceCol}>
                  <span className={s.price}>{formatMoney(q.price)}</span>
                  <span className={s.gst}>incl. GST & fuel</span>
                  <Button variant="accent" onClick={() => book(q)}>
                    Book pickup
                  </Button>
                </div>
              </article>
            ))}
            <Notice>
              <Leaf /> Emissions are estimated per shipment using standard factors for each mode (air 0.60, road ~0.10, rail 0.03 kg CO₂e per tonne-km).
            </Notice>
          </>
        )}
      </ResultsLayout>
    </>
  )
}

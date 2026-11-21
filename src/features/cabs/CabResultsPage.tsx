import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Briefcase, Check, Fuel, Leaf, Minus, Star, Users } from 'lucide-react'
import { Roundel } from '@/components/brand/Brand'
import { InvalidSearchGuard, ResultSkeletons, ResultsHeader, ResultsLayout, SortBar } from '@/components/results'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Display'
import { ErrorState } from '@/components/ui/Feedback'
import { useDocumentTitle } from '@/hooks'
import { cn } from '@/lib/cn'
import { formatDate, formatDuration, formatMoney } from '@/lib/format'
import { useCabQuote } from '@/services/cabs/api'
import { cabToCheckoutItem } from '@/services/cabs/checkout'
import { parseCabSearch } from '@/services/cabs/query'
import { PACKAGE_LABEL, TRIP_LABEL, type CabOption, type CabQuoteResult, type CabSearchParams } from '@/services/cabs/types'
import { useStartCheckout } from '../checkout/useStartCheckout'
import { CabSearchForm } from './CabSearchForm'
import s from './CabResults.module.css'

export default function CabResultsPage() {
  const [sp] = useSearchParams()
  const params = useMemo(() => parseCabSearch(sp), [sp])
  return (
    <div data-service="cabs">
      <InvalidSearchGuard service="cabs" valid={!!params} form={<CabSearchForm tone="light" />}>
        {params && <CabResults key={sp.toString()} params={params} />}
      </InvalidSearchGuard>
    </div>
  )
}

/** Abstract city map with the route drawn between real coordinates. */
function RouteMap({ quote }: { quote: CabQuoteResult }) {
  const W = 520
  const H = 300
  const pad = 70
  const a = quote.from
  const b = quote.to ?? quote.from
  const minLon = Math.min(a.lon, b.lon)
  const maxLon = Math.max(a.lon, b.lon)
  const minLat = Math.min(a.lat, b.lat)
  const maxLat = Math.max(a.lat, b.lat)
  const span = Math.max(maxLon - minLon, maxLat - minLat, 0.02)
  const project = (lat: number, lon: number) => {
    const x = pad + ((lon - minLon) / span) * (W - pad * 2) + ((W - pad * 2) * (1 - (maxLon - minLon) / span)) / 2
    const y = H - pad - ((lat - minLat) / span) * (H - pad * 2) - ((H - pad * 2) * (1 - (maxLat - minLat) / span)) / 2
    return [x, y]
  }
  const [x1, y1] = project(a.lat, a.lon)
  const [x2, y2] = quote.to ? project(b.lat, b.lon) : [x1 + 120, y1 - 40]
  const cx = (x1 + x2) / 2 + (y2 - y1) * 0.25
  const cy = (y1 + y2) / 2 - (x2 - x1) * 0.25
  const path = `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={s.map} role="img" aria-label={`Route from ${a.name}${quote.to ? ` to ${quote.to.name}` : ''}`}>
      <defs>
        <pattern id="streets" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">
          <path d="M0 20H40M20 0V40" stroke="rgba(11,18,32,.06)" strokeWidth="6" />
          <path d="M0 20H40M20 0V40" stroke="#fff" strokeWidth="3" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="#efeee8" />
      <rect width={W} height={H} fill="url(#streets)" />
      <path d={`M-10 ${H * 0.78} C ${W * 0.3} ${H * 0.62}, ${W * 0.55} ${H * 0.98}, ${W + 10} ${H * 0.7}`} fill="none" stroke="#cfe0f2" strokeWidth="22" strokeLinecap="round" />
      <ellipse cx={W * 0.78} cy={H * 0.24} rx="58" ry="34" fill="#dfead8" />
      <ellipse cx={W * 0.18} cy={H * 0.3} rx="40" ry="26" fill="#dfead8" />
      {quote.to ? (
        <>
          <path d={path} fill="none" stroke="rgba(11,18,32,.18)" strokeWidth="9" strokeLinecap="round" />
          <path d={path} fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
          <path d={path} fill="none" stroke="var(--ink-900)" strokeWidth="1.6" strokeDasharray="2 9" strokeLinecap="round" className={s.dash} />
        </>
      ) : (
        <circle cx={x1} cy={y1} r="92" fill="color-mix(in srgb, var(--accent) 14%, transparent)" stroke="var(--accent)" strokeDasharray="4 6" strokeWidth="2" />
      )}
      <g transform={`translate(${x1} ${y1})`}>
        <circle r="13" fill="#fff" stroke="var(--ink-900)" strokeWidth="4" />
      </g>
      {quote.to && (
        <g transform={`translate(${x2} ${y2})`}>
          <path d="M0 0 C -14 -16 -14 -36 0 -36 C 14 -36 14 -16 0 0Z" fill="var(--ink-900)" />
          <circle cy="-24" r="5.5" fill="var(--accent)" />
        </g>
      )}
    </svg>
  )
}

function CabCard({ option, onBook, open, onToggle }: { option: CabOption; onBook: () => void; open: boolean; onToggle: () => void }) {
  return (
    <article className={cn(s.card, open && s.open)}>
      <div className={s.row}>
        <div className={s.carArt} aria-hidden>
          <span>{option.name.split(' ')[0]}</span>
        </div>
        <div className={s.info}>
          <div className={s.title}>
            <strong>{option.name}</strong>
            {option.tag && <Badge tone={option.tag === 'Zero tailpipe' ? 'ok' : 'accent'}>{option.tag}</Badge>}
          </div>
          <span className={s.model}>{option.model}</span>
          <div className={s.specs}>
            <span>
              <Users /> {option.seats}
            </span>
            <span>
              <Briefcase /> {option.bags}
            </span>
            <span>
              {option.fuel === 'Electric' ? <Leaf /> : <Fuel />} {option.fuel}
            </span>
            <span>
              <Star /> {option.rating}
            </span>
            {option.etaMin && <span className={s.eta}>{option.etaMin} min away</span>}
          </div>
        </div>
        <div className={s.priceCol}>
          {option.strikePrice && <s className={s.strike}>{formatMoney(option.strikePrice)}</s>}
          <span className={s.price}>{formatMoney(option.price)}</span>
          <span className={s.incl}>All-inclusive</span>
          <div className={s.actions}>
            <Button size="sm" variant="ghost" onClick={onToggle} aria-expanded={open}>
              {open ? 'Less' : 'Details'}
            </Button>
            <Button size="sm" variant="accent" onClick={onBook}>
              Book
            </Button>
          </div>
        </div>
      </div>
      {open && (
        <div className={s.details}>
          <div>
            <h4>Included</h4>
            <ul>
              {option.inclusions.map((i) => (
                <li key={i}>
                  <Check /> {i}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Not included</h4>
            <ul>
              {option.exclusions.map((i) => (
                <li key={i} className={s.ex}>
                  <Minus /> {i}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Good to know</h4>
            <ul>
              <li>Extra km: ₹{option.extraKm}/km</li>
              {option.extraHour && <li>Extra hour: ₹{option.extraHour}</li>}
              <li>{option.cancellation}</li>
            </ul>
          </div>
        </div>
      )}
    </article>
  )
}

type CabSort = 'recommended' | 'price' | 'capacity'

function CabResults({ params }: { params: CabSearchParams }) {
  const { data, isLoading, isError, error, refetch } = useCabQuote(params)
  const [sort, setSort] = useState<CabSort>('recommended')
  const [open, setOpen] = useState<string | null>(null)
  const startCheckout = useStartCheckout()
  useDocumentTitle(data ? `Cabs from ${data.from.name}` : 'Cabs')

  const options = useMemo(() => {
    const list = [...(data?.options ?? [])]
    if (sort === 'price') list.sort((a, b) => a.price - b.price)
    if (sort === 'capacity') list.sort((a, b) => b.seats - a.seats || b.bags - a.bags)
    return list
  }, [data, sort])

  return (
    <>
      <ResultsHeader
        eyebrow={
          <>
            <Roundel service="cabs" size={20} /> Cabs · {TRIP_LABEL[params.trip]}
          </>
        }
        title={data ? (data.to ? `${data.from.name} → ${data.to.name}` : `${data.from.name} · ${PACKAGE_LABEL[data.pkg ?? '4-40']}`) : 'Cabs'}
        meta={`${formatDate(params.date, 'long')} · Pickup ${params.time}${params.trip === 'round' && params.ret ? ` · Return ${formatDate(params.ret, 'medium')}` : ''}`}
        form={<CabSearchForm initial={params} compact tone="light" />}
      />
      <ResultsLayout>
        {isLoading ? (
          <ResultSkeletons height={140} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : data ? (
          <div className={s.grid}>
            <aside className={s.tripCard}>
              <RouteMap quote={data} />
              <dl className={s.facts}>
                <div>
                  <dt>Distance</dt>
                  <dd>{data.distanceKm} km</dd>
                </div>
                <div>
                  <dt>Est. time</dt>
                  <dd>{formatDuration(data.durationMin)}</dd>
                </div>
                <div>
                  <dt>{params.trip === 'rental' ? 'Package' : 'Tolls (incl.)'}</dt>
                  <dd>{params.trip === 'rental' ? PACKAGE_LABEL[data.pkg ?? '4-40'] : formatMoney(data.tolls)}</dd>
                </div>
              </dl>
              <ol className={s.stops}>
                <li>
                  <i className={s.pickup} />
                  <span>
                    <em>Pickup · {params.time}</em>
                    <strong>{data.from.name}</strong>
                    <span>{data.from.city}</span>
                  </span>
                </li>
                {data.to && (
                  <li>
                    <i className={s.drop} />
                    <span>
                      <em>Drop</em>
                      <strong>{data.to.name}</strong>
                      <span>{data.to.city}</span>
                    </span>
                  </li>
                )}
              </ol>
            </aside>
            <div className={s.list}>
              <SortBar
                value={sort}
                onChange={setSort}
                count={options.length}
                options={[
                  { id: 'recommended', label: 'Recommended' },
                  { id: 'price', label: 'Lowest price', meta: formatMoney(Math.min(...options.map((o) => o.price))) },
                  { id: 'capacity', label: 'Most space' },
                ]}
              />
              {options.map((o) => (
                <CabCard key={o.id} option={o} open={open === o.id} onToggle={() => setOpen(open === o.id ? null : o.id)} onBook={() => startCheckout(cabToCheckoutItem(params, data, o))} />
              ))}
            </div>
          </div>
        ) : null}
      </ResultsLayout>
    </>
  )
}

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { withQuery } from '@/config/routes'
import { SERVICES } from '@/config/services'
import { Chip } from '@/components/ui/Field'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { addDays, parseISODate, todayISO } from '@/lib/dates'
import { formatDate, formatMoney, formatMoneyCompact } from '@/lib/format'
import { useFareCalendar } from '@/services/flights/api'
import { findAirport } from '@/services/locations/api'
import s from './FareTrend.module.css'

const ROUTES_TO_WATCH: Array<[string, string]> = [
  ['DEL', 'BOM'],
  ['BLR', 'GOX'],
  ['BOM', 'DXB'],
  ['MAA', 'SIN'],
  ['DEL', 'SXR'],
]
const DAYS = 30

/** "When to fly" — lowest one-way fare per day for the next 30 days. */
export function FareTrend() {
  const [route, setRoute] = useState(ROUTES_TO_WATCH[0])
  const [showTable, setShowTable] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const start = addDays(todayISO(), 1)
  const { data, isLoading, isError, error, refetch } = useFareCalendar(route[0], route[1], start, DAYS)
  const navigate = useNavigate()

  const stats = useMemo(() => {
    const prices = (data ?? []).map((d) => d.price ?? 0).filter(Boolean)
    if (!prices.length) return null
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    const cheapestIdx = (data ?? []).findIndex((d) => d.price === min)
    return { min, max, avg, cheapestIdx }
  }, [data])

  const ceil = stats ? Math.ceil((stats.max * 1.08) / 1000) * 1000 : 1
  const ticks = [0, 0.5, 1].map((t) => Math.round(ceil * t))
  const search = (date: string) =>
    navigate(withQuery(SERVICES.flights.resultsPath, { trip: 'oneway', from: route[0], to: route[1], depart: date, adults: '1', cabin: 'economy' }))

  const a = findAirport(route[0])
  const b = findAirport(route[1])

  return (
    <div className={s.card} data-reveal>
      <div className={s.top}>
        <div>
          <h3 className={s.title}>
            Lowest one-way fare per day, {a?.city} → {b?.city}
          </h3>
          <p className={s.sub}>Next {DAYS} days · per adult, taxes included · tap a bar to search that date</p>
        </div>
        <div className={s.routes} role="group" aria-label="Choose route">
          {ROUTES_TO_WATCH.map((r) => (
            <Chip key={r.join()} selected={r === route} onClick={() => setRoute(r)}>
              <span className="mono">
                {r[0]} → {r[1]}
              </span>
            </Chip>
          ))}
        </div>
      </div>

      {stats && (
        <dl className={s.kpis}>
          <div>
            <dt>Cheapest day</dt>
            <dd>
              {formatMoney(stats.min)} <em>{formatDate(data![stats.cheapestIdx].date, 'medium')}</em>
            </dd>
          </div>
          <div>
            <dt>30-day average</dt>
            <dd>{formatMoney(stats.avg)}</dd>
          </div>
          <div>
            <dt>Book the cheapest day and save</dt>
            <dd>{formatMoney(stats.max - stats.min)}</dd>
          </div>
        </dl>
      )}

      {isError ? (
        <ErrorState compact error={error} onRetry={() => refetch()} />
      ) : isLoading || !data || !stats ? (
        <div className={s.loading}>
          {Array.from({ length: DAYS }, (_, i) => (
            <Skeleton key={i} h={`${30 + ((i * 37) % 60)}%`} r={4} />
          ))}
        </div>
      ) : showTable ? (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <caption className="sr-only">Lowest fare per day</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Lowest fare</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.date}>
                  <td>{formatDate(d.date, 'medium')}</td>
                  <td>{d.price ? formatMoney(d.price) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={s.chart}>
          <div className={s.grid} aria-hidden>
            {ticks
              .slice()
              .reverse()
              .map((t) => (
                <span key={t}>
                  <em>{formatMoneyCompact(t)}</em>
                </span>
              ))}
          </div>
          <div className={s.bars} onMouseLeave={() => setHover(null)}>
            {data.map((d, i) => {
              const h = d.price ? (d.price / ceil) * 100 : 0
              const cheapest = i === stats.cheapestIdx
              const weekend = [0, 6].includes(parseISODate(d.date).getDay())
              return (
                <button
                  key={d.date}
                  type="button"
                  className={s.col}
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  onClick={() => search(d.date)}
                  aria-label={`${formatDate(d.date, 'long')}: ${d.price ? formatMoney(d.price) : 'no flights'}`}
                >
                  <span className={`${s.bar} ${cheapest ? s.barMin : ''} ${hover === i ? s.barHover : ''}`} style={{ height: `${h}%` }}>
                    {cheapest && <b className={s.direct}>{formatMoneyCompact(d.price!)}</b>}
                  </span>
                  {hover === i && (
                    <span className={s.tip} role="tooltip" style={{ bottom: `calc(${h}% + 14px)` }}>
                      <strong>{formatMoney(d.price ?? 0)}</strong>
                      <span>{formatDate(d.date, 'medium')}</span>
                    </span>
                  )}
                  <span className={`${s.tick} ${weekend ? s.weekend : ''}`}>{i % 3 === 0 ? parseISODate(d.date).getDate() : ''}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
      <div className={s.foot}>
        <button type="button" className={s.toggle} onClick={() => setShowTable((v) => !v)} aria-pressed={showTable}>
          {showTable ? 'Show chart' : 'View as table'}
        </button>
        <span>Fares are indicative and refresh every few minutes.</span>
      </div>
    </div>
  )
}

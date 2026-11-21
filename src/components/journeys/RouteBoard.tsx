import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { SERVICE_ORDER, SERVICES, type ServiceId } from '@/config/services'
import { POPULAR_ROUTES, routeLink, type PopularRoute } from '@/content/journeys'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import { Roundel } from '../brand/Brand'
import s from './RouteBoard.module.css'

/** Popular routes rendered as a station departure board. */
export function RouteBoard({ service, limit = 8, title = 'Popular routes' }: { service?: ServiceId; limit?: number; title?: string }) {
  const [filter, setFilter] = useState<ServiceId | 'all'>(service ?? 'all')
  const rows: PopularRoute[] = POPULAR_ROUTES.filter((r) => filter === 'all' || r.service === filter).slice(0, limit)

  return (
    <div className={s.board} data-reveal>
      <div className={s.head}>
        <div className={s.title}>
          <span className={s.live} aria-hidden />
          {title}
        </div>
        {!service && (
          <div className={s.filters} role="group" aria-label="Filter routes by mode">
            {(['all', ...SERVICE_ORDER] as const).map((id) => (
              <button key={id} type="button" aria-pressed={filter === id} className={cn(s.filter, filter === id && s.filterOn)} onClick={() => setFilter(id)} style={id !== 'all' ? { ['--line' as string]: SERVICES[id].color } : undefined}>
                {id !== 'all' && <i />}
                {id === 'all' ? 'All' : SERVICES[id].label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className={s.table} role="table" aria-label={title}>
        <div className={cn(s.row, s.headerRow)} role="row">
          <span role="columnheader">Mode</span>
          <span role="columnheader">Route</span>
          <span role="columnheader" className={s.hideSm}>
            Journey
          </span>
          <span role="columnheader" className={s.hideMd}>
            Frequency
          </span>
          <span role="columnheader" className={s.right}>
            From
          </span>
          <span aria-hidden />
        </div>
        {rows.map((r) => (
          <Link key={r.id} to={routeLink(r)} className={s.row} role="row" style={{ ['--line' as string]: SERVICES[r.service].color }}>
            <span role="cell" className={s.mode}>
              <Roundel service={r.service} size={26} />
              <em className={s.hideSm}>{SERVICES[r.service].label}</em>
            </span>
            <span role="cell" className={s.route}>
              <b>{r.fromCode}</b>
              <span className={s.track} aria-hidden />
              <b>{r.toCode}</b>
              <em>
                {r.from} to {r.to}
              </em>
            </span>
            <span role="cell" className={cn(s.mono, s.hideSm)}>
              {r.duration}
            </span>
            <span role="cell" className={cn(s.muted, s.hideMd)}>
              {r.frequency}
            </span>
            <span role="cell" className={cn(s.price, s.right)}>
              {formatMoney(r.fromPrice)}
            </span>
            <span role="cell" className={s.go} aria-label={`Search ${r.from} to ${r.to}`}>
              <ArrowRight />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

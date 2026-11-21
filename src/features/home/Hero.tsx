import { useEffect, useState, type KeyboardEvent, type ReactElement } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { Roundel, SplitFlap } from '@/components/brand/Brand'
import { appConfig } from '@/config/app.config'
import { ROUTES } from '@/config/routes'
import { SERVICE_ORDER, SERVICES, type ServiceId } from '@/config/services'
import { DEPARTURES } from '@/content/journeys'
import { useMediaQuery, useNow } from '@/hooks'
import { cn } from '@/lib/cn'
import { useSearchStore } from '@/store/search.store'
import { BusSearchForm } from '../buses/BusSearchForm'
import { CabSearchForm } from '../cabs/CabSearchForm'
import { CargoSearchForm } from '../cargo/CargoSearchForm'
import { FlightSearchForm } from '../flights/FlightSearchForm'
import { TrainSearchForm } from '../trains/TrainSearchForm'
import s from './Home.module.css'

function DepartureBoard() {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [offset, setOffset] = useState(0)
  const now = useNow(1000)
  useEffect(() => {
    if (reduced) return
    const t = setInterval(() => setOffset((o) => (o + 1) % DEPARTURES.length), 3600)
    return () => clearInterval(t)
  }, [reduced])
  const rows = Array.from({ length: 5 }, (_, i) => DEPARTURES[(offset + i) % DEPARTURES.length])
  const clock = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: appConfig.timeZone }).format(now)

  return (
    <aside className={s.board} aria-label="Live departures across Ekam (illustrative)">
      <div className={s.boardHead}>
        <span className={s.boardTitle}>
          <i className={s.liveDot} aria-hidden /> Departures
        </span>
        <span className={s.clock}>{clock} IST</span>
      </div>
      <ul className={s.boardRows}>
        {rows.map((d, i) => (
          <li key={i} className={s.boardRow}>
            <span className={s.boardTime}>{d.time}</span>
            <Roundel service={d.service} size={22} />
            <SplitFlap text={d.route} length={14} className={s.boardRoute} />
            <span className={cn(s.boardStatus, s[`st_${d.tone}`])}>{d.status}</span>
          </li>
        ))}
      </ul>
      <p className={s.boardFoot}>Five modes. One timetable. Yours.</p>
    </aside>
  )
}

const FORMS: Record<ServiceId, () => ReactElement> = {
  flights: () => <FlightSearchForm />,
  trains: () => <TrainSearchForm />,
  buses: () => <BusSearchForm />,
  cabs: () => <CabSearchForm />,
  cargo: () => <CargoSearchForm />,
}

export function SearchConsole() {
  const lastService = useSearchStore((st) => st.last ?? 'flights')
  const [active, setActive] = useState<ServiceId>(lastService)
  const Form = FORMS[active]

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = SERVICE_ORDER.indexOf(active)
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = SERVICE_ORDER[(i + (e.key === 'ArrowRight' ? 1 : SERVICE_ORDER.length - 1)) % SERVICE_ORDER.length]
    setActive(next)
    requestAnimationFrame(() => document.getElementById(`console-tab-${next}`)?.focus())
  }

  return (
    <div className={s.console} data-service={active}>
      <div className={s.consoleTop}>
        <div role="tablist" aria-label="Choose a service" className={s.consoleTabs} onKeyDown={onKey}>
          {SERVICE_ORDER.map((id) => {
            const meta = SERVICES[id]
            const Icon = meta.icon
            return (
              <button
                key={id}
                id={`console-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={active === id}
                aria-controls="console-panel"
                tabIndex={active === id ? 0 : -1}
                className={s.consoleTab}
                style={{ ['--line' as string]: meta.color }}
                onClick={() => setActive(id)}
              >
                <span className={s.tabIcon}>
                  <Icon strokeWidth={1.9} />
                </span>
                {meta.label}
              </button>
            )
          })}
        </div>
        <div className={s.consoleLinks}>
          <Link to={ROUTES.bookings}>
            Manage booking <ArrowUpRight />
          </Link>
          <Link to={ROUTES.cargoTrack}>
            Track shipment <ArrowUpRight />
          </Link>
        </div>
      </div>
      <div id="console-panel" role="tabpanel" aria-labelledby={`console-tab-${active}`} key={active} className={s.consolePanel}>
        <Form />
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className={s.hero}>
      <div className={s.heroMedia} aria-hidden>
        <span className={s.scrim} />
      </div>
      <div className={cn('container', s.heroInner)}>
        <div className={s.heroGrid}>
          <div className={s.heroCopy}>
            <p className={s.kicker}>
              <span lang="sa">{appConfig.brand.devanagari}</span>
              <span className={s.kickerRule} />
              one platform, every journey
            </p>
            <h1 className={s.headline}>
              Every way to go,
              <br />
              <span className="serif-i">one</span> place to book it.
            </h1>
            <p className={s.sub}>Flights, trains, buses, cabs and cargo — compared side by side, priced with nothing hidden, booked in under a minute.</p>
          </div>
          <DepartureBoard />
        </div>
        <SearchConsole />
      </div>
    </section>
  )
}

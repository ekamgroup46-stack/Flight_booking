import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ArrowLeftRight, Info } from 'lucide-react'
import { Roundel } from '@/components/brand/Brand'
import { DateStrip, FacetRow, FilterGroup, InvalidSearchGuard, Notice, ResultSkeletons, ResultsHeader, ResultsLayout, SortBar, WindowGrid, WindowTile } from '@/components/results'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/Feedback'
import { Modal } from '@/components/ui/Overlay'
import { useDocumentTitle } from '@/hooks'
import { cn } from '@/lib/cn'
import { addDays, todayISO } from '@/lib/dates'
import { formatDate, pluralize } from '@/lib/format'
import { TIME_WINDOWS, toggle } from '@/services/shared/timeWindows'
import { useTrainDateSummary, useTrainSearch } from '@/services/trains/api'
import { trainToCheckoutItem } from '@/services/trains/checkout'
import { applyTrainFilters, countActiveTrainFilters, EMPTY_TRAIN_FILTERS, sortTrains, type TrainFilters, type TrainSort } from '@/services/trains/filters'
import { parseTrainSearch, trainSearchToQuery } from '@/services/trains/query'
import { CLASS_INFO, QUOTA_LABEL, TRAIN_TYPE_LABEL, type Train, type TrainClass, type TrainSearchParams, type TrainType } from '@/services/trains/types'
import { useStartCheckout } from '../checkout/useStartCheckout'
import { TrainCard } from './TrainCard'
import s from './TrainCard.module.css'
import { TrainSearchForm } from './TrainSearchForm'

export default function TrainResultsPage() {
  const [sp] = useSearchParams()
  const params = useMemo(() => parseTrainSearch(sp), [sp])
  return (
    <div data-service="trains">
      <InvalidSearchGuard service="trains" valid={!!params} form={<TrainSearchForm tone="light" />}>
        {params && <TrainResults key={sp.toString()} params={params} />}
      </InvalidSearchGuard>
    </div>
  )
}

function RouteDrawer({ train, onClose }: { train: Train | null; onClose: () => void }) {
  return (
    <Modal open={!!train} onClose={onClose} placement="right" tone="trains" title={train ? `${train.number} · ${train.name}` : ''} description={train ? `${train.stops.length} stations · ${train.distanceKm} km` : undefined}>
      {train && (
        <ol className={s.stops}>
          {train.stops.map((st, i) => (
            <li key={st.code + i} className={cn(s.stop, (i === 0 || i === train.stops.length - 1) && s.terminal)}>
              <span className={s.stopDot} aria-hidden />
              <div className={s.stopName}>
                <strong>{st.name}</strong>
                <span>
                  {st.code} · Day {st.day} · {st.distanceKm} km{st.haltMin ? ` · ${st.haltMin} min halt` : ''}
                </span>
              </div>
              <div className={s.stopTimes}>
                {st.arrive ?? 'Starts'}
                <span>{st.depart ? `dep ${st.depart}` : 'Ends'}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Modal>
  )
}

function TrainResults({ params }: { params: TrainSearchParams }) {
  const [, setSp] = useSearchParams()
  const { data, isLoading, isError, error, refetch } = useTrainSearch(params)
  const [filters, setFilters] = useState<TrainFilters>(() => ({ ...EMPTY_TRAIN_FILTERS, classes: params.cls !== 'ALL' ? [params.cls] : [] }))
  const [sort, setSort] = useState<TrainSort>('departure')
  const [selection, setSelection] = useState<{ train: string; cls: TrainClass } | null>(null)
  const [routeOf, setRouteOf] = useState<Train | null>(null)
  const [mobileFilters, setMobileFilters] = useState(false)
  const startCheckout = useStartCheckout()

  const stripStart = addDays(params.date, -2) < todayISO() ? todayISO() : addDays(params.date, -2)
  const dates = useTrainDateSummary(params.from, params.to, stripStart, 7)
  const trains = useMemo(() => data?.trains ?? [], [data])
  const sorted = useMemo(() => sortTrains(applyTrainFilters(trains, filters), sort), [trains, filters, sort])
  const presentClasses = useMemo(() => [...new Set(trains.flatMap((t) => t.classes.map((c) => c.cls)))], [trains])
  const presentTypes = useMemo(() => [...new Set(trains.map((t) => t.type))], [trains])
  const set = (patch: Partial<TrainFilters>) => setFilters((f) => ({ ...f, ...patch }))
  const active = countActiveTrainFilters(filters)
  useDocumentTitle(data ? `${data.from.name} to ${data.to.name} trains` : 'Trains')

  const filterPanel = (
    <>
      <FilterGroup title="Availability">
        <FacetRow checked={filters.availableOnly} onChange={() => set({ availableOnly: !filters.availableOnly })} label="Confirmed or RAC only" />
      </FilterGroup>
      <FilterGroup title="Class">
        {presentClasses.map((c) => (
          <FacetRow key={c} checked={filters.classes.includes(c)} onChange={() => set({ classes: toggle(filters.classes, c) })} label={`${c} · ${CLASS_INFO[c].label}`} />
        ))}
      </FilterGroup>
      <FilterGroup title="Departure time">
        <WindowGrid>
          {TIME_WINDOWS.map((w) => (
            <WindowTile key={w.id} active={filters.departWindows.includes(w.id)} onClick={() => set({ departWindows: toggle(filters.departWindows, w.id) })} icon={<w.icon />} label={w.label} range={w.range} />
          ))}
        </WindowGrid>
      </FilterGroup>
      <FilterGroup title="Train type">
        {presentTypes.map((t: TrainType) => (
          <FacetRow key={t} checked={filters.types.includes(t)} onChange={() => set({ types: toggle(filters.types, t) })} label={TRAIN_TYPE_LABEL[t]} meta={trains.filter((x) => x.type === t).length} />
        ))}
      </FilterGroup>
    </>
  )

  return (
    <>
      <ResultsHeader
        eyebrow={
          <>
            <Roundel service="trains" size={20} /> Trains · {QUOTA_LABEL[params.quota]} quota
          </>
        }
        title={
          data ? (
            <>
              {data.from.name} <ArrowLeftRight size={22} style={{ opacity: 0.35 }} /> {data.to.name}
            </>
          ) : (
            `${params.from} → ${params.to}`
          )
        }
        meta={`${formatDate(params.date, 'long')} · ${pluralize(params.pax, 'passenger')}${params.cls !== 'ALL' ? ` · ${params.cls}` : ''}`}
        form={<TrainSearchForm initial={params} compact tone="light" />}
      />
      <ResultsLayout filters={filterPanel} activeFilters={active} onReset={() => setFilters(EMPTY_TRAIN_FILTERS)} mobileOpen={mobileFilters} onMobileClose={() => setMobileFilters(false)} resultCount={sorted.length}>
        <DateStrip
          value={params.date}
          onSelect={(date) => setSp(trainSearchToQuery({ ...params, date }))}
          loading={dates.isLoading}
          days={Array.from({ length: 7 }, (_, i) => {
            const date = addDays(stripStart, i)
            const d = dates.data?.find((x) => x.date === date)
            return {
              date,
              top: formatDate(date, 'weekday'),
              main: formatDate(date, 'short'),
              sub: d ? (d.trains ? `${d.available} of ${d.trains} AVL` : 'No trains') : undefined,
              highlight: !!d && d.trains > 0 && d.available === d.trains,
              disabled: date > addDays(todayISO(), 60),
            }
          })}
        />
        <SortBar
          value={sort}
          onChange={setSort}
          count={isLoading ? undefined : sorted.length}
          onOpenFilters={() => setMobileFilters(true)}
          activeFilters={active}
          options={[
            { id: 'departure', label: 'Departure', meta: 'Earliest first' },
            { id: 'duration', label: 'Duration', meta: 'Quickest first' },
            { id: 'arrival', label: 'Arrival', meta: 'Earliest first' },
            { id: 'availability', label: 'Availability', meta: 'Best chance' },
          ]}
        />
        {isLoading ? (
          <ResultSkeletons height={200} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : !trains.length ? (
          <EmptyState title="No trains run on this date" body="Some trains don’t run daily. Pick another date from the strip above to see what runs then." />
        ) : !sorted.length ? (
          <EmptyState
            title="No trains match these filters"
            body={`${trains.length} trains are hidden by your filters.`}
            action={
              <Button variant="secondary" onClick={() => setFilters(EMPTY_TRAIN_FILTERS)}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            {sorted.map((t) => (
              <TrainCard
                key={t.id}
                train={t}
                pax={params.pax}
                visibleClasses={filters.classes}
                selectedClass={selection?.train === t.id ? selection.cls : undefined}
                onSelectClass={(c) => setSelection({ train: t.id, cls: c.cls })}
                onShowRoute={() => setRouteOf(t)}
                onBook={(c) => startCheckout(trainToCheckoutItem(params, t, c))}
              />
            ))}
            <Notice>
              <Info /> Availability refreshes every few minutes. Waitlisted tickets that don’t confirm at charting are cancelled and refunded automatically.
            </Notice>
          </>
        )}
      </ResultsLayout>
      <RouteDrawer train={routeOf} onClose={() => setRouteOf(null)} />
    </>
  )
}

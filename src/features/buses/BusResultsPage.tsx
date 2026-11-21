import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ArrowLeftRight } from 'lucide-react'
import { Roundel } from '@/components/brand/Brand'
import { DateStrip, FacetRow, FilterGroup, InvalidSearchGuard, PriceSlider, ResultSkeletons, ResultsHeader, ResultsLayout, SortBar, WindowGrid, WindowTile } from '@/components/results'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/Feedback'
import { useDocumentTitle } from '@/hooks'
import { addDays, todayISO } from '@/lib/dates'
import { formatDate, formatMoney } from '@/lib/format'
import { useBusSearch } from '@/services/buses/api'
import { busToCheckoutItem } from '@/services/buses/checkout'
import { applyBusFilters, countActiveBusFilters, EMPTY_BUS_FILTERS, sortBuses, type BusFilters, type BusSort, type BusTypeFilter } from '@/services/buses/filters'
import { busSearchToQuery, parseBusSearch } from '@/services/buses/query'
import { AMENITY_LABEL, type BusAmenity, type BusSearchParams } from '@/services/buses/types'
import { TIME_WINDOWS, toggle } from '@/services/shared/timeWindows'
import { useStartCheckout } from '../checkout/useStartCheckout'
import { BusCard } from './BusCard'
import { BusSearchForm } from './BusSearchForm'

const TYPE_LABEL: Record<BusTypeFilter, string> = { ac: 'AC', nonac: 'Non-AC', sleeper: 'Sleeper', seater: 'Seater / semi-sleeper', electric: 'Electric' }

export default function BusResultsPage() {
  const [sp] = useSearchParams()
  const params = useMemo(() => parseBusSearch(sp), [sp])
  return (
    <div data-service="buses">
      <InvalidSearchGuard service="buses" valid={!!params} form={<BusSearchForm tone="light" />}>
        {params && <BusResults key={sp.toString()} params={params} />}
      </InvalidSearchGuard>
    </div>
  )
}

function BusResults({ params }: { params: BusSearchParams }) {
  const [, setSp] = useSearchParams()
  const { data, isLoading, isError, error, refetch } = useBusSearch(params)
  const [filters, setFilters] = useState<BusFilters>(EMPTY_BUS_FILTERS)
  const [sort, setSort] = useState<BusSort>('departure')
  const [openId, setOpenId] = useState<string | null>(null)
  const [mobileFilters, setMobileFilters] = useState(false)
  const startCheckout = useStartCheckout()
  useDocumentTitle(data ? `${data.from.name} to ${data.to.name} buses` : 'Buses')

  const buses = useMemo(() => data?.buses ?? [], [data])
  const sorted = useMemo(() => sortBuses(applyBusFilters(buses, filters), sort), [buses, filters, sort])
  const cheapestId = useMemo(() => [...buses].sort((a, b) => a.price - b.price)[0]?.id, [buses])
  const operators = useMemo(() => [...new Set(buses.map((b) => b.operator))].sort(), [buses])
  const prices = buses.map((b) => b.price)
  const set = (patch: Partial<BusFilters>) => setFilters((f) => ({ ...f, ...patch }))
  const active = countActiveBusFilters(filters)
  const stripStart = addDays(params.date, -2) < todayISO() ? todayISO() : addDays(params.date, -2)

  const filterPanel = (
    <>
      <FilterGroup title="Bus type">
        {(Object.keys(TYPE_LABEL) as BusTypeFilter[]).map((t) => (
          <FacetRow key={t} checked={filters.types.includes(t)} onChange={() => set({ types: toggle(filters.types, t) })} label={TYPE_LABEL[t]} />
        ))}
      </FilterGroup>
      <FilterGroup title="Departure time">
        <WindowGrid>
          {TIME_WINDOWS.map((w) => (
            <WindowTile key={w.id} active={filters.departWindows.includes(w.id)} onClick={() => set({ departWindows: toggle(filters.departWindows, w.id) })} icon={<w.icon />} label={w.label} range={w.range} />
          ))}
        </WindowGrid>
      </FilterGroup>
      {prices.length > 1 && (
        <FilterGroup title="Price">
          <PriceSlider min={Math.min(...prices)} max={Math.max(...prices)} value={filters.maxPrice} onChange={(maxPrice) => set({ maxPrice })} format={formatMoney} />
        </FilterGroup>
      )}
      <FilterGroup title="Rating">
        <FacetRow checked={filters.minRating === 4} onChange={() => set({ minRating: filters.minRating === 4 ? null : 4 })} label="4.0 and above" />
        <FacetRow checked={filters.minRating === 4.5} onChange={() => set({ minRating: filters.minRating === 4.5 ? null : 4.5 })} label="4.5 and above" />
      </FilterGroup>
      <FilterGroup title="Amenities" defaultOpen={false}>
        {(['wifi', 'charging', 'blanket', 'snacks'] as BusAmenity[]).map((a) => (
          <FacetRow key={a} checked={filters.amenities.includes(a)} onChange={() => set({ amenities: toggle(filters.amenities, a) })} label={AMENITY_LABEL[a]} />
        ))}
      </FilterGroup>
      <FilterGroup title="Operators" defaultOpen={false}>
        {operators.map((o) => (
          <FacetRow key={o} checked={filters.operators.includes(o)} onChange={() => set({ operators: toggle(filters.operators, o) })} label={o} meta={buses.filter((b) => b.operator === o).length} />
        ))}
      </FilterGroup>
    </>
  )

  return (
    <>
      <ResultsHeader
        eyebrow={
          <>
            <Roundel service="buses" size={20} /> Buses
          </>
        }
        title={
          data ? (
            <>
              {data.from.name} <ArrowLeftRight size={22} style={{ opacity: 0.35 }} /> {data.to.name}
            </>
          ) : (
            'Buses'
          )
        }
        meta={`${formatDate(params.date, 'long')}${data ? ` · ${data.buses.length} buses` : ''}`}
        form={<BusSearchForm initial={params} compact tone="light" />}
      />
      <ResultsLayout filters={filterPanel} activeFilters={active} onReset={() => setFilters(EMPTY_BUS_FILTERS)} mobileOpen={mobileFilters} onMobileClose={() => setMobileFilters(false)} resultCount={sorted.length}>
        <DateStrip
          value={params.date}
          onSelect={(date) => setSp(busSearchToQuery({ ...params, date }))}
          days={Array.from({ length: 7 }, (_, i) => {
            const date = addDays(stripStart, i)
            return { date, top: formatDate(date, 'weekday'), main: formatDate(date, 'short'), sub: i === 0 && date === todayISO() ? 'Today' : ' ' }
          })}
        />
        <SortBar
          value={sort}
          onChange={setSort}
          count={isLoading ? undefined : sorted.length}
          onOpenFilters={() => setMobileFilters(true)}
          activeFilters={active}
          options={[
            { id: 'departure', label: 'Departure' },
            { id: 'price', label: 'Price', meta: prices.length ? `from ${formatMoney(Math.min(...prices))}` : undefined },
            { id: 'rating', label: 'Rating' },
            { id: 'duration', label: 'Duration' },
            { id: 'seats', label: 'Seats' },
          ]}
        />
        {isLoading ? (
          <ResultSkeletons height={150} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : !buses.length ? (
          <EmptyState title="No buses on this route" body="These cities aren’t connected by road services we sell yet, or the journey is too long for a single bus. Try a train or a flight instead." />
        ) : !sorted.length ? (
          <EmptyState
            title="No buses match these filters"
            body={`${buses.length} buses are hidden by your filters.`}
            action={
              <Button variant="secondary" onClick={() => setFilters(EMPTY_BUS_FILTERS)}>
                Clear filters
              </Button>
            }
          />
        ) : (
          sorted.map((b) => (
            <BusCard
              key={b.id}
              bus={b}
              cheapest={b.id === cheapestId}
              open={openId === b.id}
              onToggle={() => setOpenId(openId === b.id ? null : b.id)}
              onContinue={(seats, boarding, dropping) => startCheckout(busToCheckoutItem(params, data!, b, seats, boarding, dropping))}
            />
          ))
        )}
      </ResultsLayout>
    </>
  )
}

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ArrowLeftRight, Info } from 'lucide-react'
import { CarrierMark, Roundel } from '@/components/brand/Brand'
import { DateStrip, FacetRow, FilterGroup, InvalidSearchGuard, Notice, PriceSlider, ResultSkeletons, ResultsHeader, ResultsLayout, SortBar, WindowGrid, WindowTile } from '@/components/results'
import { Button } from '@/components/ui/Button'
import { EmptyState, ErrorState } from '@/components/ui/Feedback'
import { useDocumentTitle } from '@/hooks'
import { smoothScroll } from '@/lib/smoothScroll'
import { addDays, timeOf, todayISO } from '@/lib/dates'
import { formatDate, formatDuration, formatMoney, formatMoneyCompact, pluralize } from '@/lib/format'
import { useFareCalendar, useFlightSearch } from '@/services/flights/api'
import { flightToCheckoutItem } from '@/services/flights/checkout'
import { airlineFacets, applyFlightFilters, countActiveFlightFilters, EMPTY_FLIGHT_FILTERS, flightSortSummary, sortFlights, type FlightFilters, type FlightSort } from '@/services/flights/filters'
import { flightSearchToQuery, parseFlightSearch } from '@/services/flights/query'
import { CABIN_LABEL, type FareOption, type Flight, type FlightSearchParams } from '@/services/flights/types'
import { findAirport } from '@/services/locations/api'
import { TIME_WINDOWS, toggle } from '@/services/shared/timeWindows'
import { useStartCheckout } from '../checkout/useStartCheckout'
import { FlightCard } from './FlightCard'
import { FlightSearchForm } from './FlightSearchForm'

export default function FlightResultsPage() {
  const [sp] = useSearchParams()
  const params = useMemo(() => parseFlightSearch(sp), [sp])
  return (
    <div data-service="flights">
      <InvalidSearchGuard service="flights" valid={!!params} form={<FlightSearchForm tone="light" />}>
        {/* The return date is excluded from the key so changing it keeps the chosen departure. */}
        {params && <FlightResults key={[params.trip, params.from, params.to, params.depart, params.cabin, params.fare, params.adults, params.children, params.infants].join('|')} params={params} />}
      </InvalidSearchGuard>
    </div>
  )
}

function FlightResults({ params }: { params: FlightSearchParams }) {
  const [, setSp] = useSearchParams()
  const { data, isLoading, isError, error, refetch } = useFlightSearch(params)
  const [leg, setLeg] = useState<'out' | 'in'>('out')
  const [outbound, setOutbound] = useState<{ flight: Flight; fare: FareOption } | null>(null)
  const [filters, setFilters] = useState<FlightFilters>(EMPTY_FLIGHT_FILTERS)
  const [sort, setSort] = useState<FlightSort>('best')
  const [mobileFilters, setMobileFilters] = useState(false)
  const startCheckout = useStartCheckout()

  const from = findAirport(params.from)!
  const to = findAirport(params.to)!
  const isReturn = leg === 'in'
  const legFrom = isReturn ? to : from
  const legTo = isReturn ? from : to
  const legDate = isReturn ? params.ret! : params.depart
  const pax = params.adults + params.children + params.infants
  useDocumentTitle(`${legFrom.city} to ${legTo.city} flights`)

  const list = useMemo(() => (isReturn ? data?.inbound : data?.outbound) ?? [], [data, isReturn])
  const filtered = useMemo(() => applyFlightFilters(list, filters), [list, filters])
  const sorted = useMemo(() => sortFlights(filtered, sort), [filtered, sort])
  const summary = useMemo(() => flightSortSummary(filtered), [filtered])
  const facets = useMemo(() => airlineFacets(list), [list])
  const prices = list.map((f) => f.price)
  const minPrice = prices.length ? Math.min(...prices) : 0
  const maxPrice = prices.length ? Math.max(...prices) : 0

  const stripStart = addDays(legDate, -3) < todayISO() ? todayISO() : addDays(legDate, -3)
  const calendar = useFareCalendar(legFrom.code, legTo.code, stripStart, 7, params.cabin)
  const cheapestDay = calendar.data?.reduce<number | null>((m, d) => (d.price && (m === null || d.price < m) ? d.price : m), null)

  const setDate = (date: string) => {
    const next = isReturn ? { ...params, ret: date } : { ...params, depart: date, ret: params.ret && params.ret < date ? date : params.ret }
    setSp(flightSearchToQuery(next))
  }

  const choose = (flight: Flight, fare: FareOption) => {
    if (params.trip === 'round' && !isReturn) {
      setOutbound({ flight, fare })
      setLeg('in')
      setFilters(EMPTY_FLIGHT_FILTERS)
      smoothScroll.to(0)
      return
    }
    const item = isReturn && outbound ? flightToCheckoutItem({ params, outbound: outbound.flight, outboundFare: outbound.fare, inbound: flight, inboundFare: fare }) : flightToCheckoutItem({ params, outbound: flight, outboundFare: fare })
    startCheckout(item)
  }

  const tagsFor = (f: Flight) => {
    const t: string[] = []
    if (summary.best?.id === f.id) t.push('Best overall')
    if (summary.cheapest?.id === f.id) t.push('Cheapest')
    if (summary.fastest?.id === f.id) t.push('Fastest')
    return t
  }

  const activeCount = countActiveFlightFilters(filters)
  const set = (patch: Partial<FlightFilters>) => setFilters((f) => ({ ...f, ...patch }))
  const stopCount = (n: number) => list.filter((f) => Math.min(f.stops, 2) === n)

  const filterPanel = (
    <>
      <FilterGroup title="Stops">
        {[0, 1, 2].map((n) => {
          const group = stopCount(n)
          if (!group.length) return null
          return (
            <FacetRow
              key={n}
              checked={filters.stops.includes(n)}
              onChange={() => set({ stops: toggle(filters.stops, n) })}
              label={n === 0 ? 'Non-stop' : n === 1 ? '1 stop' : '2+ stops'}
              meta={formatMoney(Math.min(...group.map((f) => f.price)))}
            />
          )
        })}
      </FilterGroup>
      <FilterGroup title={`Departure from ${legFrom.city}`}>
        <WindowGrid>
          {TIME_WINDOWS.map((w) => (
            <WindowTile key={w.id} active={filters.departWindows.includes(w.id)} onClick={() => set({ departWindows: toggle(filters.departWindows, w.id) })} icon={<w.icon />} label={w.label} range={w.range} />
          ))}
        </WindowGrid>
      </FilterGroup>
      <FilterGroup title="Airlines">
        {facets.map((a) => (
          <FacetRow key={a.code} checked={filters.airlines.includes(a.code)} onChange={() => set({ airlines: toggle(filters.airlines, a.code) })} label={a.name} swatch={a.color} meta={formatMoney(a.min)} />
        ))}
      </FilterGroup>
      {maxPrice > minPrice && (
        <FilterGroup title="Price per adult">
          <PriceSlider min={minPrice} max={maxPrice} value={filters.maxPrice} onChange={(maxP) => set({ maxPrice: maxP })} format={formatMoney} />
        </FilterGroup>
      )}
      <FilterGroup title="Flexibility">
        <FacetRow checked={filters.refundableOnly} onChange={() => set({ refundableOnly: !filters.refundableOnly })} label="Refundable fares only" />
      </FilterGroup>
    </>
  )

  return (
    <>
      <ResultsHeader
        eyebrow={
          <>
            <Roundel service="flights" size={20} /> Flights · {params.trip === 'round' ? (isReturn ? 'Step 2 of 2 · Return' : 'Step 1 of 2 · Departure') : 'One way'}
          </>
        }
        title={
          <>
            {legFrom.city} <ArrowLeftRight size={22} style={{ opacity: 0.35 }} /> {legTo.city}
          </>
        }
        meta={`${formatDate(legDate, 'long')} · ${pluralize(pax, 'traveller')} · ${CABIN_LABEL[params.cabin]}${params.fare !== 'regular' ? ` · ${params.fare} fare` : ''}`}
        form={<FlightSearchForm initial={params} compact tone="light" />}
      />

      <ResultsLayout filters={filterPanel} activeFilters={activeCount} onReset={() => setFilters(EMPTY_FLIGHT_FILTERS)} mobileOpen={mobileFilters} onMobileClose={() => setMobileFilters(false)} resultCount={sorted.length}>
        {isReturn && outbound && (
          <Notice>
            <CarrierMark code={outbound.flight.airline.code} color={outbound.flight.airline.color} size={30} />
            <span style={{ flex: 1 }}>
              <strong style={{ color: 'var(--text)' }}>Departure selected:</strong> {outbound.flight.airline.name} {outbound.flight.legs[0].flightNo} · {timeOf(outbound.flight.departAt)} → {timeOf(outbound.flight.arriveAt)} · {outbound.fare.name} {formatMoney(outbound.fare.price)}
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setLeg('out')
                setOutbound(null)
              }}
            >
              Change
            </Button>
          </Notice>
        )}

        <DateStrip
          value={legDate}
          onSelect={setDate}
          loading={calendar.isLoading}
          days={Array.from({ length: 7 }, (_, i) => {
            const date = addDays(stripStart, i)
            const price = calendar.data?.find((d) => d.date === date)?.price
            return {
              date,
              top: formatDate(date, 'weekday'),
              main: formatDate(date, 'short'),
              sub: price ? formatMoneyCompact(price) : undefined,
              highlight: !!price && price === cheapestDay,
              disabled: isReturn && date < params.depart,
            }
          })}
        />

        <SortBar
          value={sort}
          onChange={setSort}
          count={isLoading ? undefined : sorted.length}
          onOpenFilters={() => setMobileFilters(true)}
          activeFilters={activeCount}
          options={(['best', 'cheapest', 'fastest', 'earliest'] as FlightSort[]).map((id) => {
            const f = summary[id]
            const meta = f ? (id === 'earliest' ? timeOf(f.departAt) : `${formatMoney(f.price)} · ${formatDuration(f.durationMin)}`) : undefined
            return { id, label: id === 'best' ? 'Best' : id[0].toUpperCase() + id.slice(1), meta }
          })}
        />

        {isLoading ? (
          <ResultSkeletons />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : !list.length ? (
          <EmptyState title="No flights on this route" body="We couldn’t find scheduled flights for this date. Try a nearby date or a different airport in the same city." />
        ) : !sorted.length ? (
          <EmptyState
            title="No flights match these filters"
            body={`${list.length} flights are hidden by your filters.`}
            action={
              <Button variant="secondary" onClick={() => setFilters(EMPTY_FLIGHT_FILTERS)}>
                Clear all filters
              </Button>
            }
          />
        ) : (
          <>
            {sorted.map((f) => (
              <FlightCard key={f.id} flight={f} tags={tagsFor(f)} pax={params.adults + params.children} onChoose={(fare) => choose(f, fare)} actionLabel={params.trip === 'round' && !isReturn ? 'Select departure' : 'Book now'} />
            ))}
            <Notice>
              <Info /> Fares are per adult and include taxes. Children pay ~78% of the adult fare; infants on lap pay a flat fee.
            </Notice>
          </>
        )}
      </ResultsLayout>
    </>
  )
}

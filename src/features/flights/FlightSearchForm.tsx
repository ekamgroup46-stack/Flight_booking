import { useState, type FormEvent } from 'react'
import { addDays, todayISO } from '@/lib/dates'
import { appConfig } from '@/config/app.config'
import { Chip, Segmented } from '@/components/ui/Field'
import { DateField } from '@/components/search/DateField'
import { LocationField } from '@/components/search/LocationField'
import { Cell, FormError, OptionRow, PairCell, SearchSlab, SearchSubmit } from '@/components/search/SearchUI'
import { TravellersField } from '@/components/search/TravellersField'
import { initialSearch, useSearchNavigate } from '@/components/search/useSearchNavigate'
import { useFareCalendar } from '@/services/flights/api'
import { defaultFlightSearch, flightSearchToQuery, parseFlightSearch, validateFlightSearch } from '@/services/flights/query'
import { CABIN_LABEL, SPECIAL_FARE_LABEL, type CabinClass, type FlightSearchParams, type SpecialFare } from '@/services/flights/types'
import fs from '../shared/forms.module.css'

const CABINS = (Object.keys(CABIN_LABEL) as CabinClass[]).map((value) => ({ value, label: CABIN_LABEL[value] }))
const SPECIAL: SpecialFare[] = ['student', 'senior', 'armed']

function usePriceHints(from: string, to: string, month: string, enabled: boolean, cabin: CabinClass) {
  const start = month < todayISO() ? todayISO() : month
  const { data } = useFareCalendar(from, to, start, 62, cabin, enabled)
  return data ? Object.fromEntries(data.map((d) => [d.date, d.price])) : undefined
}

export function FlightSearchForm({ initial, compact, tone = 'dark' }: { initial?: FlightSearchParams; compact?: boolean; tone?: 'dark' | 'light' }) {
  const [p, setP] = useState<FlightSearchParams>(() => initialSearch('flights', parseFlightSearch, defaultFlightSearch, ['from', 'to', 'adults', 'cabin'], initial))
  const [error, setError] = useState<string | null>(null)
  const [departOpen, setDepartOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [departMonth, setDepartMonth] = useState(p.depart.slice(0, 8) + '01')
  const [returnMonth, setReturnMonth] = useState((p.ret ?? p.depart).slice(0, 8) + '01')
  const go = useSearchNavigate('flights')

  const update = (patch: Partial<FlightSearchParams>) => {
    setError(null)
    setP((prev) => {
      const next = { ...prev, ...patch }
      if (next.trip === 'round' && next.ret && next.ret < next.depart) next.ret = addDays(next.depart, 2)
      return next
    })
  }

  const departHints = usePriceHints(p.from, p.to, departMonth, departOpen, p.cabin)
  const returnHints = usePriceHints(p.to, p.from, returnMonth, returnOpen, p.cabin)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const err = validateFlightSearch(p)
    if (err) return setError(err)
    go(flightSearchToQuery(p))
  }

  return (
    <form onSubmit={submit} noValidate data-service="flights">
      <OptionRow>
        <Segmented
          label="Trip type"
          tone={tone}
          size="sm"
          value={p.trip}
          onChange={(trip) => update({ trip, ret: trip === 'round' ? (p.ret ?? addDays(p.depart, 3)) : undefined })}
          options={[
            { value: 'oneway', label: 'One way' },
            { value: 'round', label: 'Round trip' },
          ]}
        />
        {!compact &&
          SPECIAL.map((f) => (
            <Chip key={f} selected={p.fare === f} onClick={() => update({ fare: p.fare === f ? 'regular' : f })} className={tone === 'dark' && p.fare !== f ? fs.chipDark : undefined}>
              {SPECIAL_FARE_LABEL[f]} fare
            </Chip>
          ))}
      </OptionRow>
      <SearchSlab compact={compact}>
        <PairCell span={4} spanMd={12} onSwap={() => update({ from: p.to, to: p.from })}>
          <LocationField kind="airport" label="From" value={p.from} onChange={(from) => update({ from })} />
          <LocationField kind="airport" label="To" value={p.to} onChange={(to) => update({ to })} />
        </PairCell>
        <Cell span={2} spanMd={6} spanSm={6}>
          <DateField
            label="Depart"
            value={p.depart}
            max={addDays(todayISO(), appConfig.search.maxAdvanceDays)}
            onChange={(depart) => update({ depart })}
            prices={departHints}
            onMonthChange={setDepartMonth}
            onOpenChange={setDepartOpen}
            rangeStart={p.trip === 'round' ? p.depart : undefined}
            rangeEnd={p.trip === 'round' ? p.ret : undefined}
            footer="Lowest one-way fare per adult · green = cheapest days"
          />
        </Cell>
        <Cell span={2} spanMd={6} spanSm={6}>
          <DateField
            label="Return"
            value={p.trip === 'round' ? p.ret : undefined}
            placeholder="Add return"
            min={p.depart}
            max={addDays(todayISO(), appConfig.search.maxAdvanceDays)}
            onChange={(ret) => update({ ret, trip: 'round' })}
            onClear={() => update({ trip: 'oneway', ret: undefined })}
            prices={returnHints}
            onMonthChange={setReturnMonth}
            onOpenChange={setReturnOpen}
            rangeStart={p.depart}
            rangeEnd={p.ret}
            align="end"
            footer="Return fares per adult"
          />
        </Cell>
        <Cell span={2} spanMd={6}>
          <TravellersField
            value={{ adults: p.adults, children: p.children, infants: p.infants }}
            onChange={(v) => update(v)}
            cabin={p.cabin}
            cabins={CABINS}
            onCabinChange={(cabin) => update({ cabin })}
          />
        </Cell>
        <SearchSubmit span={2} spanMd={6} label={compact ? 'Update' : 'Search flights'} compact={compact} />
      </SearchSlab>
      <FormError message={error} />
    </form>
  )
}

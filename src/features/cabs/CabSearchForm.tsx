import { useState, type FormEvent } from 'react'
import { MapPinned, PlaneLanding, Repeat, Timer } from 'lucide-react'
import { addDays, todayISO } from '@/lib/dates'
import { Segmented } from '@/components/ui/Field'
import { DateField } from '@/components/search/DateField'
import { LocationField } from '@/components/search/LocationField'
import { Cell, FormError, OptionRow, PairCell, SearchSlab, SearchSubmit, SelectSegment } from '@/components/search/SearchUI'
import { initialSearch, useSearchNavigate } from '@/components/search/useSearchNavigate'
import { cabSearchToQuery, defaultCabSearch, parseCabSearch, validateCabSearch } from '@/services/cabs/query'
import { PACKAGE_LABEL, type CabSearchParams, type CabTrip, type RentalPackage } from '@/services/cabs/types'

const TIMES = Array.from({ length: 96 }, (_, i) => {
  const h = String(Math.floor(i / 4)).padStart(2, '0')
  const m = String((i % 4) * 15).padStart(2, '0')
  return { value: `${h}:${m}`, label: `${h}:${m}` }
})
const PACKAGES = (Object.keys(PACKAGE_LABEL) as RentalPackage[]).map((value) => ({ value, label: PACKAGE_LABEL[value] }))

export function CabSearchForm({ initial, compact, tone = 'dark' }: { initial?: CabSearchParams; compact?: boolean; tone?: 'dark' | 'light' }) {
  const [p, setP] = useState<CabSearchParams>(() => initialSearch('cabs', parseCabSearch, () => defaultCabSearch('airport'), [], initial))
  const [error, setError] = useState<string | null>(null)
  const go = useSearchNavigate('cabs')
  const update = (patch: Partial<CabSearchParams>) => {
    setError(null)
    setP((prev) => ({ ...prev, ...patch }))
  }
  const switchTrip = (trip: CabTrip) => {
    setError(null)
    // Keep the date/time the user already chose, reset places to sensible defaults for the trip type.
    setP((prev) => ({ ...defaultCabSearch(trip), date: prev.date, time: prev.time }))
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const err = validateCabSearch(p)
    if (err) return setError(err)
    go(cabSearchToQuery(p))
  }

  const dateCell = (span: number) => (
    <Cell span={span} spanMd={4} spanSm={6}>
      <DateField label="Pickup date" value={p.date} max={addDays(todayISO(), 90)} onChange={(date) => update({ date, ret: p.ret && p.ret < date ? date : p.ret })} quickPicks />
    </Cell>
  )
  const timeCell = (span: number) => <SelectSegment span={span} spanMd={4} spanSm={6} label="Pickup time" value={p.time} options={TIMES} onChange={(time) => update({ time })} sub="24-hour clock" />

  return (
    <form onSubmit={submit} noValidate data-service="cabs">
      <OptionRow>
        <Segmented
          label="Trip type"
          tone={tone}
          size="sm"
          value={p.trip}
          onChange={switchTrip}
          options={[
            { value: 'airport', label: 'Airport', icon: <PlaneLanding /> },
            { value: 'rental', label: 'Hourly', icon: <Timer /> },
            { value: 'oneway', label: 'One way', icon: <MapPinned /> },
            { value: 'round', label: 'Round trip', icon: <Repeat /> },
          ]}
        />
      </OptionRow>
      <SearchSlab compact={compact}>
        {p.trip === 'rental' ? (
          <>
            <Cell span={4} spanMd={12}>
              <LocationField kind="cabPlace" label="Pickup" value={p.from} onChange={(from) => update({ from })} placeholder="Area or landmark" />
            </Cell>
            <SelectSegment span={2} spanMd={4} spanSm={12} label="Package" value={p.pkg ?? '4-40'} options={PACKAGES} onChange={(pkg) => update({ pkg })} sub="Extra km & hours billed" />
            {dateCell(2)}
            {timeCell(2)}
            <SearchSubmit span={2} spanMd={12} label={compact ? 'Update' : 'See cabs'} compact={compact} />
          </>
        ) : (
          <>
            <PairCell span={p.trip === 'round' ? 4 : 5} spanMd={12} onSwap={() => update({ from: p.to ?? p.from, to: p.from })}>
              <LocationField kind="cabPlace" label="Pickup" value={p.from} onChange={(from) => update({ from })} placeholder={p.trip === 'airport' ? 'Airport or area' : 'Area or city'} />
              <LocationField kind="cabPlace" label="Drop" value={p.to ?? ''} onChange={(to) => update({ to })} placeholder={p.trip === 'airport' ? 'Airport or area' : 'Destination city'} />
            </PairCell>
            {dateCell(2)}
            {p.trip === 'round' && (
              <Cell span={2} spanMd={4} spanSm={6}>
                <DateField label="Return" value={p.ret} min={p.date} max={addDays(todayISO(), 90)} onChange={(ret) => update({ ret })} align="end" />
              </Cell>
            )}
            {timeCell(2)}
            <SearchSubmit span={p.trip === 'round' ? 2 : 3} spanMd={p.trip === 'round' ? 6 : 12} label={compact ? 'Update' : 'See cabs'} compact={compact} />
          </>
        )}
      </SearchSlab>
      <FormError message={error} />
    </form>
  )
}

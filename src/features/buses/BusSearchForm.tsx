import { useState, type FormEvent } from 'react'
import { ShieldCheck } from 'lucide-react'
import { addDays, todayISO } from '@/lib/dates'
import { DateField } from '@/components/search/DateField'
import { LocationField } from '@/components/search/LocationField'
import { Cell, FormError, OptionRow, PairCell, SearchSlab, SearchSubmit } from '@/components/search/SearchUI'
import { initialSearch, useSearchNavigate } from '@/components/search/useSearchNavigate'
import { busSearchToQuery, defaultBusSearch, parseBusSearch, validateBusSearch } from '@/services/buses/query'
import type { BusSearchParams } from '@/services/buses/types'
import s from '../shared/forms.module.css'

export function BusSearchForm({ initial, compact, tone = 'dark' }: { initial?: BusSearchParams; compact?: boolean; tone?: 'dark' | 'light' }) {
  const [p, setP] = useState<BusSearchParams>(() => initialSearch('buses', parseBusSearch, defaultBusSearch, ['from', 'to'], initial))
  const [error, setError] = useState<string | null>(null)
  const go = useSearchNavigate('buses')
  const update = (patch: Partial<BusSearchParams>) => {
    setError(null)
    setP((prev) => ({ ...prev, ...patch }))
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const err = validateBusSearch(p)
    if (err) return setError(err)
    go(busSearchToQuery(p))
  }

  return (
    <form onSubmit={submit} noValidate data-service="buses">
      {!compact && (
        <OptionRow>
          <span className={tone === 'dark' ? s.optLabelDark : s.optLabel} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textTransform: 'none', letterSpacing: 0, fontFamily: 'inherit', fontSize: 13.5 }}>
            <ShieldCheck size={16} /> Verified operators · Free cancellation on most buses · Women-reserved seats marked on the seat map
          </span>
        </OptionRow>
      )}
      <SearchSlab compact={compact}>
        <PairCell span={6} spanMd={12} onSwap={() => update({ from: p.to, to: p.from })}>
          <LocationField kind="busCity" label="From" value={p.from} onChange={(from) => update({ from })} />
          <LocationField kind="busCity" label="To" value={p.to} onChange={(to) => update({ to })} />
        </PairCell>
        <Cell span={3} spanMd={6}>
          <DateField label="Travel date" value={p.date} max={addDays(todayISO(), 90)} onChange={(date) => update({ date })} quickPicks />
        </Cell>
        <SearchSubmit span={3} spanMd={6} label={compact ? 'Update' : 'Search buses'} compact={compact} />
      </SearchSlab>
      <FormError message={error} />
    </form>
  )
}

import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { addDays, todayISO } from '@/lib/dates'
import { ROUTES } from '@/config/routes'
import { Chip } from '@/components/ui/Field'
import { DateField } from '@/components/search/DateField'
import { LocationField } from '@/components/search/LocationField'
import { Cell, FormError, OptionRow, PairCell, SearchSlab, SearchSubmit, SelectSegment } from '@/components/search/SearchUI'
import { initialSearch, useSearchNavigate } from '@/components/search/useSearchNavigate'
import { defaultTrainSearch, parseTrainSearch, trainSearchToQuery, validateTrainSearch } from '@/services/trains/query'
import { CLASS_INFO, QUOTA_LABEL, type Quota, type TrainClass, type TrainSearchParams } from '@/services/trains/types'
import s from '../shared/forms.module.css'

const CLASS_OPTIONS: Array<{ value: TrainClass | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All classes' },
  ...(Object.keys(CLASS_INFO) as TrainClass[]).map((c) => ({ value: c, label: `${c} · ${CLASS_INFO[c].label}` })),
]
const PAX = Array.from({ length: 6 }, (_, i) => ({ value: String(i + 1), label: `${i + 1} passenger${i ? 's' : ''}` }))
const QUOTAS = Object.keys(QUOTA_LABEL) as Quota[]

export function TrainSearchForm({ initial, compact, tone = 'dark' }: { initial?: TrainSearchParams; compact?: boolean; tone?: 'dark' | 'light' }) {
  const [p, setP] = useState<TrainSearchParams>(() => initialSearch('trains', parseTrainSearch, defaultTrainSearch, ['from', 'to'], initial))
  const [error, setError] = useState<string | null>(null)
  const go = useSearchNavigate('trains')
  const update = (patch: Partial<TrainSearchParams>) => {
    setError(null)
    setP((prev) => ({ ...prev, ...patch }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const err = validateTrainSearch(p)
    if (err) return setError(err)
    go(trainSearchToQuery(p))
  }

  return (
    <form onSubmit={submit} noValidate data-service="trains">
      <OptionRow>
        <span className={tone === 'dark' ? s.optLabelDark : s.optLabel}>Quota</span>
        {QUOTAS.map((q) => (
          <Chip
            key={q}
            selected={p.quota === q}
            onClick={() => update({ quota: q, date: q === 'TQ' ? addDays(todayISO(), 1) : p.date })}
            className={tone === 'dark' && p.quota !== q ? s.chipDark : undefined}
          >
            {QUOTA_LABEL[q]}
          </Chip>
        ))}
        {!compact && (
          <Link to={`${ROUTES.trains}#pnr`} className={tone === 'dark' ? s.optLinkDark : s.optLink}>
            Check PNR status →
          </Link>
        )}
      </OptionRow>
      <SearchSlab compact={compact}>
        <PairCell span={4} spanMd={12} onSwap={() => update({ from: p.to, to: p.from })}>
          <LocationField kind="station" label="From" value={p.from} onChange={(from) => update({ from })} />
          <LocationField kind="station" label="To" value={p.to} onChange={(to) => update({ to })} />
        </PairCell>
        <Cell span={2} spanMd={6} spanSm={12}>
          <DateField label="Journey date" value={p.date} max={addDays(todayISO(), 60)} onChange={(date) => update({ date })} quickPicks footer="Reservations open 60 days ahead · Tatkal opens a day before" />
        </Cell>
        <SelectSegment span={2} spanMd={6} spanSm={6} label="Class" value={p.cls} options={CLASS_OPTIONS} onChange={(cls) => update({ cls })} sub="Any berth type" />
        <SelectSegment span={2} spanMd={6} spanSm={6} label="Passengers" value={String(p.pax)} options={PAX} onChange={(v) => update({ pax: Number(v) })} sub={`${QUOTA_LABEL[p.quota]} quota`} />
        <SearchSubmit span={2} spanMd={6} label={compact ? 'Update' : 'Find trains'} compact={compact} />
      </SearchSlab>
      <FormError message={error} />
    </form>
  )
}

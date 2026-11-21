import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { FileText, Layers, Package, Truck } from 'lucide-react'
import { addDays, todayISO } from '@/lib/dates'
import { ROUTES } from '@/config/routes'
import { Segmented } from '@/components/ui/Field'
import { DateField } from '@/components/search/DateField'
import { LocationField } from '@/components/search/LocationField'
import { Cell, FormError, InputSegment, OptionRow, PairCell, SearchSlab, SearchSubmit } from '@/components/search/SearchUI'
import { initialSearch, useSearchNavigate } from '@/components/search/useSearchNavigate'
import { cargoSearchToQuery, defaultCargoSearch, parseCargoSearch, validateCargoSearch, WEIGHT_LIMITS } from '@/services/cargo/query'
import type { CargoSearchParams, ShipmentType } from '@/services/cargo/types'
import s from '../shared/forms.module.css'

const DEFAULT_WEIGHT: Record<ShipmentType, number> = { documents: 0.5, parcel: 12, pallet: 350, truckload: 6000 }

export function CargoSearchForm({ initial, compact, tone = 'dark' }: { initial?: CargoSearchParams; compact?: boolean; tone?: 'dark' | 'light' }) {
  const [p, setP] = useState<CargoSearchParams>(() => initialSearch('cargo', parseCargoSearch, defaultCargoSearch, ['from', 'to'], initial))
  const [weight, setWeight] = useState(String(p.weight))
  const [showDims, setShowDims] = useState(!!(p.l && p.w && p.h))
  const [error, setError] = useState<string | null>(null)
  const go = useSearchNavigate('cargo')
  const update = (patch: Partial<CargoSearchParams>) => {
    setError(null)
    setP((prev) => ({ ...prev, ...patch }))
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next = { ...p, weight: Number(weight) }
    if (!showDims) Object.assign(next, { l: undefined, w: undefined, h: undefined })
    const err = validateCargoSearch(next)
    if (err) return setError(err)
    go(cargoSearchToQuery(next))
  }
  const [min, max] = WEIGHT_LIMITS[p.type]

  return (
    <form onSubmit={submit} noValidate data-service="cargo">
      <OptionRow>
        <Segmented
          label="Shipment type"
          tone={tone}
          size="sm"
          value={p.type}
          onChange={(type) => {
            setWeight(String(DEFAULT_WEIGHT[type]))
            update({ type })
          }}
          options={[
            { value: 'documents', label: 'Documents', icon: <FileText /> },
            { value: 'parcel', label: 'Parcel', icon: <Package /> },
            { value: 'pallet', label: 'Pallets', icon: <Layers /> },
            { value: 'truckload', label: 'Full truck', icon: <Truck /> },
          ]}
        />
        {!compact && (
          <Link to={ROUTES.cargoTrack} className={tone === 'dark' ? s.optLinkDark : s.optLink}>
            Track a shipment →
          </Link>
        )}
      </OptionRow>
      <SearchSlab compact={compact}>
        <PairCell span={4} spanMd={12} onSwap={() => update({ from: p.to, to: p.from })}>
          <LocationField kind="cargoCity" label="Pickup city" value={p.from} onChange={(from) => update({ from })} />
          <LocationField kind="cargoCity" label="Deliver to" value={p.to} onChange={(to) => update({ to })} />
        </PairCell>
        <InputSegment
          span={2}
          spanMd={4}
          spanSm={6}
          label="Weight"
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step="0.5"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          suffix="kg"
          sub={`${min}–${max} kg`}
        />
        <InputSegment span={2} spanMd={4} spanSm={6} label="Pieces" type="number" inputMode="numeric" min={1} max={200} value={p.pieces} onChange={(e) => update({ pieces: Number(e.target.value) })} suffix="pcs" sub="Boxes or pallets" />
        <Cell span={2} spanMd={4} spanSm={12}>
          <DateField label="Pickup date" value={p.date} max={addDays(todayISO(), 30)} onChange={(date) => update({ date })} quickPicks align="end" />
        </Cell>
        <SearchSubmit span={2} spanMd={12} label={compact ? 'Update' : 'Get quotes'} compact={compact} />
      </SearchSlab>
      {!compact && (
        <div className={`${s.dims} ${tone === 'dark' ? s.dimsDark : ''}`}>
          <button type="button" className={s.dimsToggle} onClick={() => setShowDims((v) => !v)}>
            {showDims ? 'Remove package size' : '+ Add package size for an exact quote'}
          </button>
          {showDims && (
            <>
              {(['l', 'w', 'h'] as const).map((k) => (
                <input
                  key={k}
                  className={s.dimInput}
                  type="number"
                  min={1}
                  placeholder={k === 'l' ? 'Length' : k === 'w' ? 'Width' : 'Height'}
                  aria-label={`${k === 'l' ? 'Length' : k === 'w' ? 'Width' : 'Height'} in cm`}
                  value={p[k] ?? ''}
                  onChange={(e) => update({ [k]: e.target.value ? Number(e.target.value) : undefined })}
                />
              ))}
              <span>cm per piece · volumetric weight = L×W×H ÷ 5000</span>
            </>
          )}
        </div>
      )}
      <FormError message={error} />
    </form>
  )
}

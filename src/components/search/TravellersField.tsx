import { useState, type ReactNode } from 'react'
import { appConfig } from '@/config/app.config'
import { pluralize } from '@/lib/format'
import { Button } from '../ui/Button'
import { Chip, Counter } from '../ui/Field'
import { Popover } from '../ui/Overlay'
import { SegmentButton } from './SearchUI'
import s from './Search.module.css'

export interface PaxValue {
  adults: number
  children: number
  infants: number
}

export function TravellersField<C extends string>({
  value,
  onChange,
  cabin,
  cabins,
  onCabinChange,
  label = 'Travellers',
  extra,
}: {
  value: PaxValue
  onChange: (v: PaxValue) => void
  cabin?: C
  cabins?: Array<{ value: C; label: string }>
  onCabinChange?: (c: C) => void
  label?: string
  extra?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const total = value.adults + value.children + value.infants
  const max = appConfig.booking.maxPassengers
  const cabinLabel = cabins?.find((c) => c.value === cabin)?.label
  const set = (patch: Partial<PaxValue>) => {
    const next = { ...value, ...patch }
    if (next.infants > next.adults) next.infants = next.adults
    onChange(next)
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="end"
      label="Travellers and class"
      panelClassName={s.paxPanel}
      trigger={<SegmentButton label={label} value={pluralize(total, 'traveller')} sub={cabinLabel ?? `${value.adults} adult${value.adults > 1 ? 's' : ''}`} active={open} onClick={() => setOpen(!open)} />}
    >
      <Counter label="Adults" description="12 years and above" value={value.adults} min={1} max={max - value.children} onChange={(adults) => set({ adults })} />
      <Counter label="Children" description="2 – 11 years" value={value.children} max={max - value.adults} onChange={(children) => set({ children })} />
      <Counter label="Infants" description="Under 2, on lap" value={value.infants} max={value.adults} onChange={(infants) => set({ infants })} />
      {cabins && onCabinChange && (
        <div className={s.paxCabins}>
          <p className={s.paxHeading}>Cabin</p>
          <div className={s.chipWrap}>
            {cabins.map((c) => (
              <Chip key={c.value} selected={c.value === cabin} onClick={() => onCabinChange(c.value)}>
                {c.label}
              </Chip>
            ))}
          </div>
        </div>
      )}
      {extra}
      <div className={s.paxFoot}>
        <span>Up to {max} travellers per booking</span>
        <Button size="sm" variant="primary" onClick={() => setOpen(false)}>
          Done
        </Button>
      </div>
    </Popover>
  )
}

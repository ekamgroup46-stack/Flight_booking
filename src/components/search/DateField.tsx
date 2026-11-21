import { useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { addDays, diffInDays, todayISO } from '@/lib/dates'
import { formatDate } from '@/lib/format'
import { Chip } from '../ui/Field'
import { Popover } from '../ui/Overlay'
import { Calendar } from './Calendar'
import { SegmentButton } from './SearchUI'
import s from './Search.module.css'

function daysAway(iso: string): string {
  const n = diffInDays(iso, todayISO())
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  return n > 0 ? `In ${n} days` : 'Past date'
}

export function DateField({
  label,
  value,
  onChange,
  min = todayISO(),
  max,
  placeholder = 'Add date',
  rangeStart,
  rangeEnd,
  prices,
  onMonthChange,
  onOpenChange,
  quickPicks,
  onClear,
  footer,
  align = 'start',
}: {
  label: string
  value?: string
  onChange: (iso: string) => void
  min?: string
  max?: string
  placeholder?: string
  rangeStart?: string
  rangeEnd?: string
  prices?: Record<string, number | null>
  onMonthChange?: (month: string) => void
  onOpenChange?: (open: boolean) => void
  quickPicks?: boolean
  onClear?: () => void
  footer?: ReactNode
  align?: 'start' | 'end'
}) {
  const [open, setOpenState] = useState(false)
  const setOpen = (o: boolean) => {
    setOpenState(o)
    onOpenChange?.(o)
  }
  const pick = (iso: string) => {
    onChange(iso)
    setOpen(false)
  }
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align={align}
      label={`${label} calendar`}
      panelClassName={s.datePanel}
      trigger={
        <div className={s.dateTrigger}>
          <SegmentButton
            label={label}
            value={value ? formatDate(value, 'medium') : undefined}
            sub={value ? daysAway(value) : 'Pick a day'}
            placeholder={placeholder}
            active={open}
            onClick={() => setOpen(!open)}
          />
          {value && onClear && (
            <button type="button" className={s.clearDate} onClick={onClear} aria-label={`Clear ${label.toLowerCase()}`}>
              <X />
            </button>
          )}
        </div>
      }
    >
      {quickPicks && (
        <div className={s.quickPicks}>
          {[0, 1, 2].map((n) => {
            const iso = addDays(todayISO(), n)
            if (iso < min) return null
            return (
              <Chip key={n} selected={value === iso} onClick={() => pick(iso)}>
                {n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : formatDate(iso, 'medium')}
              </Chip>
            )
          })}
        </div>
      )}
      <Calendar value={value} onChange={pick} min={min} max={max} rangeStart={rangeStart} rangeEnd={rangeEnd} prices={prices} onMonthChange={onMonthChange} />
      {footer && <div className={s.dateFooter}>{footer}</div>}
    </Popover>
  )
}

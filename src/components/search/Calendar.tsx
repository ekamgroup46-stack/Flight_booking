import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMediaQuery } from '@/hooks'
import { cn } from '@/lib/cn'
import { monthGrid, parseISODate, todayISO } from '@/lib/dates'
import { formatDate, formatMoneyCompact } from '@/lib/format'
import s from './Search.module.css'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export function Calendar({
  value,
  onChange,
  min = todayISO(),
  max,
  rangeStart,
  rangeEnd,
  prices,
  onMonthChange,
  months: monthsProp = 2,
}: {
  value?: string
  onChange: (iso: string) => void
  min?: string
  max?: string
  rangeStart?: string
  rangeEnd?: string
  prices?: Record<string, number | null>
  onMonthChange?: (firstVisibleMonth: string) => void
  months?: 1 | 2
}) {
  const narrow = useMediaQuery('(max-width: 720px)')
  const months = narrow ? 1 : monthsProp
  const initial = parseISODate(value ?? min)
  const [cursor, setCursor] = useState({ y: initial.getFullYear(), m: initial.getMonth() })

  const minDate = parseISODate(min)
  const canPrev = cursor.y > minDate.getFullYear() || (cursor.y === minDate.getFullYear() && cursor.m > minDate.getMonth())

  const move = (delta: number) => {
    const d = new Date(cursor.y, cursor.m + delta, 1)
    setCursor({ y: d.getFullYear(), m: d.getMonth() })
    onMonthChange?.(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`)
  }

  // Cheapest quartile is highlighted in green.
  const cheap = useMemo(() => {
    if (!prices) return Infinity
    const vals = Object.values(prices).filter((v): v is number => typeof v === 'number').sort((a, b) => a - b)
    return vals.length ? vals[Math.floor(vals.length * 0.25)] : Infinity
  }, [prices])

  const grids = Array.from({ length: months }, (_, i) => {
    const d = new Date(cursor.y, cursor.m + i, 1)
    return { y: d.getFullYear(), m: d.getMonth(), cells: monthGrid(d.getFullYear(), d.getMonth()) }
  })

  return (
    <div className={s.calendar}>
      <div className={s.calNav}>
        <button type="button" onClick={() => move(-1)} disabled={!canPrev} aria-label="Previous month">
          <ChevronLeft />
        </button>
        <button type="button" onClick={() => move(1)} aria-label="Next month">
          <ChevronRight />
        </button>
      </div>
      <div className={s.calMonths}>
        {grids.map((g) => (
          <div key={`${g.y}-${g.m}`} className={s.calMonth}>
            <p className={s.calTitle}>{new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(g.y, g.m, 1))}</p>
            <div className={s.calGrid} role="grid">
              {WEEKDAYS.map((w) => (
                <span key={w} className={s.calWeekday} role="columnheader">
                  {w}
                </span>
              ))}
              {g.cells.map((iso, i) => {
                if (!iso) return <span key={`e${i}`} />
                const disabled = iso < min || (!!max && iso > max)
                const selected = iso === value
                const inRange = rangeStart && rangeEnd && iso > rangeStart && iso < rangeEnd
                const isEdge = iso === rangeStart || iso === rangeEnd
                const price = prices?.[iso]
                return (
                  <button
                    key={iso}
                    type="button"
                    role="gridcell"
                    disabled={disabled}
                    aria-selected={selected}
                    aria-label={formatDate(iso, 'long')}
                    className={cn(s.calDay, selected && s.calSelected, inRange && s.calInRange, isEdge && !selected && s.calEdge, iso === todayISO() && s.calToday)}
                    onClick={() => onChange(iso)}
                  >
                    <span>{Number(iso.slice(8))}</span>
                    {prices && !disabled && (
                      <em className={cn(typeof price === 'number' && price <= cheap && s.calCheap)}>{typeof price === 'number' ? formatMoneyCompact(price) : '·'}</em>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

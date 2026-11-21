import { CircleDot } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import type { Deck, Seat, SeatLayout } from '@/services/buses/types'
import s from './SeatMap.module.css'

function seatState(seat: Seat, selected: boolean) {
  if (seat.status === 'booked') return seat.ladiesOnly ? `${s.booked} ${s.bookedLadies}` : s.booked
  if (selected) return s.selected
  return seat.ladiesOnly ? s.ladies : s.available
}

function DeckView({ deck, selected, onToggle, disabled }: { deck: Deck; selected: string[]; onToggle: (seat: Seat) => void; disabled: (seat: Seat) => boolean }) {
  const sleeper = deck.seats[0]?.kind === 'sleeper'
  const cols = sleeper ? 'var(--b) 14px var(--b) var(--b)' : 'var(--c) var(--c) 14px var(--c) var(--c)'
  return (
    <div className={s.deck}>
      <div className={s.deckHead}>
        <span>{deck.label}</span>
        {deck.id === 'lower' && <CircleDot className={s.wheel} aria-label="Driver" />}
      </div>
      <div className={cn(s.grid, sleeper ? s.sleeperGrid : s.seaterGrid)} style={{ gridTemplateColumns: cols }} role="group" aria-label={deck.label}>
        {deck.seats.map((seat) => {
          const isSel = selected.includes(seat.id)
          const blocked = seat.status === 'booked' || (!isSel && disabled(seat))
          return (
            <button
              key={seat.id}
              type="button"
              className={cn(s.seat, sleeper ? s.sleeper : s.seater, seatState(seat, isSel))}
              style={{ gridColumn: seat.col + 1, gridRow: seat.row + 1 }}
              disabled={blocked}
              aria-pressed={isSel}
              aria-label={`${sleeper ? 'Berth' : 'Seat'} ${seat.label}, ${seat.status === 'booked' ? 'booked' : `${formatMoney(seat.price)}${seat.ladiesOnly ? ', reserved for women' : ''}`}`}
              title={seat.status === 'booked' ? `${seat.label} · Booked` : `${seat.label} · ${formatMoney(seat.price)}${seat.ladiesOnly ? ' · Women only' : ''}`}
              onClick={() => onToggle(seat)}
            >
              <span className={s.label}>{seat.label}</span>
              {sleeper && seat.status !== 'booked' && <span className={s.price}>₹{seat.price}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SeatMap({ layout, selected, onToggle, canSelect }: { layout: SeatLayout; selected: string[]; onToggle: (seat: Seat) => void; canSelect: (seat: Seat) => boolean }) {
  return (
    <div className={s.wrap}>
      <div className={s.decks}>
        {layout.decks.map((d) => (
          <DeckView key={d.id} deck={d} selected={selected} onToggle={onToggle} disabled={(seat) => !canSelect(seat)} />
        ))}
      </div>
      <Legend />
    </div>
  )
}

export function Legend({ className }: { className?: string }) {
  return (
    <ul className={cn(s.legend, className)}>
      <li>
        <i className={cn(s.swatch, s.available)} /> Available
      </li>
      <li>
        <i className={cn(s.swatch, s.selected)} /> Selected
      </li>
      <li>
        <i className={cn(s.swatch, s.booked)} /> Booked
      </li>
      <li>
        <i className={cn(s.swatch, s.ladies)} /> Reserved for women
      </li>
    </ul>
  )
}

/** Static demo deck for marketing sections. */
export function SeatLegend() {
  const demo: Seat[] = [0, 1].flatMap((row) =>
    [0, 2, 3].map((col, i) => ({
      id: `D${row}${i}`,
      label: `L${row * 3 + i + 1}`,
      deck: 'lower' as const,
      kind: 'sleeper' as const,
      row,
      col,
      status: row === 0 && col === 2 ? ('booked' as const) : ('available' as const),
      ladiesOnly: row === 1 && col === 0,
      price: col === 0 ? 1349 : 1249,
    })),
  )
  return (
    <div className={s.demo} data-service="buses">
      <DeckView deck={{ id: 'lower', label: 'Lower deck · 2+1 sleeper', rows: 2, cols: 4, aisleCol: 1, seats: demo }} selected={['D03']} onToggle={() => {}} disabled={() => false} />
      <Legend />
    </div>
  )
}

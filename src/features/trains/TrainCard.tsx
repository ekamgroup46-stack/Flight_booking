import { Route, Star, UtensilsCrossed } from 'lucide-react'
import { RouteLine } from '@/components/brand/Brand'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Display'
import { cn } from '@/lib/cn'
import { dateOf, diffInDays, timeOf } from '@/lib/dates'
import { formatDate, formatDuration, formatMoney } from '@/lib/format'
import { CLASS_INFO, TRAIN_TYPE_LABEL, type ClassAvailability, type Train } from '@/services/trains/types'
import s from './TrainCard.module.css'

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function statusText(c: ClassAvailability) {
  if (c.status === 'AVL') return `AVL ${c.count}`
  if (c.status === 'REGRET') return 'Regret'
  return `${c.status} ${c.count}`
}

export function TrainCard({
  train,
  pax,
  selectedClass,
  onSelectClass,
  onBook,
  onShowRoute,
  visibleClasses,
}: {
  train: Train
  pax: number
  selectedClass?: string
  onSelectClass: (cls: ClassAvailability) => void
  onBook: (cls: ClassAvailability) => void
  onShowRoute: () => void
  visibleClasses?: string[]
}) {
  const offset = diffInDays(dateOf(train.arriveAt), dateOf(train.departAt))
  const classes = visibleClasses?.length ? train.classes.filter((c) => visibleClasses.includes(c.cls)) : train.classes
  const chosen = train.classes.find((c) => c.cls === selectedClass)
  return (
    <article className={cn(s.card, chosen && s.active)}>
      <header className={s.head}>
        <div className={s.name}>
          <span className={s.num}>{train.number}</span>
          <strong>{train.name}</strong>
          <Badge tone="outline">{TRAIN_TYPE_LABEL[train.type]}</Badge>
        </div>
        <div className={s.meta}>
          <span className={s.days} aria-label="Runs on">
            {DAY_LETTERS.map((d, i) => (
              <i key={i} className={train.runsOn[i] ? s.dayOn : undefined}>
                {d}
              </i>
            ))}
          </span>
          <span className={s.rating}>
            <Star /> {train.rating}
          </span>
          {train.pantry && (
            <span className={s.rating}>
              <UtensilsCrossed /> Pantry
            </span>
          )}
          <button type="button" className={s.routeBtn} onClick={onShowRoute}>
            <Route /> Route
          </button>
        </div>
      </header>

      <div className={s.timing}>
        <div className={s.end}>
          <b className="mono">{timeOf(train.departAt)}</b>
          <span>
            {train.from.name} · {formatDate(dateOf(train.departAt), 'short')}
          </span>
        </div>
        <RouteLine top={formatDuration(train.durationMin)} bottom={`${train.stops.length - 2} halts · ${train.distanceKm} km`} />
        <div className={cn(s.end, s.right)}>
          <b className="mono">
            {timeOf(train.arriveAt)}
            {offset > 0 && <sup>+{offset}</sup>}
          </b>
          <span>
            {train.to.name} · {formatDate(dateOf(train.arriveAt), 'short')}
          </span>
        </div>
      </div>

      <div className={s.classes} role="radiogroup" aria-label={`Classes on ${train.number}`}>
        {classes.map((c) => (
          <button
            key={c.cls}
            type="button"
            role="radio"
            aria-checked={selectedClass === c.cls}
            disabled={c.status === 'REGRET'}
            className={cn(s.cls, s[`st_${c.status}`], selectedClass === c.cls && s.clsOn)}
            onClick={() => onSelectClass(c)}
          >
            <span className={s.clsTop}>
              <b>{c.cls}</b>
              <span>{formatMoney(c.fare)}</span>
            </span>
            <span className={s.status}>{statusText(c)}</span>
            <span className={s.chance}>{c.status === 'AVL' ? CLASS_INFO[c.cls].label : c.confirmChance ? `${c.confirmChance}% likely to confirm` : 'No seats'}</span>
          </button>
        ))}
      </div>

      {chosen && (
        <footer className={s.book}>
          <div>
            <strong>
              {chosen.cls} · {CLASS_INFO[chosen.cls].label}
            </strong>
            <span>
              {formatMoney(chosen.fare)} × {pax} = <b>{formatMoney(chosen.fare * pax)}</b>
              {chosen.status !== 'AVL' && ` · ${statusText(chosen)}`}
            </span>
          </div>
          <Button variant="accent" onClick={() => onBook(chosen)}>
            {chosen.status === 'AVL' ? 'Book now' : 'Book on waitlist'}
          </Button>
        </footer>
      )}
    </article>
  )
}

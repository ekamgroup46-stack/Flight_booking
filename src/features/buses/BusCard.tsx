import { useState } from 'react'
import { BatteryCharging, BedDouble, Cctv, Coffee, Droplet, Lamp, MapPinned, Venus, Wifi, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { RouteLine } from '@/components/brand/Brand'
import { Button } from '@/components/ui/Button'
import { Badge, Rating } from '@/components/ui/Display'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { appConfig } from '@/config/app.config'
import { cn } from '@/lib/cn'
import { dateOf, diffInDays, timeOf } from '@/lib/dates'
import { formatDuration, formatMoney } from '@/lib/format'
import { useSeatLayout } from '@/services/buses/api'
import { AMENITY_LABEL, type Bus, type BusAmenity, type BusPoint, type Seat } from '@/services/buses/types'
import { toast } from '@/store/toast.store'
import { SeatMap } from './SeatMap'
import s from './BusCard.module.css'

const AMENITY_ICON: Record<BusAmenity, LucideIcon> = {
  wifi: Wifi,
  charging: BatteryCharging,
  water: Droplet,
  blanket: BedDouble,
  snacks: Coffee,
  light: Lamp,
  cctv: Cctv,
  tracking: MapPinned,
}

function PointPicker({ label, points, value, onChange }: { label: string; points: BusPoint[]; value: string; onChange: (id: string) => void }) {
  return (
    <fieldset className={s.points}>
      <legend>{label}</legend>
      {points.map((p) => (
        <label key={p.id} className={cn(s.point, value === p.id && s.pointOn)}>
          <input type="radio" name={label} checked={value === p.id} onChange={() => onChange(p.id)} />
          <span className="mono">{timeOf(p.at)}</span>
          <span>{p.name}</span>
        </label>
      ))}
    </fieldset>
  )
}

function SeatPanel({ bus, onContinue }: { bus: Bus; onContinue: (seats: Seat[], boarding: BusPoint, dropping: BusPoint) => void }) {
  const { data, isLoading, isError, error, refetch } = useSeatLayout(bus.id)
  const [selected, setSelected] = useState<string[]>([])
  const [boarding, setBoarding] = useState(bus.boarding[0].id)
  const [dropping, setDropping] = useState(bus.dropping[bus.dropping.length - 1].id)
  const max = appConfig.booking.maxBusSeats
  const seats = data?.decks.flatMap((d) => d.seats).filter((x) => selected.includes(x.id)) ?? []
  const total = seats.reduce((sum, x) => sum + x.price, 0)

  if (isLoading)
    return (
      <div className={s.panel}>
        <Skeleton h={260} w={220} r={18} />
        <Skeleton h={260} w={220} r={18} />
      </div>
    )
  if (isError || !data) return <ErrorState compact title="Couldn’t load the seat map" error={error} onRetry={() => refetch()} />

  return (
    <div className={s.panel}>
      <SeatMap
        layout={data}
        selected={selected}
        canSelect={() => selected.length < max}
        onToggle={(seat) => {
          if (selected.includes(seat.id)) setSelected((x) => x.filter((id) => id !== seat.id))
          else if (selected.length >= max) toast.info(`Up to ${max} seats per booking`)
          else setSelected((x) => [...x, seat.id])
        }}
      />
      <div className={s.side}>
        <PointPicker label="Boarding point" points={bus.boarding} value={boarding} onChange={setBoarding} />
        <PointPicker label="Dropping point" points={bus.dropping} value={dropping} onChange={setDropping} />
        <div className={s.summary}>
          <div className={s.summaryRow}>
            <span>Seats</span>
            <strong>{seats.length ? seats.map((x) => x.label).join(', ') : 'None yet'}</strong>
          </div>
          {seats.some((x) => x.ladiesOnly) && (
            <p className={s.ladiesNote}>
              <Venus size={14} /> Women-reserved seat selected — that passenger must be female.
            </p>
          )}
          <div className={s.summaryRow}>
            <span>Total</span>
            <strong className={s.total}>{formatMoney(total)}</strong>
          </div>
          <Button
            block
            variant="accent"
            disabled={!seats.length}
            onClick={() =>
              onContinue(
                seats,
                bus.boarding.find((p) => p.id === boarding)!,
                bus.dropping.find((p) => p.id === dropping)!,
              )
            }
          >
            {seats.length ? `Continue with ${seats.length} seat${seats.length > 1 ? 's' : ''}` : 'Select seats to continue'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function BusCard({ bus, open, onToggle, onContinue, cheapest }: { bus: Bus; open: boolean; onToggle: () => void; onContinue: (seats: Seat[], boarding: BusPoint, dropping: BusPoint) => void; cheapest?: boolean }) {
  const offset = diffInDays(dateOf(bus.arriveAt), dateOf(bus.departAt))
  return (
    <article className={cn(s.card, open && s.open)}>
      <div className={s.row}>
        <div className={s.op}>
          <div className={s.opTop}>
            <strong>{bus.operator}</strong>
            <Rating value={bus.rating} count={bus.reviews} />
          </div>
          <span className={s.type}>{bus.busType}</span>
          <div className={s.amen}>
            {bus.amenities.map((a) => {
              const Icon = AMENITY_ICON[a]
              return (
                <span key={a} title={AMENITY_LABEL[a]} aria-label={AMENITY_LABEL[a]}>
                  <Icon />
                </span>
              )
            })}
          </div>
        </div>
        <div className={s.journey}>
          <div className={s.end}>
            <b className="mono">{timeOf(bus.departAt)}</b>
            <span>{bus.boarding[0].name}</span>
          </div>
          <RouteLine top={formatDuration(bus.durationMin)} bottom={`${bus.distanceKm} km`} dashed />
          <div className={cn(s.end, s.right)}>
            <b className="mono">
              {timeOf(bus.arriveAt)}
              {offset > 0 && <sup>+{offset}</sup>}
            </b>
            <span>{bus.dropping[bus.dropping.length - 1].name}</span>
          </div>
        </div>
        <div className={s.priceCol}>
          <span className={s.from}>from</span>
          <span className={s.price}>{formatMoney(bus.price)}</span>
          <span className={cn(s.left, bus.seatsLeft <= 6 && s.leftLow)}>{bus.seatsLeft} seats left</span>
          <Button size="sm" variant={open ? 'secondary' : 'accent'} onClick={onToggle} aria-expanded={open}>
            {open ? 'Hide seats' : 'Select seats'}
          </Button>
        </div>
      </div>
      <div className={s.tags}>
        {cheapest && <Badge tone="accent">Cheapest</Badge>}
        {bus.electric && (
          <Badge tone="ok" icon={<Zap />}>
            Electric
          </Badge>
        )}
        <span className={s.policy}>{bus.cancellation}</span>
      </div>
      {open && <SeatPanel bus={bus} onContinue={onContinue} />}
    </article>
  )
}

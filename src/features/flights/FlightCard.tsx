import { useState } from 'react'
import { Check, Leaf, Luggage, X } from 'lucide-react'
import { CarrierMark, RouteLine } from '@/components/brand/Brand'
import { Button } from '@/components/ui/Button'
import { Badge, Tabs } from '@/components/ui/Display'
import { cn } from '@/lib/cn'
import { diffInDays, dateOf, timeOf } from '@/lib/dates'
import { formatDate, formatDuration, formatMoney } from '@/lib/format'
import { findAirport } from '@/services/locations/api'
import type { FareOption, Flight } from '@/services/flights/types'
import s from './FlightCard.module.css'

export function FlightCard({ flight, tags, pax, onChoose, actionLabel = 'Book' }: { flight: Flight; tags: string[]; pax: number; onChoose: (fare: FareOption) => void; actionLabel?: string }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'fares' | 'details'>('fares')
  const first = flight.legs[0]
  const last = flight.legs[flight.legs.length - 1]
  const offset = diffInDays(dateOf(flight.arriveAt), dateOf(flight.departAt))

  return (
    <article className={cn(s.card, open && s.open)}>
      <div className={s.row}>
        <div className={s.airline}>
          <CarrierMark code={flight.airline.code} color={flight.airline.color} size={42} label={flight.airline.name} />
          <div>
            <strong>{flight.airline.name}</strong>
            <span className="mono">{flight.legs.map((l) => l.flightNo).join(' · ')}</span>
          </div>
        </div>
        <div className={s.journey}>
          <div className={s.end}>
            <b className="mono">{timeOf(flight.departAt)}</b>
            <span>{first.from}</span>
          </div>
          <RouteLine stops={flight.layovers.map((l) => l.airport)} top={formatDuration(flight.durationMin)} bottom={flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`} className={s.line} />
          <div className={cn(s.end, s.endRight)}>
            <b className="mono">
              {timeOf(flight.arriveAt)}
              {offset > 0 && <sup>+{offset}</sup>}
            </b>
            <span>{last.to}</span>
          </div>
        </div>
        <div className={s.priceCol}>
          <span className={s.price}>{formatMoney(flight.price)}</span>
          <span className={s.per}>per adult</span>
          <Button size="sm" variant={open ? 'secondary' : 'accent'} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            {open ? 'Hide fares' : 'View fares'}
          </Button>
        </div>
      </div>

      <div className={s.tags}>
        {tags.map((t) => (
          <Badge key={t} tone="accent">
            {t}
          </Badge>
        ))}
        {flight.seatsLeft && <Badge tone="warn">{flight.seatsLeft} seats left at this fare</Badge>}
        <span className={s.fact}>{flight.onTimePct}% on time</span>
        <span className={s.fact}>
          <Leaf /> {flight.co2Kg} kg CO₂e
        </span>
        <span className={s.fact}>
          <Luggage /> {flight.fares[0].checkinBag} check-in
        </span>
      </div>

      {open && (
        <div className={s.expand}>
          <Tabs
            label="Flight information"
            value={tab}
            onChange={setTab}
            items={[
              { id: 'fares', label: 'Choose a fare' },
              { id: 'details', label: 'Flight details' },
            ]}
          />
          {tab === 'fares' ? (
            <div className={s.fares}>
              {flight.fares.map((fare, i) => (
                <div key={fare.id} className={cn(s.fare, i === 1 && s.fareRec)}>
                  {i === 1 && <span className={s.rec}>Most chosen</span>}
                  <div className={s.fareHead}>
                    <strong>{fare.name}</strong>
                    <span className={s.farePrice}>{formatMoney(fare.price)}</span>
                  </div>
                  <ul className={s.fareList}>
                    <li>
                      <Check /> Cabin {fare.cabinBag} · Check-in {fare.checkinBag}
                    </li>
                    <li>{fare.id === 'saver' ? <X className={s.no} /> : <Check />} {fare.change}</li>
                    <li>{fare.refundable ? <Check /> : <X className={s.no} />} {fare.cancellation}</li>
                    {fare.perks.map((p) => (
                      <li key={p}>
                        <Check /> {p}
                      </li>
                    ))}
                  </ul>
                  <Button block variant={i === 1 ? 'accent' : 'secondary'} onClick={() => onChoose(fare)}>
                    {actionLabel}
                  </Button>
                  <span className={s.fareTotal}>{pax > 1 ? `≈ ${formatMoney(fare.price * pax)} for ${pax} travellers` : 'Taxes included'}</span>
                </div>
              ))}
            </div>
          ) : (
            <ol className={s.legs}>
              {flight.legs.map((leg, i) => {
                const a = findAirport(leg.from)
                const b = findAirport(leg.to)
                const lay = flight.layovers[i]
                return (
                  <li key={leg.flightNo + i}>
                    <div className={s.leg}>
                      <span className={s.legRail} aria-hidden />
                      <div className={s.legStop}>
                        <b className="mono">{timeOf(leg.departAt)}</b>
                        <span>
                          {a?.city} ({leg.from}) · {a?.name}
                        </span>
                        <em>{formatDate(dateOf(leg.departAt), 'medium')}</em>
                      </div>
                      <div className={s.legMid}>
                        {flight.airline.name} · {leg.flightNo} · {leg.aircraft} · {formatDuration(leg.durationMin)}
                      </div>
                      <div className={s.legStop}>
                        <b className="mono">{timeOf(leg.arriveAt)}</b>
                        <span>
                          {b?.city} ({leg.to}) · {b?.name}
                        </span>
                        <em>{formatDate(dateOf(leg.arriveAt), 'medium')}</em>
                      </div>
                    </div>
                    {lay && (
                      <div className={s.layover}>
                        {formatDuration(lay.durationMin)} layover in {findAirport(lay.airport)?.city} · change planes, bags checked through
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      )}
    </article>
  )
}

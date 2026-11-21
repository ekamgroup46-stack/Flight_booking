import { PseudoQR, RouteLine, Roundel, Ticket } from '@/components/brand/Brand'
import { Badge } from '@/components/ui/Display'
import { SERVICES } from '@/config/services'
import { dateOf, timeOf } from '@/lib/dates'
import { formatDate, formatDuration } from '@/lib/format'
import { bookingTab } from '@/services/bookings/api'
import type { Booking } from '@/services/bookings/types'
import { buildIcs, downloadFile } from '@/lib/files'
import s from './BookingTicket.module.css'

const short = (name: string, code?: string) => code ?? name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()

export function downloadCalendar(b: Booking) {
  const first = b.item.segments[0]
  const ics = buildIcs({
    uid: b.id,
    title: `${SERVICES[b.service].label}: ${b.item.title}`,
    start: b.item.start,
    end: b.item.end,
    location: first?.from.sub ? `${first.from.name}, ${first.from.sub}` : first?.from.name,
    description: `${b.reference.label} ${b.reference.value} · Booking ${b.id} · ${b.item.subtitle}`,
  })
  downloadFile(`ekam-${b.id}.ics`, ics, 'text/calendar')
}

export function BookingTicket({ booking }: { booking: Booking }) {
  const { item } = booking
  const first = item.segments[0]
  const last = item.segments[item.segments.length - 1]
  const totalMin = item.segments.reduce((sum, x) => sum + x.durationMin, 0)
  const tab = bookingTab(booking)
  const people =
    item.details === 'passengers'
      ? booking.travellers.map((t) => `${t.firstName} ${t.lastName}`.trim() + (t.seat ? ` · ${t.seat}` : t.berth && t.berth !== 'No preference' ? ` · ${t.berth}` : ''))
      : item.details === 'cab'
        ? [booking.cab?.passengerName ?? '', booking.cab?.pickupAddress ?? ''].filter(Boolean)
        : [`From ${booking.cargo?.sender.name}`, `To ${booking.cargo?.receiver.name}`]

  return (
    <Ticket notch="71%" className={s.wrap} innerClassName={s.ticket}>
      <div className={s.main} data-service={booking.service}>
        <span className={s.stripe} aria-hidden />
        <header className={s.head}>
          <span className={s.service}>
            <Roundel service={booking.service} size={26} /> {SERVICES[booking.service].label}
          </span>
          <Badge tone={booking.status === 'cancelled' ? 'bad' : tab === 'completed' ? 'neutral' : 'ok'}>{booking.status === 'cancelled' ? 'Cancelled' : tab === 'completed' ? 'Completed' : 'Confirmed'}</Badge>
        </header>
        <div className={s.route}>
          <div>
            <span className={s.code}>{short(first.from.name, first.from.code)}</span>
            <span className={s.place}>{first.from.name}</span>
            <time className={s.time}>
              {formatDate(dateOf(first.from.at), 'medium')} · {timeOf(first.from.at)}
            </time>
          </div>
          <RouteLine top={formatDuration(totalMin)} bottom={item.segments.length > 1 ? `${item.segments.length} legs` : first.reference} className={s.line} />
          <div className={s.right}>
            <span className={s.code}>{short(last.to.name, last.to.code)}</span>
            <span className={s.place}>{last.to.name}</span>
            <time className={s.time}>
              {formatDate(dateOf(last.to.at), 'medium')} · {timeOf(last.to.at)}
            </time>
          </div>
        </div>
        <dl className={s.meta}>
          {Object.entries(item.meta)
            .slice(0, 6)
            .map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
        </dl>
        <div className={s.people}>
          <span>{item.details === 'cargo' ? 'Parties' : item.details === 'cab' ? 'Passenger' : 'Travellers'}</span>
          <ul>
            {people.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className={s.stub}>
        <span className={s.refLabel}>{booking.reference.label}</span>
        <strong className={s.ref}>{booking.reference.value}</strong>
        <PseudoQR value={booking.id} size={108} />
        <span className={s.bid}>Booking {booking.id}</span>
      </div>
    </Ticket>
  )
}

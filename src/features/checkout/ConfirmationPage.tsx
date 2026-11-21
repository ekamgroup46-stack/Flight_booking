import { useParams } from 'react-router'
import { CalendarPlus, Check, Printer, Share2, Ticket } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { ROUTES } from '@/config/routes'
import { SERVICES, type ServiceId } from '@/config/services'
import { useDocumentTitle } from '@/hooks'
import { copyToClipboard } from '@/lib/files'
import { formatDateTime } from '@/lib/format'
import { useBooking } from '@/services/bookings/api'
import { toast } from '@/store/toast.store'
import { BookingTicket, downloadCalendar } from '../bookings/BookingTicket'
import { PriceBreakdown } from './CheckoutSummary'
import s from './Confirmation.module.css'

const NEXT_STEPS: Record<ServiceId, string[]> = {
  flights: ['Web check-in opens 48 hours before departure — we’ll remind you with a direct link.', 'Carry a government photo ID that matches the traveller name.', 'Reach the airport 2 hours before domestic and 3 hours before international departures.'],
  trains: ['The chart is prepared about 4 hours before departure; we’ll message your coach and berth.', 'At least one passenger must carry an original photo ID on board.', 'Waitlisted tickets that don’t confirm are refunded automatically.'],
  buses: ['Show this m-ticket on your phone when boarding — no printout needed.', 'The operator’s contact and a live tracking link arrive 2 hours before departure.', 'Reach the boarding point 15 minutes early.'],
  cabs: ['Driver name, photo and car number reach you 60 minutes before pickup.', 'Share your live trip with family from the SMS link.', 'Tolls and taxes are already included in your fare.'],
  cargo: ['Our pickup partner calls the sender 30 minutes before arriving.', 'Keep the package sealed and the invoice ready if the value exceeds ₹50,000.', 'Track every scan with your tracking ID.'],
}

export default function ConfirmationPage() {
  const { bookingId } = useParams()
  const { data: booking, isLoading, isError } = useBooking(bookingId)
  useDocumentTitle(booking ? `Booked · ${booking.reference.value}` : 'Booking confirmed')

  if (isLoading)
    return (
      <div className="container" style={{ padding: '64px var(--gutter)' }}>
        <Skeleton h={40} w={320} />
        <Skeleton h={260} r={22} style={{ marginTop: 28 }} />
      </div>
    )
  if (isError || !booking)
    return (
      <div className="container" style={{ padding: '72px var(--gutter)' }}>
        <EmptyState title="We couldn’t find that booking" body="It may have been made on another device. Check My Bookings or the confirmation email." action={<ButtonLink to={ROUTES.bookings}>Go to My Bookings</ButtonLink>} />
      </div>
    )

  const share = async () => {
    const text = `${booking.item.title} · ${booking.reference.label} ${booking.reference.value}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Ekam booking', text, url: window.location.href })
        return
      } catch {
        /* user dismissed */
      }
    }
    if (await copyToClipboard(`${text} · ${window.location.href}`)) toast.success('Trip details copied', 'Paste them anywhere to share.')
  }

  return (
    <div className={s.page} data-service={booking.service}>
      <div className="container">
        <header className={s.hero}>
          <span className={s.check} aria-hidden>
            <Check strokeWidth={3} />
          </span>
          <div>
            <p className={s.kicker}>
              {SERVICES[booking.service].label} · {booking.reference.label} {booking.reference.value}
            </p>
            <h1 className={s.title}>
              {booking.service === 'cargo' ? (
                <>
                  Pickup booked. <span className="serif-i">Leave it to us.</span>
                </>
              ) : (
                <>
                  You’re all set. <span className="serif-i">Bon voyage.</span>
                </>
              )}
            </h1>
            <p className={s.sub}>
              Confirmation sent to <strong>{booking.contact.email}</strong> and +91 {booking.contact.phone}.
            </p>
          </div>
        </header>

        <div className={s.ticket}>
          <BookingTicket booking={booking} />
        </div>

        <div className={s.actions} data-print="hide">
          <Button variant="secondary" iconLeft={<CalendarPlus />} onClick={() => downloadCalendar(booking)}>
            Add to calendar
          </Button>
          <Button variant="secondary" iconLeft={<Printer />} onClick={() => window.print()}>
            Print / save PDF
          </Button>
          <Button variant="secondary" iconLeft={<Share2 />} onClick={share}>
            Share trip
          </Button>
          <ButtonLink to={ROUTES.bookings} variant="primary" iconLeft={<Ticket />}>
            My bookings
          </ButtonLink>
        </div>

        <div className={s.grid}>
          <section className={s.card}>
            <h2>Payment receipt</h2>
            <PriceBreakdown pricing={booking.pricing} couponCode={booking.coupon?.code} />
            <dl className={s.paid}>
              <div>
                <dt>Paid with</dt>
                <dd>{booking.payment.label}</dd>
              </div>
              <div>
                <dt>Transaction</dt>
                <dd className="mono">{booking.payment.txnId}</dd>
              </div>
              <div>
                <dt>Paid on</dt>
                <dd>{formatDateTime(booking.payment.paidAt)}</dd>
              </div>
            </dl>
          </section>
          <section className={s.card}>
            <h2>What happens next</h2>
            <ol className={s.next}>
              {NEXT_STEPS[booking.service].map((step, i) => (
                <li key={i}>
                  <span>{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <ButtonLink to={SERVICES[booking.service].path} variant="link">
              Book another {SERVICES[booking.service].noun} →
            </ButtonLink>
          </section>
        </div>
      </div>
    </div>
  )
}

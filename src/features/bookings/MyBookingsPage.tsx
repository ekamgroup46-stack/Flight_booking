import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { CalendarPlus, ChevronRight, Info, Printer, XCircle } from 'lucide-react'
import { Roundel } from '@/components/brand/Brand'
import { SectionHead } from '@/components/layout/Section'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Badge, Tabs } from '@/components/ui/Display'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Modal } from '@/components/ui/Overlay'
import { ROUTES } from '@/config/routes'
import { SERVICES } from '@/config/services'
import { useDocumentTitle } from '@/hooks'
import { getErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/cn'
import { dateOf, timeOf } from '@/lib/dates'
import { formatDate, formatMoney } from '@/lib/format'
import { bookingsApi, bookingTab, useBookings, useCancelBooking, type BookingTab } from '@/services/bookings/api'
import type { Booking } from '@/services/bookings/types'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/store/toast.store'
import { BookingTicket, downloadCalendar } from './BookingTicket'
import s from './MyBookings.module.css'

function CancelDialog({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  const quote = useQuery({ queryKey: ['bookings', booking?.id, 'cancel-quote'], queryFn: () => bookingsApi.cancellationQuote(booking!.id), enabled: !!booking, staleTime: 0 })
  const cancel = useCancelBooking()
  return (
    <Modal
      open={!!booking}
      onClose={onClose}
      size="sm"
      tone={booking?.service}
      title="Cancel this booking?"
      description={booking ? `${booking.item.title} · ${booking.reference.label} ${booking.reference.value}` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Keep booking
          </Button>
          <Button
            variant="danger"
            disabled={!quote.data?.cancellable}
            loading={cancel.isPending}
            onClick={() =>
              cancel.mutate(booking!.id, {
                onSuccess: (b) => {
                  toast.success('Booking cancelled', `${formatMoney(b.cancellation?.refundAmount ?? 0)} is on its way to your original payment method.`)
                  onClose()
                },
                onError: (e) => toast.error('Couldn’t cancel', getErrorMessage(e)),
              })
            }
          >
            Cancel & refund
          </Button>
        </>
      }
    >
      {quote.isLoading ? (
        <Skeleton h={90} r={14} />
      ) : quote.isError ? (
        <p>{getErrorMessage(quote.error)}</p>
      ) : quote.data && !quote.data.cancellable ? (
        <p className={s.muted}>{quote.data.reason}</p>
      ) : quote.data ? (
        <dl className={s.refund}>
          <div>
            <dt>You paid</dt>
            <dd>{formatMoney(quote.data.paid)}</dd>
          </div>
          <div>
            <dt>Cancellation charges</dt>
            <dd>{quote.data.fee ? `−${formatMoney(quote.data.fee)}` : '₹0'}</dd>
          </div>
          <div className={s.refundTotal}>
            <dt>Refund</dt>
            <dd>{formatMoney(quote.data.refund)}</dd>
          </div>
          <p className={s.muted}>
            <Info size={14} /> UPI refunds are usually instant; cards take 3–7 working days.
          </p>
        </dl>
      ) : null}
    </Modal>
  )
}

function BookingRow({ booking, onView, onCancel }: { booking: Booking; onView: () => void; onCancel: () => void }) {
  const tab = bookingTab(booking)
  return (
    <article className={cn(s.row, tab === 'cancelled' && s.rowCancelled)} data-service={booking.service}>
      <span className={s.rail} aria-hidden />
      <Roundel service={booking.service} size={40} />
      <button type="button" className={s.rowMain} onClick={onView}>
        <span className={s.rowTop}>
          <span className="mono">{formatDate(dateOf(booking.item.start), 'medium')} · {timeOf(booking.item.start)}</span>
          <Badge tone={tab === 'cancelled' ? 'bad' : tab === 'completed' ? 'neutral' : 'ok'}>{tab === 'cancelled' ? 'Cancelled' : tab === 'completed' ? 'Completed' : 'Upcoming'}</Badge>
        </span>
        <strong>{booking.item.title}</strong>
        <span className={s.rowSub}>{booking.item.subtitle}</span>
      </button>
      <div className={s.rowSide}>
        <span className={s.ref}>
          {booking.reference.label} <b className="mono">{booking.reference.value}</b>
        </span>
        <span className={s.amount}>{formatMoney(booking.pricing.total)}</span>
        {booking.cancellation && <span className={s.refundNote}>Refund {formatMoney(booking.cancellation.refundAmount)} · {booking.cancellation.status}</span>}
        <div className={s.rowActions}>
          {tab === 'upcoming' && (
            <Button size="sm" variant="ghost" iconLeft={<XCircle />} onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button size="sm" variant="secondary" iconRight={<ChevronRight />} onClick={onView}>
            View
          </Button>
        </div>
      </div>
    </article>
  )
}

const TABS: BookingTab[] = ['upcoming', 'completed', 'cancelled']

export default function MyBookingsPage() {
  useDocumentTitle('My bookings')
  const user = useAuthStore((st) => st.user)
  const { data, isLoading, isError, error, refetch } = useBookings()
  // The tab lives in the URL so the profile menu can deep-link to upcoming or past trips.
  const [params, setParams] = useSearchParams()
  const tab: BookingTab = TABS.includes(params.get('tab') as BookingTab) ? (params.get('tab') as BookingTab) : 'upcoming'
  const setTab = (t: BookingTab) => setParams({ tab: t }, { replace: true })
  const [viewing, setViewing] = useState<Booking | null>(null)
  const [cancelling, setCancelling] = useState<Booking | null>(null)

  const groups = useMemo(() => {
    const g: Record<BookingTab, Booking[]> = { upcoming: [], completed: [], cancelled: [] }
    for (const b of data ?? []) g[bookingTab(b)].push(b)
    g.upcoming.sort((a, b) => a.item.start.localeCompare(b.item.start))
    g.completed.sort((a, b) => b.item.start.localeCompare(a.item.start))
    g.cancelled.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return g
  }, [data])

  const list = groups[tab]

  return (
    <div className="container" style={{ paddingTop: 48 }}>
      <SectionHead
        eyebrow={user ? `Signed in as ${user.name}` : 'Bookings on this device'}
        title={
          <>
            Every trip, <span className="serif-i">one</span> list.
          </>
        }
        lede="Flights, trains, buses, cabs and shipments together — manage, cancel or add them to your calendar."
      />
      {!user && (
        <div className={s.nudge}>
          <Info />
          <span>
            You’re seeing bookings made in this browser. <Link to={ROUTES.login}>Log in</Link> to sync them across devices.
          </span>
        </div>
      )}
      <Tabs<BookingTab>
        label="Booking status"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'upcoming', label: 'Upcoming', meta: data ? groups.upcoming.length : undefined },
          { id: 'completed', label: 'Past', meta: data ? groups.completed.length : undefined },
          { id: 'cancelled', label: 'Cancelled', meta: data ? groups.cancelled.length : undefined },
        ]}
      />
      <div className={s.list}>
        {isLoading ? (
          Array.from({ length: 3 }, (_, i) => <Skeleton key={i} h={112} r={20} />)
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : !list.length ? (
          <EmptyState
            title={tab === 'upcoming' ? 'No upcoming trips — yet' : tab === 'completed' ? 'No past trips yet' : 'Nothing cancelled'}
            body={tab === 'upcoming' ? 'Your next departure is one search away.' : 'Trips will show up here once they’re done.'}
            action={tab === 'upcoming' ? <ButtonLink to={ROUTES.home}>Plan a trip</ButtonLink> : undefined}
          />
        ) : (
          list.map((b) => <BookingRow key={b.id} booking={b} onView={() => setViewing(b)} onCancel={() => setCancelling(b)} />)
        )}
      </div>

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        size="lg"
        tone={viewing?.service}
        title={viewing ? `${SERVICES[viewing.service].label} · ${viewing.reference.value}` : ''}
        description={viewing ? `Booked ${formatDate(viewing.createdAt.slice(0, 10), 'long')} · Paid ${formatMoney(viewing.pricing.total)} via ${viewing.payment.label}` : undefined}
        footer={
          viewing && (
            <>
              <Button variant="ghost" iconLeft={<Printer />} onClick={() => window.print()}>
                Print
              </Button>
              <Button variant="secondary" iconLeft={<CalendarPlus />} onClick={() => downloadCalendar(viewing)}>
                Add to calendar
              </Button>
            </>
          )
        }
      >
        {viewing && <BookingTicket booking={viewing} />}
      </Modal>
      <CancelDialog booking={cancelling} onClose={() => setCancelling(null)} />
    </div>
  )
}

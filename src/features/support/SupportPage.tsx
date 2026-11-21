import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, CalendarClock, CreditCard, Mail, MessageCircle, PackageSearch, Phone, Search, Ticket, Undo2 } from 'lucide-react'
import { SectionHead } from '@/components/layout/Section'
import { Accordion, Tabs } from '@/components/ui/Display'
import { EmptyState } from '@/components/ui/Feedback'
import { Input } from '@/components/ui/Field'
import { appConfig } from '@/config/app.config'
import { ROUTES } from '@/config/routes'
import { SERVICE_ORDER, SERVICES, type ServiceId } from '@/config/services'
import { FAQS } from '@/content/faqs'
import { useDocumentTitle } from '@/hooks'
import { SupportForm } from './SupportForm'
import s from '../info/Info.module.css'

const QUICK = [
  { icon: Ticket, title: 'Manage a booking', body: 'View tickets, add to calendar, print', to: ROUTES.bookings },
  { icon: Undo2, title: 'Cancel & refund', body: 'See your exact refund before you confirm', to: ROUTES.bookings },
  { icon: CalendarClock, title: 'Check PNR status', body: 'Waitlist and chart updates', to: `${ROUTES.trains}#pnr` },
  { icon: PackageSearch, title: 'Track a shipment', body: 'Every scan, live ETA', to: ROUTES.cargoTrack },
  { icon: CreditCard, title: 'Payment deducted?', body: 'Most auto-reverse within 30 minutes', to: '#request' },
]

type Topic = ServiceId | 'general'

export default function SupportPage() {
  useDocumentTitle('Help & support')
  const [q, setQ] = useState('')
  const [topic, setTopic] = useState<Topic>('general')

  const matches = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return null
    return (Object.entries(FAQS) as Array<[Topic, (typeof FAQS)['general']]>).flatMap(([t, list]) =>
      list.filter((f) => f.q.toLowerCase().includes(query) || f.a.toLowerCase().includes(query)).map((f) => ({ ...f, topic: t })),
    )
  }, [q])

  const items = (matches ?? FAQS[topic]).map((f) => ({ id: f.id, title: f.q, content: f.a }))

  return (
    <div>
      <section className={s.supportHero}>
        <div className="container">
          <p className="eyebrow">Help centre · {appConfig.brand.support.hours}</p>
          <h1 className={s.supportTitle}>
            How can we <span className="serif-i">help</span>?
          </h1>
          <div className={s.searchBox}>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: refund, baggage, Tatkal, waiting charges…" icon={<Search />} aria-label="Search help articles" />
          </div>
          <div className={s.quick}>
            {QUICK.map((x) => (
              <Link key={x.title} to={x.to} className={s.quickCard}>
                <x.icon />
                <strong>{x.title}</strong>
                <span>{x.body}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingTop: 72 }}>
        <div className={s.supportGrid}>
          <div>
            <SectionHead eyebrow="Answers" title={matches ? `${matches.length} result${matches.length === 1 ? '' : 's'} for “${q}”` : 'Frequently asked'} className={s.tightHead} />
            {!matches && (
              <Tabs<Topic>
                label="Help topics"
                value={topic}
                onChange={setTopic}
                items={[{ id: 'general', label: 'General' }, ...SERVICE_ORDER.map((id) => ({ id: id as Topic, label: SERVICES[id].label }))]}
              />
            )}
            <div style={{ marginTop: 8 }}>{items.length ? <Accordion key={`${topic}-${q}`} items={items} defaultOpen={items[0]?.id} /> : <EmptyState compact title="No articles match that" body="Try different words — or ask us directly below." />}</div>
          </div>
          <aside className={s.channels}>
            <h2>Talk to a person</h2>
            <a href={appConfig.brand.support.phoneHref} className={s.channel}>
              <Phone />
              <span>
                <strong>{appConfig.brand.support.phone}</strong>
                <em>Toll-free · median wait 87 s</em>
              </span>
              <ArrowUpRight />
            </a>
            <a href={`https://wa.me/${appConfig.brand.support.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className={s.channel}>
              <MessageCircle />
              <span>
                <strong>WhatsApp</strong>
                <em>{appConfig.brand.support.whatsapp}</em>
              </span>
              <ArrowUpRight />
            </a>
            <a href={`mailto:${appConfig.brand.support.email}`} className={s.channel}>
              <Mail />
              <span>
                <strong>{appConfig.brand.support.email}</strong>
                <em>Replies within 2 hours</em>
              </span>
              <ArrowUpRight />
            </a>
          </aside>
        </div>
      </section>

      <section className="container" id="request" style={{ paddingTop: 88 }}>
        <SectionHead eyebrow="Raise a request" title="Tell us what happened." lede="Include your booking ID and we’ll usually resolve it in one reply." />
        <div className={s.formCard}>
          <SupportForm />
        </div>
      </section>
    </div>
  )
}

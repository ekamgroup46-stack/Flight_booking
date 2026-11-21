import { Link } from 'react-router'
import { BadgeCheck, CalendarClock, Luggage, ShieldCheck } from 'lucide-react'
import { RouteBoard } from '@/components/journeys/RouteBoard'
import { FaqSection } from '@/components/layout/FaqSection'
import { SectionHead } from '@/components/layout/Section'
import { GlassSheet } from '@/components/layout/Backdrop'
import { ServiceHero, ServicePage } from '@/components/layout/ServiceHero'
import { DESTINATIONS, destinationLink } from '@/content/destinations'
import { useDocumentTitle } from '@/hooks'
import { formatMoney } from '@/lib/format'
import l from '../shared/landing.module.css'
import { FareTrend } from './FareTrend'
import { FlightSearchForm } from './FlightSearchForm'

const SPECS = [
  { title: 'Fare lock, ₹299', body: 'Hold today’s fare for 24 hours while you confirm plans. If you book, the ₹299 comes off the price.', tag: 'Held for 24h' },
  { title: 'Free date change on Flexi', body: 'Plans move. Flexi and Super Flexi fares change dates without a change fee — pay only the fare difference.', tag: '0 change fee' },
  { title: 'Check-in reminders that work', body: 'We nudge you when web check-in opens, with a one-tap link and seat-map preview. No hunting through emails.', tag: 'Opens 48h before' },
]

export default function FlightsPage() {
  useDocumentTitle('Flights')
  const intl = DESTINATIONS.filter((d) => d.category === 'international' || d.id === 'maldives')

  return (
    <ServicePage service="flights">
      <ServiceHero
        service="flights"
        aside={
          <div className={l.chips}>
            <span>
              <ShieldCheck /> No convenience fee
            </span>
            <span>
              <Luggage /> Baggage shown upfront
            </span>
            <span>
              <CalendarClock /> Free date change on Flexi
            </span>
          </div>
        }
      >
        <FlightSearchForm />
      </ServiceHero>
      <GlassSheet>

      <section className={`${l.section} ${l.first}`}>
        <div className="container">
          <SectionHead
            index="01"
            eyebrow="When to fly"
            title={
              <>
                Fly on the <span className="serif-i">cheap</span> days, not just the convenient ones.
              </>
            }
            lede="Shifting a trip by a day or two can save more than any coupon. Pick a route to see the lowest fare for each of the next 30 days."
          />
          <FareTrend />
        </div>
      </section>

      <section className={l.section}>
        <div className="container">
          <SectionHead index="02" eyebrow="Busiest skies" title="Popular flight routes" lede="The routes India flies most, with today’s lowest fares. Tap a row to search it." />
          <RouteBoard service="flights" title="Popular flights" />
        </div>
      </section>

      <section className={l.section}>
        <div className="container">
          <SectionHead
            index="03"
            eyebrow="Passport-ready"
            title={
              <>
                Short hops, <span className="serif-i">far</span> horizons.
              </>
            }
            lede="International getaways under six hours from major Indian cities. Visa-on-arrival or e-visa for most Indian passport holders."
          />
          <div className={l.rail}>
            {intl.map((d) => (
              <Link key={d.id} to={destinationLink(d)} className={l.railCard} data-reveal data-reveal-media>
                <img src={d.image} alt="" loading="lazy" />
                <span className={l.railText}>
                  <em>{d.region}</em>
                  <strong>{d.name}</strong>
                  <span className={l.railFoot}>
                    <span>{d.tagline}</span>
                  </span>
                  <span className={l.railFoot}>
                    <span>Return from</span>
                    <b>{formatMoney(d.fromPrice * 2)}</b>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={l.section}>
        <div className="container">
          <SectionHead index="04" eyebrow="Fly smarter" title="Small features, big relief." />
          <div className={l.spec}>
            {SPECS.map((sp, i) => (
              <div key={sp.title} className={l.specItem} data-reveal>
                <span className={l.specNum}>{String(i + 1).padStart(2, '0')}</span>
                <h3>{sp.title}</h3>
                <p>{sp.body}</p>
                <strong>
                  <BadgeCheck size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
                  {sp.tag}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FaqSection topic="flights" index="05" />
      </GlassSheet>
    </ServicePage>
  )
}

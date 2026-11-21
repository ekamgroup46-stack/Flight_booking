import { BadgeCheck, Leaf, PhoneOff, PlaneLanding, Share2, Siren, Timer, UserCheck } from 'lucide-react'
import { Link } from 'react-router'
import { RouteBoard } from '@/components/journeys/RouteBoard'
import { FaqSection } from '@/components/layout/FaqSection'
import { SectionHead } from '@/components/layout/Section'
import { GlassSheet } from '@/components/layout/Backdrop'
import { ServiceHero, ServicePage } from '@/components/layout/ServiceHero'
import { withQuery } from '@/config/routes'
import { SERVICES } from '@/config/services'
import { useDocumentTitle } from '@/hooks'
import { addDays, todayISO } from '@/lib/dates'
import { CAB_PLACES } from '@/services/locations/data'
import l from '../shared/landing.module.css'
import { CabSearchForm } from './CabSearchForm'
import c from './Cabs.module.css'

const FLEET = [
  { name: 'Mini', image: '/images/cabs/mini.webp', model: 'WagonR, Celerio or similar', seats: 4, bags: 1, rate: 11.5, note: 'Quick city hops' },
  { name: 'Sedan', image: '/images/cabs/sedan.webp', model: 'Dzire, Aura or similar', seats: 4, bags: 2, rate: 13.5, note: 'Airport runs, two suitcases' },
  { name: 'Electric', image: '/images/cabs/ev.webp', model: 'Tigor EV or similar', seats: 4, bags: 2, rate: 14, note: 'Quiet, zero tailpipe', eco: true },
  { name: 'SUV', image: '/images/cabs/suv.webp', model: 'Ertiga, Carens or similar', seats: 6, bags: 3, rate: 16.5, note: 'Families & weekend trips' },
  { name: 'SUV+', image: '/images/cabs/suvplus.webp', model: 'Innova Crysta or similar', seats: 6, bags: 4, rate: 20.5, note: 'Long highways in comfort' },
  { name: 'Luxury', image: '/images/cabs/premium.webp', model: 'Camry, E-Class or similar', seats: 4, bags: 3, rate: 34, note: 'Chauffeur-driven occasions' },
]

const SAFETY = [
  { icon: UserCheck, title: 'Verified, trained drivers', body: 'Police verification, driving history checks and a hospitality course before the first ride.' },
  { icon: Share2, title: 'Live trip sharing', body: 'Share your live location and ETA with family in a tap — no app needed on their side.' },
  { icon: Siren, title: 'In-ride SOS', body: 'One press alerts our 24×7 safety desk and your emergency contacts with your exact location.' },
  { icon: PhoneOff, title: 'Masked phone numbers', body: 'Drivers never see your real number, and you never see theirs.' },
]

export default function CabsPage() {
  useDocumentTitle('Cabs')
  const airports = CAB_PLACES.filter((p) => p.kind === 'airport')
  return (
    <ServicePage service="cabs">
      <ServiceHero
        service="cabs"
        aside={
          <div className={l.chips}>
            <span>
              <PlaneLanding /> Flight tracking on airport pickups
            </span>
            <span>
              <Timer /> 45 min free waiting at arrivals
            </span>
            <span>
              <BadgeCheck /> Tolls & taxes included outstation
            </span>
          </div>
        }
      >
        <CabSearchForm />
      </ServiceHero>
      <GlassSheet>

      <section className={`${l.section} ${l.first}`}>
        <div className="container">
          <SectionHead
            index="01"
            eyebrow="The fleet"
            title={
              <>
                Pick the car, <span className="serif-i">not</span> the gamble.
              </>
            }
            lede="Every category shows seats, luggage and the per-km rate before you book. Model shown is indicative — you get it or similar."
          />
          <div className={c.fleet}>
            {FLEET.map((f, i) => (
              <div key={f.name} className={c.car} data-reveal style={{ ['--reveal-delay' as string]: `${i * 50}ms` }}>
                <div className={c.carPhoto}>
                  <img src={f.image} alt={`${f.name} — ${f.model}`} loading="lazy" />
                </div>
                <div className={c.carTop}>
                  <span className={c.carName}>{f.name}</span>
                  {f.eco && (
                    <span className={c.eco}>
                      <Leaf /> EV
                    </span>
                  )}
                </div>
                <span className={c.model}>{f.model}</span>
                <dl className={c.specs}>
                  <div>
                    <dt>Seats</dt>
                    <dd>{f.seats}</dd>
                  </div>
                  <div>
                    <dt>Bags</dt>
                    <dd>{f.bags}</dd>
                  </div>
                  <div>
                    <dt>Per km</dt>
                    <dd>₹{f.rate}</dd>
                  </div>
                </dl>
                <span className={c.note}>{f.note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={l.section}>
        <div className="container">
          <div className={l.band} data-reveal>
            <div>
              <span className="eyebrow" style={{ color: 'rgba(255,255,255,.55)' }}>
                Ride safety
              </span>
              <h2 style={{ marginTop: 14 }}>
                Safe is the <span className="serif-i">default</span>, not an add-on.
              </h2>
              <p>Every Ekam ride carries the same protections — whether it’s a 4 km airport drop or a 400 km road trip.</p>
            </div>
            <ul className={l.bandList}>
              {SAFETY.map((x) => (
                <li key={x.title}>
                  <x.icon />
                  <span>
                    <strong style={{ display: 'block', color: '#fff' }}>{x.title}</strong>
                    {x.body}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={l.section}>
        <div className="container">
          <SectionHead index="02" eyebrow="Airport transfers" title={`Pickups at ${airports.length} airports`} lede="Pick an airport to see fares into town for tomorrow morning." />
          <div className={c.airports} data-reveal>
            {airports.map((a) => (
              <Link
                key={a.id}
                to={withQuery(SERVICES.cabs.resultsPath, { trip: 'airport', from: a.id, to: `city-${a.city === 'New Delhi' ? 'new-delhi' : a.city.toLowerCase().replace(/\s+/g, '-')}`, date: addDays(todayISO(), 1), time: '09:00' })}
                className={c.airport}
              >
                <b className="mono">{a.code}</b>
                <span>{a.city}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={l.section}>
        <div className="container">
          <SectionHead index="03" eyebrow="Road trips" title="Popular cab routes" />
          <RouteBoard service="cabs" title="Popular cab routes" />
        </div>
      </section>

      <FaqSection topic="cabs" index="04" />
      </GlassSheet>
    </ServicePage>
  )
}

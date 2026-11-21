import { Armchair, BedDouble, MapPinned, ShieldCheck, Star, Undo2, Venus } from 'lucide-react'
import { RouteBoard } from '@/components/journeys/RouteBoard'
import { FaqSection } from '@/components/layout/FaqSection'
import { SectionHead } from '@/components/layout/Section'
import { GlassSheet } from '@/components/layout/Backdrop'
import { ServiceHero, ServicePage } from '@/components/layout/ServiceHero'
import { ButtonLink } from '@/components/ui/Button'
import { Rating } from '@/components/ui/Display'
import { routeLink } from '@/content/journeys'
import { useDocumentTitle } from '@/hooks'
import { addDays, todayISO } from '@/lib/dates'
import l from '../shared/landing.module.css'
import { BusSearchForm } from './BusSearchForm'
import { SeatLegend } from './SeatMap'

const OPERATORS = [
  { name: 'NightOwl Sleepers', rating: 4.6, reviews: 18420, note: 'Volvo multi-axle sleepers · Bengaluru, Goa, Hyderabad' },
  { name: 'Greenline Electric', rating: 4.7, reviews: 9310, note: 'All-electric AC seaters · Pune, Mumbai, Nashik' },
  { name: 'Konkan Coastliner', rating: 4.4, reviews: 12780, note: 'Coastal routes · Mangaluru, Goa, Kochi' },
  { name: 'Kaveri Cruisers', rating: 4.5, reviews: 22010, note: 'Southern night services · Chennai, Madurai, Coimbatore' },
  { name: 'Himalayan Roadways', rating: 4.2, reviews: 6890, note: 'Hill routes · Manali, Shimla, Dharamshala' },
]

export default function BusesPage() {
  useDocumentTitle('Buses')
  return (
    <ServicePage service="buses">
      <ServiceHero
        service="buses"
        aside={
          <div className={l.chips}>
            <span>
              <BedDouble /> Sleeper & seater seat maps
            </span>
            <span>
              <MapPinned /> Live bus tracking
            </span>
            <span>
              <Undo2 /> Free cancellation on most buses
            </span>
          </div>
        }
      >
        <BusSearchForm />
      </ServiceHero>
      <GlassSheet>

      <section className={`${l.section} ${l.first}`}>
        <div className="container">
          <div className={l.band} data-reveal>
            <div>
              <span className="eyebrow" style={{ color: 'rgba(255,255,255,.55)' }}>
                Seat selection
              </span>
              <h2 style={{ marginTop: 14 }}>
                Window, aisle or lower berth — <span className="serif-i">your</span> call.
              </h2>
              <p>Every bus on Ekam shows a live seat map with both decks. Prices are per seat, so the lower berth you love is never a surprise at checkout.</p>
              <ul className={l.bandList} style={{ marginTop: 20 }}>
                <li>
                  <Venus /> Seats reserved for women are marked — and can only be booked by women travellers.
                </li>
                <li>
                  <ShieldCheck /> Every operator is verified, with ratings from real Ekam trips only.
                </li>
                <li>
                  <Armchair /> Up to six seats per booking, with a boarding point you choose.
                </li>
              </ul>
              <div className={l.bandActions}>
                <ButtonLink to={routeLink({ service: 'buses', query: { from: 'bengaluru', to: 'goa', date: addDays(todayISO(), 2) } })} variant="accent">
                  Try it: Bengaluru → Goa
                </ButtonLink>
              </div>
            </div>
            <SeatLegend />
          </div>
        </div>
      </section>

      <section className={l.section}>
        <div className="container">
          <SectionHead index="01" eyebrow="Overnight favourites" title="Popular bus routes" />
          <RouteBoard service="buses" title="Popular buses" />
        </div>
      </section>

      <section className={l.section}>
        <div className="container">
          <SectionHead
            index="02"
            eyebrow="Top-rated operators"
            title={
              <>
                Rated by people who <span className="serif-i">actually</span> rode.
              </>
            }
            lede="Ratings come only from completed Ekam trips — punctuality, cleanliness, staff and comfort."
          />
          <table className={l.table} data-reveal>
            <thead>
              <tr>
                <th>Operator</th>
                <th>Known for</th>
                <th style={{ textAlign: 'right' }}>Rating</th>
              </tr>
            </thead>
            <tbody>
              {OPERATORS.map((o) => (
                <tr key={o.name}>
                  <td style={{ fontWeight: 600 }}>
                    <Star size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 8, color: 'var(--accent)' }} />
                    {o.name}
                  </td>
                  <td className={l.muted}>{o.note}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Rating value={o.rating} count={o.reviews} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <FaqSection topic="buses" index="03" />
      </GlassSheet>
    </ServicePage>
  )
}

import { useNavigate } from 'react-router'
import { Building2, Code2, FileSpreadsheet, Leaf, Plane, ReceiptText, ShieldCheck, TrainFront, Truck, Warehouse } from 'lucide-react'
import { FaqSection } from '@/components/layout/FaqSection'
import { SectionHead } from '@/components/layout/Section'
import { GlassSheet } from '@/components/layout/Backdrop'
import { ServiceHero, ServicePage } from '@/components/layout/ServiceHero'
import { ButtonLink } from '@/components/ui/Button'
import { ROUTES, withQuery } from '@/config/routes'
import { useDocumentTitle } from '@/hooks'
import l from '../shared/landing.module.css'
import { CargoSearchForm } from './CargoSearchForm'
import { TrackForm } from './Tracking'
import c from './Cargo.module.css'

const MODES = [
  { icon: Plane, title: 'Express Air', meta: '1–2 days', body: 'Next-flight-out for documents, samples and anything urgent up to 500 kg.', image: '/images/misc/cargo-air.webp' },
  { icon: Truck, title: 'Surface & PTL', meta: '2–6 days', body: 'Line-haul trucking between 19,000 pin codes. Share a truck or book by the pallet.', image: '/images/misc/cargo-truck.webp' },
  { icon: TrainFront, title: 'Rail freight', meta: '3–7 days', body: 'Containerised rail between major hubs — the lowest cost and lowest emissions per tonne.', image: '/images/misc/cargo-rail.webp' },
  { icon: Warehouse, title: 'Warehousing', meta: 'On demand', body: 'Pick, pack and store in 14 city fulfilment centres, billed by the pallet-day.', image: '/images/misc/cargo-warehouse.webp' },
]

export default function CargoPage() {
  useDocumentTitle('Cargo & logistics')
  const navigate = useNavigate()
  return (
    <ServicePage service="cargo">
      <ServiceHero
        service="cargo"
        aside={
          <div className={l.chips}>
            <span>
              <ShieldCheck /> Insured up to ₹50,000
            </span>
            <span>
              <Leaf /> CO₂ shown on every quote
            </span>
            <span>
              <ReceiptText /> GST invoices, e-way bills handled
            </span>
          </div>
        }
      >
        <CargoSearchForm />
      </ServiceHero>
      <GlassSheet>

      <section className={`${l.section} ${l.first}`}>
        <div className="container">
          <div className={c.trackBand} data-reveal>
            <div>
              <span className="eyebrow">Track a shipment</span>
              <h2 className={c.trackTitle}>Where’s my parcel?</h2>
              <p className={l.muted}>Every scan from pickup to doorstep, with a live ETA.</p>
            </div>
            <TrackForm onTrack={(id) => navigate(withQuery(ROUTES.cargoTrack, { id }))} />
          </div>
        </div>
      </section>

      <section className={l.section}>
        <div className="container">
          <SectionHead
            index="01"
            eyebrow="Every way to move goods"
            title={
              <>
                One box or <span className="serif-i">one</span> full truck.
              </>
            }
            lede="Compare air, road and rail on price, speed and carbon in a single quote — then book pickup in under a minute."
          />
          <div className={c.modes}>
            {MODES.map((m, i) => (
              <article key={m.title} className={c.mode} data-reveal style={{ ['--reveal-delay' as string]: `${i * 60}ms` }}>
                <div className={c.modeImg}>
                  <img src={m.image} alt="" loading="lazy" />
                  <span className={c.modeIcon}>
                    <m.icon />
                  </span>
                </div>
                <div className={c.modeBody}>
                  <div className={c.modeHead}>
                    <h3>{m.title}</h3>
                    <span className="mono">{m.meta}</span>
                  </div>
                  <p>{m.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={l.section}>
        <div className="container">
          <div className={l.band} data-reveal>
            <div>
              <span className="eyebrow" style={{ color: 'rgba(255,255,255,.55)' }}>
                Ekam for business
              </span>
              <h2 style={{ marginTop: 14 }}>
                Logistics that plugs into <span className="serif-i">your</span> stack.
              </h2>
              <p>From D2C brands shipping 50 parcels a day to manufacturers moving full truckloads, one account covers every mode.</p>
              <div className={l.bandActions}>
                <ButtonLink to={ROUTES.contact} variant="accent">
                  Talk to logistics sales
                </ButtonLink>
                <ButtonLink to={ROUTES.support} variant="glass">
                  Read the API docs
                </ButtonLink>
              </div>
            </div>
            <ul className={l.bandList}>
              <li>
                <Code2 /> REST API & webhooks for quotes, bookings and tracking events
              </li>
              <li>
                <FileSpreadsheet /> Bulk upload by CSV, consolidated monthly GST invoicing
              </li>
              <li>
                <Building2 /> Scheduled daily pickups and a dedicated account manager
              </li>
              <li>
                <Leaf /> Quarterly carbon reports by lane and mode
              </li>
            </ul>
          </div>
        </div>
      </section>

      <FaqSection topic="cargo" index="02" />
      </GlassSheet>
    </ServicePage>
  )
}

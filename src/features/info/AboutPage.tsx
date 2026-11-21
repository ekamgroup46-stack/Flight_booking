import { ArrowRight } from 'lucide-react'
import { LineBundle } from '@/components/brand/Brand'
import { GlassSheet } from '@/components/layout/Backdrop'
import { SectionHead } from '@/components/layout/Section'
import { ButtonLink } from '@/components/ui/Button'
import { appConfig } from '@/config/app.config'
import { ROUTES } from '@/config/routes'
import { SERVICE_ORDER, SERVICES } from '@/config/services'
import { useDocumentTitle } from '@/hooks'
import s from './Info.module.css'

const NUMBERS = [
  { value: '5', label: 'ways to travel and ship, one account' },
  { value: '640', label: 'cities connected by at least two modes' },
  { value: '₹0', label: 'convenience fee — since day one' },
  { value: '24×7', label: 'human support, every day of the year' },
]

const VALUES = [
  { title: 'One honest price', body: 'The fare on the results page is the fare on your card statement. Nothing pre-ticked, nothing added at the last step.' },
  { title: 'Every mode, judged equally', body: 'Sometimes the overnight sleeper beats the flight. We show both side by side and let you decide — not the commission.' },
  { title: 'Humans for the hard parts', body: 'Software handles the booking. People handle the missed connections, the medical emergencies and the 2 AM reroutes.' },
]

export default function AboutPage() {
  useDocumentTitle('About us')
  return (
    <div>
      <section className={s.aboutHero}>
        <div className={s.aboutShade} />
        <div className="container">
          <p className={s.aboutKicker}>
            {appConfig.brand.devanagari} · <em>ekam</em>, Sanskrit for “{appConfig.brand.meaning}”
          </p>
          <h1 className={s.aboutTitle}>
            India moves in many ways.
            <br />
            <span className="serif-i">One</span> place should book them all.
          </h1>
        </div>
      </section>

      <GlassSheet>
      <section className="container" style={{ paddingTop: 96 }}>
        <div className={s.story}>
          <div>
            <p className="eyebrow">Our story</p>
            <LineBundle thickness={3} gap={3} className={s.storyBundle} />
          </div>
          <div className={s.storyText}>
            <p>A typical Indian journey isn’t one ticket. It’s a cab to the station, a train to the city, a flight onward and a parcel sent home after. Each step lived in a different app, with a different login, a different refund policy and a different hidden fee.</p>
            <p>Ekam started with a simple idea borrowed from transit maps: draw every line on the same page. Flights, trains, buses, cabs and cargo now share one search, one checkout and one support team that can rebook you across all of them.</p>
            <p>We’re a team of travel-obsessed engineers, designers and operators in Bengaluru, building the booking experience we always wanted for our own families.</p>
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingTop: 96 }}>
        <div className={s.numbers}>
          {NUMBERS.map((n) => (
            <div key={n.label} data-reveal>
              <strong>{n.value}</strong>
              <span>{n.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="container" style={{ paddingTop: 96 }}>
        <SectionHead eyebrow="What we believe" title="Three rules we don’t bend." />
        <div className={s.values}>
          {VALUES.map((v, i) => (
            <div key={v.title} className={s.value} data-reveal>
              <span className="mono">{String(i + 1).padStart(2, '0')}</span>
              <h3>{v.title}</h3>
              <p>{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container" style={{ paddingTop: 96 }}>
        <div className={s.linesCard}>
          <div>
            <h2>Five lines. One network.</h2>
            <p>Every service on Ekam is a line on the map — with its own colour, so you always know where you are.</p>
            <ButtonLink to={ROUTES.home} variant="glass" iconRight={<ArrowRight />}>
              Start a journey
            </ButtonLink>
          </div>
          <ul>
            {SERVICE_ORDER.map((id) => (
              <li key={id} style={{ ['--line' as string]: SERVICES[id].color }}>
                <i />
                <strong>{SERVICES[id].label}</strong>
                <span>{SERVICES[id].blurb}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      </GlassSheet>
    </div>
  )
}

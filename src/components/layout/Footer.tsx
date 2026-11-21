import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ArrowUpRight, Mail, Phone } from 'lucide-react'
import { appConfig } from '@/config/app.config'
import { ROUTES } from '@/config/routes'
import { SERVICE_ORDER, SERVICES } from '@/config/services'
import { isEmail } from '@/lib/validation'
import { toast } from '@/store/toast.store'
import { LineBundle, Logo } from '../brand/Brand'
import s from './Footer.module.css'

const COLUMNS: Array<{ title: string; links: Array<{ label: string; to: string }> }> = [
  {
    title: 'Company',
    links: [
      { label: 'About us', to: ROUTES.about },
      { label: 'Contact us', to: ROUTES.contact },
      { label: 'Offers & deals', to: ROUTES.offers },
      { label: 'Ekam for business', to: ROUTES.cargo },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Customer support', to: ROUTES.support },
      { label: 'My bookings', to: ROUTES.bookings },
      { label: 'Track a shipment', to: ROUTES.cargoTrack },
      { label: 'Check PNR status', to: `${ROUTES.trains}#pnr` },
    ],
  },
  {
    title: 'Policies',
    links: [
      { label: 'Booking policies', to: ROUTES.bookingPolicy },
      { label: 'Terms & conditions', to: ROUTES.terms },
      { label: 'Privacy policy', to: ROUTES.privacy },
    ],
  },
]

const YEAR = new Date().getFullYear()

export function Footer() {
  const [email, setEmail] = useState('')
  const onSubscribe = (e: FormEvent) => {
    e.preventDefault()
    if (!isEmail(email)) return toast.error('That email doesn’t look right', 'Check for typos and try again.')
    toast.success('Fare alerts on', `We’ll write to ${email} when prices drop.`)
    setEmail('')
  }

  return (
    <footer className={s.footer} data-print="hide">
      <LineBundle thickness={3} gap={0} className={s.bundle} />
      <div className="container">
        <div className={s.top}>
          <div className={s.statement}>
            <p className={s.devanagari}>{appConfig.brand.devanagari}</p>
            <h2>
              Every way to go,
              <br />
              <span className="serif-i">one</span> place to book it.
            </h2>
          </div>
          <form className={s.alerts} onSubmit={onSubscribe}>
            <label htmlFor="fare-alerts">Fare alerts, once a week. Never spam.</label>
            <div className={s.alertRow}>
              <input id="fare-alerts" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              <button type="submit" aria-label="Subscribe to fare alerts">
                <ArrowRight />
              </button>
            </div>
          </form>
        </div>

        <div className={s.grid}>
          <div className={s.col}>
            <h3>Book</h3>
            <ul>
              {SERVICE_ORDER.map((id) => (
                <li key={id}>
                  <Link to={SERVICES[id].path} className={s.serviceLink}>
                    <i style={{ background: SERVICES[id].color }} />
                    {SERVICES[id].label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title} className={s.col}>
              <h3>{col.title}</h3>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className={s.col}>
            <h3>Talk to a human</h3>
            <ul className={s.contact}>
              <li>
                <a href={appConfig.brand.support.phoneHref}>
                  <Phone /> {appConfig.brand.support.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${appConfig.brand.support.email}`}>
                  <Mail /> {appConfig.brand.support.email}
                </a>
              </li>
              <li className={s.hours}>{appConfig.brand.support.hours}</li>
            </ul>
            <div className={s.socials}>
              {appConfig.brand.socials.map((soc) => (
                <a key={soc.label} href={soc.href} target="_blank" rel="noreferrer">
                  {soc.label}
                  <ArrowUpRight />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className={s.wordmark} aria-hidden>
          ekam
        </div>

        <div className={s.bottom}>
          <Logo tone="paper" size={22} />
          <span>
            © {YEAR} {appConfig.brand.legalName}
          </span>
          <span className={s.proto}>Prototype build — all fares, schedules and availability shown are illustrative.</span>
        </div>
      </div>
    </footer>
  )
}

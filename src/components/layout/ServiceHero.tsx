import type { ReactNode } from 'react'
import { SERVICES, type ServiceId } from '@/config/services'
import { Roundel } from '../brand/Brand'
import s from './ServiceHero.module.css'

/** Full-bleed hero for a service landing page with a glass search panel. */
export function ServiceHero({ service, children, aside }: { service: ServiceId; children: ReactNode; aside?: ReactNode }) {
  const meta = SERVICES[service]
  return (
    <section className={s.hero} data-service={service}>
      <div className={s.media} aria-hidden>
        <span className={s.scrim} />
      </div>
      <div className={`container ${s.inner}`}>
        <div className={s.copy}>
          <p className={s.crumb}>
            <Roundel service={service} size={26} />
            <span>{meta.label}</span>
            <span className={s.rule} />
            <span className={s.blurb}>{meta.blurb}</span>
          </p>
          <h1 className={s.title}>
            {meta.heroTitle[0]}
            <br />
            <span className="serif-i">{meta.heroTitle[1]}</span>
          </h1>
          {aside && <div className={s.aside}>{aside}</div>}
        </div>
        <div className={s.panel}>{children}</div>
      </div>
    </section>
  )
}

export function ServicePage({ service, children }: { service: ServiceId; children: ReactNode }) {
  return (
    <div data-service={service} className={s.page}>
      {children}
    </div>
  )
}

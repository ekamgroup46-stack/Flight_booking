import { Briefcase, Building2, Mail, MessageCircle, Newspaper, Phone } from 'lucide-react'
import { SectionHead } from '@/components/layout/Section'
import { appConfig } from '@/config/app.config'
import { useDocumentTitle } from '@/hooks'
import { SupportForm } from '../support/SupportForm'
import s from './Info.module.css'

export default function ContactPage() {
  useDocumentTitle('Contact us')
  const sup = appConfig.brand.support
  const cards = [
    { icon: Phone, title: 'Call us', value: sup.phone, href: sup.phoneHref, note: 'Toll-free · 24×7' },
    { icon: MessageCircle, title: 'WhatsApp', value: sup.whatsapp, href: `https://wa.me/${sup.whatsapp.replace(/\D/g, '')}`, note: 'Chat with a person' },
    { icon: Mail, title: 'Email', value: sup.email, href: `mailto:${sup.email}`, note: 'Replies within 2 hours' },
    { icon: Briefcase, title: 'Business & logistics', value: appConfig.brand.businessEmail, href: `mailto:${appConfig.brand.businessEmail}`, note: 'Bulk shipping, corporate travel, API' },
    { icon: Newspaper, title: 'Press', value: appConfig.brand.pressEmail, href: `mailto:${appConfig.brand.pressEmail}`, note: 'Media kit on request' },
    { icon: Building2, title: 'Head office', value: appConfig.brand.address, note: 'Visits by appointment' },
  ]
  return (
    <div className="container" style={{ paddingTop: 56 }}>
      <SectionHead
        eyebrow="Contact"
        title={
          <>
            Real people, <span className="serif-i">every</span> hour.
          </>
        }
        lede="Whatever you need — a missed train, a big shipment, a partnership — there’s a direct line for it."
      />
      <div className={s.contactGrid}>
        {cards.map((c) => {
          const body = (
            <>
              <c.icon />
              <span className={s.contactTitle}>{c.title}</span>
              <strong>{c.value}</strong>
              <em>{c.note}</em>
            </>
          )
          return c.href ? (
            <a key={c.title} href={c.href} className={s.contactCard} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
              {body}
            </a>
          ) : (
            <div key={c.title} className={s.contactCard}>
              {body}
            </div>
          )
        })}
      </div>
      <div style={{ paddingTop: 80 }}>
        <SectionHead eyebrow="Write to us" title="Send a message" />
        <div className={s.formCard}>
          <SupportForm defaultTopic="Something else" />
        </div>
      </div>
    </div>
  )
}

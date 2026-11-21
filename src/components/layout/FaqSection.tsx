import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { appConfig } from '@/config/app.config'
import { ROUTES } from '@/config/routes'
import { FAQS } from '@/content/faqs'
import type { ServiceId } from '@/config/services'
import { Accordion } from '../ui/Display'
import { SectionHead } from './Section'
import s from './FaqSection.module.css'

export function FaqSection({ topic, index }: { topic: ServiceId | 'general'; index?: string }) {
  const items = FAQS[topic].map((f) => ({ id: f.id, title: f.q, content: f.a }))
  return (
    <section className={s.section}>
      <div className={`container ${s.grid}`}>
        <div>
          <SectionHead index={index} eyebrow="Good to know" title="Questions, answered." className={s.head} />
          <div className={s.help} data-reveal>
            <p>Still stuck? Real people, any hour.</p>
            <a href={appConfig.brand.support.phoneHref}>{appConfig.brand.support.phone}</a>
            <Link to={ROUTES.support}>
              Visit the help centre <ArrowUpRight />
            </Link>
          </div>
        </div>
        <div data-reveal>
          <Accordion items={items} defaultOpen={items[0]?.id} />
        </div>
      </div>
    </section>
  )
}

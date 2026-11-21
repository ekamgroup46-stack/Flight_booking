import { ArrowLeft, Headset } from 'lucide-react'
import { SplitFlap } from '@/components/brand/Brand'
import { ButtonLink } from '@/components/ui/Button'
import { ROUTES } from '@/config/routes'
import { useDocumentTitle } from '@/hooks'
import s from './NotFound.module.css'

export default function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <section className={s.wrap}>
      <div className="container">
        <div className={s.board}>
          <div className={s.boardRow}>
            <span className={s.label}>Platform</span>
            <SplitFlap text="404" length={3} className={s.flapBig} />
          </div>
          <div className={s.boardRow}>
            <span className={s.label}>Status</span>
            <SplitFlap text="ROUTE NOT FOUND" length={15} className={s.flap} />
          </div>
        </div>
        <h1 className={s.title}>
          Wrong platform, <span className="serif-i">right</span> traveller.
        </h1>
        <p className={s.body}>The page you were looking for has departed, or never ran on this line. Let’s get you back on track.</p>
        <div className={s.actions}>
          <ButtonLink to={ROUTES.home} iconLeft={<ArrowLeft />}>
            Back to departures
          </ButtonLink>
          <ButtonLink to={ROUTES.support} variant="secondary" iconLeft={<Headset />}>
            Ask a human
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}

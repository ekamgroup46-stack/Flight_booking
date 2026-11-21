import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import s from './Section.module.css'

/** Editorial section header: numbered eyebrow + title on the left, lede on the right. */
export function SectionHead({
  index,
  eyebrow,
  title,
  lede,
  action,
  tone = 'light',
  className,
}: {
  index?: string
  eyebrow: string
  title: ReactNode
  lede?: ReactNode
  action?: ReactNode
  tone?: 'light' | 'dark'
  className?: string
}) {
  return (
    <div className={cn(s.head, tone === 'dark' && s.dark, className)} data-reveal>
      <div className={s.left}>
        <p className={s.eyebrow}>
          {index && <span className={s.index}>{index}</span>}
          <span className={s.rule} />
          {eyebrow}
        </p>
        <h2 className={s.title}>{title}</h2>
      </div>
      {(lede || action) && (
        <div className={s.right}>
          {lede && <p className={s.lede}>{lede}</p>}
          {action}
        </div>
      )}
    </div>
  )
}

export function Section({ children, className, id, tone }: { children: ReactNode; className?: string; id?: string; tone?: 'paper' | 'white' | 'ink' }) {
  return (
    <section id={id} className={cn(s.section, tone && s[tone], className)}>
      <div className="container">{children}</div>
    </section>
  )
}

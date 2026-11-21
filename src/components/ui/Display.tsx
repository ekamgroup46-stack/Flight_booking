import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Check, ChevronDown, Copy, Star, Timer } from 'lucide-react'
import { useNow } from '@/hooks'
import { cn } from '@/lib/cn'
import { copyToClipboard } from '@/lib/files'
import { toast } from '@/store/toast.store'
import s from './Display.module.css'

export type BadgeTone = 'neutral' | 'accent' | 'ok' | 'warn' | 'bad' | 'dark' | 'outline' | 'glass'

export function Badge({ tone = 'neutral', icon, children, className }: { tone?: BadgeTone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn(s.badge, s[tone], className)}>
      {icon}
      {children}
    </span>
  )
}

export function Rating({ value, count, className }: { value: number; count?: number; className?: string }) {
  const tone = value >= 4.4 ? s.rateHigh : value >= 4 ? s.rateMid : s.rateLow
  return (
    <span className={cn(s.rating, tone, className)} aria-label={`Rated ${value} out of 5${count ? ` from ${count} reviews` : ''}`}>
      <Star />
      {value.toFixed(1)}
      {count !== undefined && <em>{count.toLocaleString('en-IN')}</em>}
    </span>
  )
}

export interface TabItem<T extends string> {
  id: T
  label: ReactNode
  icon?: ReactNode
  meta?: ReactNode
}

/** Underline tabs whose indicator glides between items. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  className,
  tone = 'light',
}: {
  items: TabItem<T>[]
  value: T
  onChange: (id: T) => void
  label: string
  className?: string
  tone?: 'light' | 'dark'
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const [ind, setInd] = useState({ x: 0, w: 0 })

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const measure = () => {
      const el = list.querySelector<HTMLElement>('[aria-selected="true"]')
      if (el) setInd({ x: el.offsetLeft, w: el.offsetWidth })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    return () => ro.disconnect()
  }, [value, items.length])

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = items.findIndex((i) => i.id === value)
    let next = idx
    if (e.key === 'ArrowRight') next = (idx + 1) % items.length
    else if (e.key === 'ArrowLeft') next = (idx - 1 + items.length) % items.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    else return
    e.preventDefault()
    onChange(items[next].id)
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus())
  }

  return (
    <div ref={listRef} role="tablist" aria-label={label} className={cn(s.tabs, tone === 'dark' && s.tabsDark, className)} onKeyDown={onKey}>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          role="tab"
          aria-selected={it.id === value}
          tabIndex={it.id === value ? 0 : -1}
          className={s.tab}
          onClick={() => onChange(it.id)}
        >
          {it.icon}
          <span>{it.label}</span>
          {it.meta && <span className={s.tabMeta}>{it.meta}</span>}
        </button>
      ))}
      <span className={s.indicator} style={{ transform: `translateX(${ind.x}px)`, width: ind.w }} aria-hidden />
    </div>
  )
}

export function Accordion({ items, defaultOpen }: { items: { id: string; title: ReactNode; content: ReactNode }[]; defaultOpen?: string }) {
  const [open, setOpen] = useState<string | null>(defaultOpen ?? null)
  const base = useId()
  return (
    <div className={s.accordion}>
      {items.map((it) => {
        const isOpen = open === it.id
        return (
          <div key={it.id} className={cn(s.accItem, isOpen && s.accOpen)}>
            <h3>
              <button
                type="button"
                id={`${base}-${it.id}-h`}
                aria-expanded={isOpen}
                aria-controls={`${base}-${it.id}-p`}
                className={s.accTrigger}
                onClick={() => setOpen(isOpen ? null : it.id)}
              >
                <span>{it.title}</span>
                <ChevronDown />
              </button>
            </h3>
            <div id={`${base}-${it.id}-p`} role="region" aria-labelledby={`${base}-${it.id}-h`} className={s.accPanel}>
              <div>
                <div className={s.accContent}>{it.content}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Steps rendered as stations on a line. */
export function Stepper({ steps, current, onStepClick }: { steps: string[]; current: number; onStepClick?: (i: number) => void }) {
  return (
    <ol className={s.stepper} aria-label="Booking progress">
      {steps.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'next'
        const clickable = onStepClick && i < current
        return (
          <li key={label} className={cn(s.step, s[state])} aria-current={state === 'current' ? 'step' : undefined}>
            <button type="button" disabled={!clickable} onClick={() => clickable && onStepClick?.(i)} className={s.stepBtn}>
              <span className={s.stepDot}>{state === 'done' ? <Check strokeWidth={3} /> : i + 1}</span>
              <span className={s.stepLabel}>{label}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

export function CopyButton({ value, label = 'Copy', className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className={cn(s.copy, copied && s.copied, className)}
      onClick={async (e) => {
        e.stopPropagation()
        const ok = await copyToClipboard(value)
        if (ok) {
          setCopied(true)
          toast.success(`${value} copied`, 'Paste it at checkout to apply.')
          setTimeout(() => setCopied(false), 1800)
        }
      }}
      aria-label={`${label} ${value}`}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? 'Copied' : label}
    </button>
  )
}

export function HoldTimer({ until, onExpire }: { until: number; onExpire?: () => void }) {
  const now = useNow(1000)
  const left = Math.max(0, until - now)
  // Fire once per hold window; a refreshed hold (new `until`) can expire again.
  const firedFor = useRef<number | null>(null)
  const isOver = left === 0
  useEffect(() => {
    if (isOver && onExpire && firedFor.current !== until) {
      firedFor.current = until
      onExpire()
    }
  }, [isOver, until, onExpire])
  const m = Math.floor(left / 60000)
  const sec = Math.floor((left % 60000) / 1000)
  const urgent = left < 3 * 60_000
  return (
    <span className={cn(s.timer, urgent && s.timerUrgent)} role="timer" aria-label={`Fare held for ${m} minutes ${sec} seconds`}>
      <Timer />
      <span className="mono">
        {String(m).padStart(2, '0')}:{String(sec).padStart(2, '0')}
      </span>
    </span>
  )
}

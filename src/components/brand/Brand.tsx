import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { SERVICE_ORDER, SERVICES, type ServiceId } from '@/config/services'
import { cn } from '@/lib/cn'
import { createRng } from '@/lib/random'
import s from './Brand.module.css'

/* ---------- Logo ---------- */
export function LogoMark({ size = 30, tone = 'ink' }: { size?: number; tone?: 'ink' | 'paper' }) {
  const ink = tone === 'ink'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className={s.mark}>
      <defs>
        <linearGradient id={`lm-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ink ? '#1f2a44' : '#ffffff'} />
          <stop offset="1" stopColor={ink ? '#0b1220' : '#e9ecf2'} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="17" fill={`url(#lm-${tone})`} />
      <rect x="0.5" y="0.5" width="63" height="63" rx="16.5" fill="none" stroke={ink ? 'rgba(255,255,255,.14)' : 'rgba(11,18,32,.08)'} />
      <path d="M18 32H46A14 14 0 1 0 41.9 41.9" fill="none" stroke={ink ? '#fff' : '#0b1220'} strokeWidth="5.6" strokeLinecap="round" />
      <circle cx="42.4" cy="42.4" r="5.4" fill="#ff7a35" stroke={ink ? '#0b1220' : '#fff'} strokeWidth="2.4" />
    </svg>
  )
}

export function Logo({ tone = 'ink', size = 30, className }: { tone?: 'ink' | 'paper'; size?: number; className?: string }) {
  return (
    <span className={cn(s.logo, tone === 'paper' && s.logoPaper, className)}>
      <LogoMark size={size} tone={tone === 'ink' ? 'ink' : 'paper'} />
      <span className={s.word} style={{ fontSize: size * 0.82 }}>
        ekam
      </span>
    </span>
  )
}

/* ---------- Five-line bundle: the brand's signature ---------- */
export function LineBundle({ thickness = 3, gap = 3, vertical, className, animated }: { thickness?: number; gap?: number; vertical?: boolean; className?: string; animated?: boolean }) {
  return (
    <span
      className={cn(s.bundle, vertical && s.bundleV, animated && s.bundleAnim, className)}
      style={{ ['--th' as string]: `${thickness}px`, ['--gap' as string]: `${gap}px` } as CSSProperties}
      aria-hidden
    >
      {SERVICE_ORDER.map((id, i) => (
        <span key={id} style={{ background: SERVICES[id].color, animationDelay: `${i * 90}ms` }} />
      ))}
    </span>
  )
}

/* ---------- Service roundel ---------- */
export function Roundel({ service, size = 32, className, ring }: { service: ServiceId; size?: number; className?: string; ring?: boolean }) {
  const meta = SERVICES[service]
  const Icon = meta.icon
  return (
    <span
      className={cn(s.roundel, ring && s.roundelRing, className)}
      style={{ width: size, height: size, background: meta.color, color: meta.ink }}
      aria-hidden
    >
      <Icon style={{ width: size * 0.52, height: size * 0.52 }} strokeWidth={2} />
    </span>
  )
}

/* ---------- Route line with stations ---------- */
export function RouteLine({ stops = [], top, bottom, className, dashed }: { stops?: string[]; top?: ReactNode; bottom?: ReactNode; className?: string; dashed?: boolean }) {
  return (
    <div className={cn(s.route, className)}>
      {top && <div className={s.routeTop}>{top}</div>}
      <div className={cn(s.routeLine, dashed && s.routeDashed)}>
        <span className={s.origin} />
        {stops.map((code, i) => (
          <span key={code + i} className={s.stop} style={{ left: `${((i + 1) / (stops.length + 1)) * 100}%` }}>
            <i />
            <b>{code}</b>
          </span>
        ))}
        <span className={s.dest} />
      </div>
      {bottom && <div className={s.routeBottom}>{bottom}</div>}
    </div>
  )
}

/* ---------- Split-flap text ---------- */
export function SplitFlap({ text, length, className }: { text: string; length?: number; className?: string }) {
  const chars = (length ? text.padEnd(length, ' ').slice(0, length) : text).split('')
  return (
    <span className={cn(s.flap, className)} aria-label={text}>
      {chars.map((ch, i) => (
        <span key={i} className={s.flapCell} aria-hidden>
          <span key={ch} className={s.flapChar} style={{ animationDelay: `${i * 28}ms` }}>
            {ch === ' ' ? ' ' : ch}
          </span>
        </span>
      ))}
    </span>
  )
}

/* ---------- Ticket stub with notches ---------- */
export function Ticket({
  children,
  notch = '68%',
  direction = 'vertical',
  className,
  innerClassName,
  style,
}: {
  children: ReactNode
  /** Position of the perforation along the ticket. */
  notch?: string
  /** `vertical` = perforation runs top→bottom (wide tickets). */
  direction?: 'vertical' | 'horizontal'
  className?: string
  innerClassName?: string
  style?: CSSProperties
}) {
  return (
    <div className={cn(s.ticketWrap, className)} style={style}>
      <div className={cn(s.ticket, direction === 'vertical' ? s.ticketV : s.ticketH, innerClassName)} style={{ ['--notch' as string]: notch }}>
        {children}
        <span className={s.perforation} aria-hidden />
      </div>
    </div>
  )
}

/* ---------- Decorative QR (demo only — not scannable) ---------- */
function Finder({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="7" height="7" rx="1.6" fill="currentColor" />
      <rect x="1" y="1" width="5" height="5" rx="1.1" fill="#fff" />
      <rect x="2" y="2" width="3" height="3" rx="0.8" fill="currentColor" />
    </g>
  )
}

export function PseudoQR({ value, size = 120 }: { value: string; size?: number }) {
  const cells = useMemo(() => {
    const n = 25
    const rng = createRng(`qr|${value}`)
    const out: Array<[number, number]> = []
    const finder = (x: number, y: number) => x < 8 && y < 8
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        if (finder(x, y) || finder(n - 1 - x, y) || finder(x, n - 1 - y)) continue
        if (rng.chance(0.48)) out.push([x, y])
      }
    return out
  }, [value])
  return (
    <svg viewBox="-1 -1 27 27" width={size} height={size} className={s.qr} role="img" aria-label={`QR code for ${value} (demo)`}>
      <rect x="-1" y="-1" width="27" height="27" fill="#fff" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x + 0.08} y={y + 0.08} width="0.84" height="0.84" rx="0.22" fill="currentColor" />
      ))}
      <Finder x={0} y={0} />
      <Finder x={18} y={0} />
      <Finder x={0} y={18} />
    </svg>
  )
}

/* ---------- Carrier monogram ---------- */
export function CarrierMark({ code, color, size = 40, label }: { code: string; color: string; size?: number; label?: string }) {
  return (
    <span className={s.carrier} style={{ width: size, height: size, background: color, fontSize: size * 0.34 }} title={label} aria-hidden>
      {code}
    </span>
  )
}

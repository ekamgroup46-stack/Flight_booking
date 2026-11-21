import type { ComponentProps, CSSProperties, ReactNode } from 'react'
import { ArrowLeftRight, ArrowRight, Search } from 'lucide-react'
import { cn } from '@/lib/cn'
import s from './Search.module.css'

/** The white slab that holds a row of search segments. */
export function SearchSlab({ children, className, compact }: { children: ReactNode; className?: string; compact?: boolean }) {
  return <div className={cn(s.slab, compact && s.compact, className)}>{children}</div>
}

type SpanProps = { span?: number; spanMd?: number; spanSm?: number }

export function spanStyle({ span = 2, spanMd, spanSm }: SpanProps): CSSProperties {
  return { ['--span' as string]: span, ['--span-md' as string]: spanMd ?? Math.min(6, span * 2), ['--span-sm' as string]: spanSm ?? 12 }
}

/** Static label/value/sub triad — used inside segment buttons. */
export function SegmentBody({ label, value, sub, placeholder }: { label: string; value?: ReactNode; sub?: ReactNode; placeholder?: string }) {
  return (
    <>
      <span className={s.segLabel}>{label}</span>
      <span className={cn(s.segValue, !value && s.segPlaceholder)}>{value || placeholder}</span>
      {sub !== undefined && <span className={s.segSub}>{sub || ' '}</span>}
    </>
  )
}

export function SegmentButton({
  label,
  value,
  sub,
  placeholder,
  active,
  invalid,
  className,
  ...rest
}: ComponentProps<'button'> & { label: string; value?: ReactNode; sub?: ReactNode; placeholder?: string; active?: boolean; invalid?: boolean }) {
  return (
    <button type="button" className={cn(s.segment, active && s.segActive, invalid && s.segInvalid, className)} aria-expanded={active} {...rest}>
      <SegmentBody label={label} value={value} sub={sub} placeholder={placeholder} />
    </button>
  )
}

/** Grid cell wrapper — gives each field its column span. */
export function Cell({ children, className, ...span }: SpanProps & { children: ReactNode; className?: string }) {
  return (
    <div className={cn(s.cell, className)} style={spanStyle(span)}>
      {children}
    </div>
  )
}

/** A segment backed by a native <select> (keyboard & mobile friendly). */
export function SelectSegment<T extends string>({
  label,
  value,
  sub,
  options,
  onChange,
  ...span
}: SpanProps & { label: string; value: T; sub?: ReactNode; options: Array<{ value: T; label: string }>; onChange: (v: T) => void }) {
  const current = options.find((o) => o.value === value)
  return (
    <div className={s.cell} style={spanStyle(span)}>
      <label className={cn(s.segment, s.selectSeg)}>
        <SegmentBody label={label} value={current?.label} sub={sub} />
        <select className={s.nativeSelect} value={value} onChange={(e) => onChange(e.target.value as T)} aria-label={label}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

/** A segment with an inline text/number input. */
export function InputSegment({ label, sub, suffix, span, spanMd, spanSm, className, ...rest }: SpanProps & ComponentProps<'input'> & { label: string; sub?: ReactNode; suffix?: ReactNode }) {
  return (
    <div className={cn(s.cell, className)} style={spanStyle({ span, spanMd, spanSm })}>
      <label className={cn(s.segment, s.inputSeg)}>
        <span className={s.segLabel}>{label}</span>
        <span className={s.inputRow}>
          <input className={s.segInput} {...rest} />
          {suffix && <span className={s.inputSuffix}>{suffix}</span>}
        </span>
        {sub !== undefined && <span className={s.segSub}>{sub || ' '}</span>}
      </label>
    </div>
  )
}

export function SwapButton({ onClick, label = 'Swap origin and destination' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className={s.swap} onClick={onClick} aria-label={label} title={label}>
      <ArrowLeftRight />
    </button>
  )
}

/** Two location cells sharing one swap button. */
export function PairCell({ children, onSwap, ...span }: SpanProps & { children: ReactNode; onSwap: () => void }) {
  return (
    <div className={cn(s.cell, s.pair)} style={spanStyle(span)}>
      {children}
      <SwapButton onClick={onSwap} />
    </div>
  )
}

export function SearchSubmit({ label = 'Search', loading, compact, ...span }: SpanProps & { label?: string; loading?: boolean; compact?: boolean }) {
  return (
    <div className={cn(s.cell, s.submitCell)} style={spanStyle(span)}>
      <button type="submit" className={cn(s.submit, compact && s.submitCompact)} disabled={loading}>
        <Search className={s.submitIcon} />
        <span>{label}</span>
        <ArrowRight className={s.submitArrow} />
      </button>
    </div>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p className={s.formError} role="alert">
      {message}
    </p>
  )
}

export function OptionRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(s.optionRow, className)}>{children}</div>
}

import { useId, type ComponentProps, type ReactNode } from 'react'
import { Check, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import s from './Field.module.css'

export function Field({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
  optional,
}: {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  children: ReactNode
  className?: string
  htmlFor?: string
  optional?: boolean
}) {
  return (
    <div className={cn(s.field, className)} data-invalid={error ? '' : undefined}>
      {label && (
        <label className={s.label} htmlFor={htmlFor}>
          {label}
          {optional && <span className={s.optional}>Optional</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : (
        hint && <p className={s.hint}>{hint}</p>
      )}
    </div>
  )
}

type InputProps = ComponentProps<'input'> & { icon?: ReactNode; suffix?: ReactNode; invalid?: boolean }

export function Input({ icon, suffix, invalid, className, ...rest }: InputProps) {
  return (
    <div className={cn(s.control, invalid && s.invalid, className)}>
      {icon && <span className={s.prefix}>{icon}</span>}
      <input className={s.input} aria-invalid={invalid || undefined} {...rest} />
      {suffix && <span className={s.suffix}>{suffix}</span>}
    </div>
  )
}

export function Select({ invalid, className, children, ...rest }: ComponentProps<'select'> & { invalid?: boolean }) {
  return (
    <div className={cn(s.control, s.selectWrap, invalid && s.invalid, className)}>
      <select className={s.input} aria-invalid={invalid || undefined} {...rest}>
        {children}
      </select>
    </div>
  )
}

export function Textarea({ invalid, className, ...rest }: ComponentProps<'textarea'> & { invalid?: boolean }) {
  return (
    <div className={cn(s.control, s.textareaWrap, invalid && s.invalid, className)}>
      <textarea className={s.input} aria-invalid={invalid || undefined} {...rest} />
    </div>
  )
}

export function Checkbox({ label, description, className, ...rest }: Omit<ComponentProps<'input'>, 'type'> & { label: ReactNode; description?: ReactNode }) {
  return (
    <label className={cn(s.check, className)}>
      <input type="checkbox" className={s.checkInput} {...rest} />
      <span className={s.box} aria-hidden>
        <Check strokeWidth={3} />
      </span>
      <span className={s.checkText}>
        <span>{label}</span>
        {description && <span className={s.checkDesc}>{description}</span>}
      </span>
    </label>
  )
}

export function Switch({ label, className, ...rest }: Omit<ComponentProps<'input'>, 'type'> & { label: ReactNode }) {
  return (
    <label className={cn(s.switch, className)}>
      <input type="checkbox" role="switch" className={s.checkInput} {...rest} />
      <span className={s.track} aria-hidden>
        <span className={s.thumb} />
      </span>
      <span>{label}</span>
    </label>
  )
}

export function Counter({
  label,
  description,
  value,
  min = 0,
  max = 9,
  onChange,
}: {
  label: string
  description?: string
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
}) {
  const id = useId()
  return (
    <div className={s.counter}>
      <div>
        <div id={id} className={s.counterLabel}>
          {label}
        </div>
        {description && <div className={s.counterDesc}>{description}</div>}
      </div>
      <div className={s.counterCtrl} role="group" aria-labelledby={id}>
        <button type="button" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
          <Minus />
        </button>
        <output aria-live="polite" className="tabular">
          {value}
        </output>
        <button type="button" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
          <Plus />
        </button>
      </div>
    </div>
  )
}

export interface SegmentOption<T extends string> {
  value: T
  label: ReactNode
  icon?: ReactNode
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  tone = 'light',
  size = 'md',
  className,
}: {
  options: SegmentOption<T>[]
  value: T
  onChange: (v: T) => void
  label: string
  tone?: 'light' | 'dark'
  size?: 'sm' | 'md'
  className?: string
}) {
  const found = options.findIndex((o) => o.value === value)
  const index = Math.max(0, found)
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(s.segmented, tone === 'dark' && s.segDark, size === 'sm' && s.segSm, found < 0 && s.segEmpty, className)}
      style={{ ['--count' as string]: options.length, ['--index' as string]: index }}
    >
      <span className={s.segThumb} aria-hidden />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={cn(s.segItem, o.value === value && s.segActive)}
          onClick={() => onChange(o.value)}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Chip({
  selected,
  children,
  icon,
  className,
  ...rest
}: ComponentProps<'button'> & { selected?: boolean; icon?: ReactNode }) {
  return (
    <button type="button" aria-pressed={selected} className={cn(s.chip, selected && s.chipOn, className)} {...rest}>
      {icon}
      {children}
    </button>
  )
}

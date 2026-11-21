import type { ComponentProps, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cn } from '@/lib/cn'
import s from './Button.module.css'

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'glass' | 'link' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface CommonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
}

export function buttonClass({ variant = 'primary', size = 'md', block }: Pick<CommonProps, 'variant' | 'size' | 'block'> = {}) {
  return cn(s.btn, s[variant], s[size], block && s.block)
}

export function Button({
  variant,
  size,
  block,
  loading,
  iconLeft,
  iconRight,
  children,
  className,
  disabled,
  type = 'button',
  ...rest
}: CommonProps & ComponentProps<'button'> & { loading?: boolean }) {
  return (
    <button
      type={type}
      className={cn(buttonClass({ variant, size, block }), loading && s.loading, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className={s.spinner} aria-hidden />}
      {iconLeft && <span className={s.icon}>{iconLeft}</span>}
      {children && <span className={s.label}>{children}</span>}
      {iconRight && <span className={s.icon}>{iconRight}</span>}
    </button>
  )
}

export function ButtonLink({ variant, size, block, iconLeft, iconRight, children, className, ...rest }: CommonProps & LinkProps) {
  return (
    <Link className={cn(buttonClass({ variant, size, block }), className)} {...rest}>
      {iconLeft && <span className={s.icon}>{iconLeft}</span>}
      <span className={s.label}>{children}</span>
      {iconRight && <span className={s.icon}>{iconRight}</span>}
    </Link>
  )
}

export function IconButton({ label, className, children, size = 'md', variant = 'ghost', ...rest }: ComponentProps<'button'> & { label: string; size?: ButtonSize; variant?: ButtonVariant }) {
  return (
    <button type="button" aria-label={label} title={label} className={cn(buttonClass({ variant, size }), s.iconOnly, className)} {...rest}>
      {children}
    </button>
  )
}

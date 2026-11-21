import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useDismiss, useLockBodyScroll } from '@/hooks'
import { cn } from '@/lib/cn'
import s from './Overlay.module.css'

/** Anchored panel. The root wraps the trigger so outside-clicks are measured correctly. */
export function Popover({
  open,
  onOpenChange,
  trigger,
  children,
  align = 'start',
  className,
  panelClassName,
  label,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: ReactNode
  children: ReactNode
  align?: 'start' | 'end' | 'stretch'
  className?: string
  panelClassName?: string
  label?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useDismiss([ref], () => onOpenChange(false), open)
  return (
    <div ref={ref} className={cn(s.popRoot, className)}>
      {trigger}
      {open && (
        <div className={cn(s.popPanel, s[align], panelClassName)} role="dialog" aria-label={label}>
          {children}
        </div>
      )}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  placement = 'center',
  tone,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  placement?: 'center' | 'right' | 'bottom'
  tone?: string
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })
  const titleId = useId()
  useLockBodyScroll(open)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')
        if (!focusables.length) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [open])

  if (!open) return null
  return createPortal(
    <div className={cn(s.overlay, s[`at_${placement}`])} onMouseDown={(e) => e.target === e.currentTarget && onClose()} data-service={tone}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={cn(s.modal, s[size], s[`panel_${placement}`])}>
        <header className={s.modalHead}>
          <div>
            <h2 id={titleId} className={s.modalTitle}>
              {title}
            </h2>
            {description && <p className={s.modalDesc}>{description}</p>}
          </div>
          <button type="button" className={s.close} onClick={onClose} aria-label="Close">
            <X />
          </button>
        </header>
        <div className={s.modalBody}>{children}</div>
        {footer && <footer className={s.modalFoot}>{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}

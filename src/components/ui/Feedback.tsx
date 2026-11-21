import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { CircleCheck, CircleX, Info, RefreshCw, X } from 'lucide-react'
import { getErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/cn'
import { useToastStore, type Toast } from '@/store/toast.store'
import { Button } from './Button'
import s from './Feedback.module.css'

export function Skeleton({ w, h = 14, r = 8, className, style }: { w?: number | string; h?: number | string; r?: number; className?: string; style?: CSSProperties }) {
  return <span className={cn(s.skeleton, className)} style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden />
}

export function Spinner({ size = 20, label = 'Loading' }: { size?: number; label?: string }) {
  return (
    <span className={s.spinner} style={{ width: size, height: size }} role="status">
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** The "end of the line" illustration — used for empty results. */
function EndOfLine() {
  return (
    <svg viewBox="0 0 220 64" className={s.endLine} aria-hidden>
      <path d="M10 32H120" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" />
      <path d="M140 32H210" stroke="var(--ink-200)" strokeWidth="6" strokeLinecap="round" strokeDasharray="2 12" />
      <circle cx="10" cy="32" r="8" fill="#fff" stroke="var(--accent)" strokeWidth="4" />
      <circle cx="70" cy="32" r="6" fill="#fff" stroke="var(--accent)" strokeWidth="3" />
      <rect x="120" y="14" width="6" height="36" rx="3" fill="var(--ink-900)" />
    </svg>
  )
}

export function EmptyState({ title, body, action, compact }: { title: string; body?: ReactNode; action?: ReactNode; compact?: boolean }) {
  return (
    <div className={cn(s.state, compact && s.compact)}>
      <EndOfLine />
      <h3 className={s.stateTitle}>{title}</h3>
      {body && <p className={s.stateBody}>{body}</p>}
      {action && <div className={s.stateAction}>{action}</div>}
    </div>
  )
}

export function ErrorState({ title = 'We hit a signal fault', error, onRetry, compact }: { title?: string; error?: unknown; onRetry?: () => void; compact?: boolean }) {
  return (
    <div className={cn(s.state, s.errorState, compact && s.compact)} role="alert">
      <span className={s.errorIcon}>
        <CircleX />
      </span>
      <h3 className={s.stateTitle}>{title}</h3>
      <p className={s.stateBody}>{getErrorMessage(error)}</p>
      {onRetry && (
        <div className={s.stateAction}>
          <Button variant="secondary" iconLeft={<RefreshCw />} onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  )
}

const TOAST_ICON = { success: CircleCheck, error: CircleX, info: Info }

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToastStore((st) => st.dismiss)
  useEffect(() => {
    const t = setTimeout(() => dismiss(toast.id), 4200)
    return () => clearTimeout(t)
  }, [toast.id, dismiss])
  const Icon = TOAST_ICON[toast.tone]
  return (
    <div className={cn(s.toast, s[toast.tone])} role={toast.tone === 'error' ? 'alert' : 'status'}>
      <Icon className={s.toastIcon} />
      <div className={s.toastText}>
        <strong>{toast.title}</strong>
        {toast.description && <span>{toast.description}</span>}
      </div>
      <button type="button" className={s.toastClose} onClick={() => dismiss(toast.id)} aria-label="Dismiss">
        <X />
      </button>
    </div>
  )
}

export function Toaster() {
  const toasts = useToastStore((st) => st.toasts)
  return (
    <div className={s.toaster} aria-live="polite" data-print="hide">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}

import { useState, type ReactNode } from 'react'
import { ChevronDown, Pencil, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '../ui/Button'
import { Skeleton } from '../ui/Feedback'
import { Modal } from '../ui/Overlay'
import s from './Results.module.css'

/** Summary of the current search + collapsible "modify" form. */
export function ResultsHeader({ eyebrow, title, meta, form }: { eyebrow: ReactNode; title: ReactNode; meta: ReactNode; form: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={s.header}>
      <div className={s.glow} aria-hidden />
      <div className="container">
        <div className={s.headRow}>
          <div className={s.headText}>
            <p className={s.eyebrow}>{eyebrow}</p>
            <h1 className={s.title}>{title}</h1>
            <p className={s.meta}>{meta}</p>
          </div>
          <Button variant={open ? 'primary' : 'secondary'} iconLeft={<Pencil />} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            {open ? 'Close' : 'Modify search'}
          </Button>
        </div>
        {open && (
          <div className={s.modify} data-surface="light">
            {form}
          </div>
        )}
      </div>
    </div>
  )
}

export interface DateStripDay {
  date: string
  top: string
  main: string
  sub?: ReactNode
  disabled?: boolean
  highlight?: boolean
}

export function DateStrip({ days, value, onSelect, loading }: { days: DateStripDay[]; value: string; onSelect: (date: string) => void; loading?: boolean }) {
  return (
    <div className={s.strip} role="tablist" aria-label="Nearby dates">
      {days.map((d) => (
        <button
          key={d.date}
          type="button"
          role="tab"
          aria-selected={d.date === value}
          disabled={d.disabled}
          className={cn(s.stripDay, d.date === value && s.stripOn)}
          onClick={() => onSelect(d.date)}
        >
          <span className={s.stripTop}>{d.top}</span>
          <span className={s.stripMain}>{d.main}</span>
          <span className={cn(s.stripSub, d.highlight && s.stripCheap)}>{loading ? <Skeleton w={44} h={10} /> : (d.sub ?? '—')}</span>
        </button>
      ))}
    </div>
  )
}

export interface SortOption<T extends string> {
  id: T
  label: string
  meta?: ReactNode
}

export function SortBar<T extends string>({ options, value, onChange, count, onOpenFilters, activeFilters }: { options: SortOption<T>[]; value: T; onChange: (v: T) => void; count?: number; onOpenFilters?: () => void; activeFilters?: number }) {
  return (
    <div className={s.sortWrap}>
      <div className={s.sort} role="radiogroup" aria-label="Sort results">
        {options.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={o.id === value} className={cn(s.sortItem, o.id === value && s.sortOn)} onClick={() => onChange(o.id)}>
            <span>{o.label}</span>
            {o.meta && <em>{o.meta}</em>}
          </button>
        ))}
      </div>
      <div className={s.sortSide}>
        {count !== undefined && <span className={s.count}>{count} result{count === 1 ? '' : 's'}</span>}
        {onOpenFilters && (
          <Button variant="secondary" size="sm" className={s.filterBtn} iconLeft={<SlidersHorizontal />} onClick={onOpenFilters}>
            Filters{activeFilters ? ` · ${activeFilters}` : ''}
          </Button>
        )}
      </div>
    </div>
  )
}

/** Desktop: sticky sidebar. Mobile: the same content inside a bottom sheet. */
export function ResultsLayout({
  filters,
  children,
  activeFilters,
  onReset,
  mobileOpen,
  onMobileClose,
  resultCount,
}: {
  filters?: ReactNode
  children: ReactNode
  activeFilters?: number
  onReset?: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
  resultCount?: number
}) {
  return (
    <div className={cn('container', s.layout, !filters && s.noFilters)}>
      {filters && (
        <aside className={s.aside} aria-label="Filters">
          <div className={s.asideHead}>
            <strong>Filters</strong>
            {!!activeFilters && onReset && (
              <button type="button" onClick={onReset}>
                Reset ({activeFilters})
              </button>
            )}
          </div>
          {filters}
        </aside>
      )}
      <div className={s.main}>{children}</div>
      {filters && onMobileClose && (
        <Modal
          open={!!mobileOpen}
          onClose={onMobileClose}
          title="Filters"
          placement="bottom"
          footer={
            <>
              {onReset && (
                <Button variant="ghost" onClick={onReset}>
                  Reset
                </Button>
              )}
              <Button variant="primary" onClick={onMobileClose}>
                Show {resultCount ?? ''} results
              </Button>
            </>
          }
        >
          {filters}
        </Modal>
      )}
    </div>
  )
}

export function FilterGroup({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={s.group}>
      <button type="button" className={s.groupHead} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {title}
        <ChevronDown className={cn(s.groupChev, open && s.groupChevOpen)} />
      </button>
      {open && <div className={s.groupBody}>{children}</div>}
    </div>
  )
}

export function FacetRow({ checked, onChange, label, meta, swatch }: { checked: boolean; onChange: () => void; label: ReactNode; meta?: ReactNode; swatch?: string }) {
  return (
    <label className={s.facet}>
      <input type="checkbox" checked={checked} onChange={onChange} className={s.facetInput} />
      <span className={s.facetBox} aria-hidden />
      {swatch && <i className={s.swatch} style={{ background: swatch }} />}
      <span className={s.facetLabel}>{label}</span>
      {meta && <span className={s.facetMeta}>{meta}</span>}
    </label>
  )
}

export function WindowGrid({ children }: { children: ReactNode }) {
  return <div className={s.windows}>{children}</div>
}

export function WindowTile({ active, onClick, icon, label, range }: { active: boolean; onClick: () => void; icon: ReactNode; label: string; range: string }) {
  return (
    <button type="button" aria-pressed={active} className={cn(s.window, active && s.windowOn)} onClick={onClick}>
      {icon}
      <strong>{label}</strong>
      <span>{range}</span>
    </button>
  )
}

export function PriceSlider({ min, max, value, onChange, format }: { min: number; max: number; value: number | null; onChange: (v: number | null) => void; format: (n: number) => string }) {
  const current = value ?? max
  return (
    <div className={s.slider}>
      <div className={s.sliderVals}>
        <span>{format(min)}</span>
        <strong>Up to {format(current)}</strong>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={Math.max(1, Math.round((max - min) / 100))}
        value={current}
        onChange={(e) => {
          const v = Number(e.target.value)
          onChange(v >= max ? null : v)
        }}
        style={{ ['--fill' as string]: `${((current - min) / Math.max(1, max - min)) * 100}%` }}
        aria-label="Maximum price"
      />
    </div>
  )
}

export function ResultSkeletons({ count = 5, height = 128 }: { count?: number; height?: number }) {
  return (
    <div className={s.skeletons} aria-busy="true" aria-label="Loading results">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={s.skelCard} style={{ height, animationDelay: `${i * 80}ms` }}>
          <Skeleton w={44} h={44} r={12} />
          <div className={s.skelMid}>
            <Skeleton w="38%" h={16} />
            <Skeleton w="72%" h={10} />
            <Skeleton w="54%" h={10} />
          </div>
          <Skeleton w={96} h={36} r={10} />
        </div>
      ))}
    </div>
  )
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  return <div className={cn(s.notice, tone === 'warn' && s.noticeWarn)}>{children}</div>
}

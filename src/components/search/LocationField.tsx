import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Building2, MapPin, Plane, Search, TrainFront } from 'lucide-react'
import { useDebouncedValue } from '@/hooks'
import { cn } from '@/lib/cn'
import { locationsApi, resolveLocation } from '@/services/locations/api'
import type { LocationKind, LocationOption } from '@/services/locations/types'
import { Popover } from '../ui/Overlay'
import { SegmentButton } from './SearchUI'
import s from './Search.module.css'

const KIND_ICON = { airport: Plane, station: TrainFront, busCity: Building2, cabPlace: MapPin, cargoCity: Building2 }

export function LocationField({
  kind,
  label,
  value,
  onChange,
  placeholder = 'Where?',
  invalid,
  onPicked,
}: {
  kind: LocationKind
  label: string
  value: string
  onChange: (id: string, option: LocationOption) => void
  placeholder?: string
  invalid?: boolean
  /** Called after a choice — used to advance focus to the next field. */
  onPicked?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const debounced = useDebouncedValue(query, 140)
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const selected = resolveLocation(kind, value)

  const { data = [], isFetching } = useQuery({
    queryKey: ['locations', kind, debounced],
    queryFn: ({ signal }) => locationsApi.search(kind, debounced, signal),
    enabled: open,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })

  // Focus the search box whenever the panel opens (DOM sync only — no state).
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  const toggleOpen = () => {
    if (!open) {
      setQuery('')
      setActive(0)
    }
    setOpen(!open)
  }

  const choose = (opt: LocationOption) => {
    onChange(opt.id, opt)
    setOpen(false)
    onPicked?.()
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(data.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (data[active]) choose(data[active])
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  const Icon = KIND_ICON[kind]

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      label={`${label} search`}
      panelClassName={s.locPanel}
      trigger={
        <SegmentButton
          label={label}
          value={selected?.label}
          sub={selected ? [selected.code, selected.sublabel].filter(Boolean).join(' · ') : 'Type a city or code'}
          placeholder={placeholder}
          active={open}
          invalid={invalid}
          onClick={toggleOpen}
        />
      }
    >
      <div className={s.locSearch}>
        <Search />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={onKey}
          placeholder={kind === 'airport' ? 'City, airport or code' : kind === 'station' ? 'Station name or code' : 'Search a place'}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={data[active] ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
        />
        {isFetching && <span className={s.locSpinner} aria-hidden />}
      </div>
      <p className={s.locHeading}>{query ? 'Matches' : 'Popular'}</p>
      <ul id={listId} role="listbox" className={s.locList}>
        {data.map((opt, i) => (
          <li
            key={opt.id}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            className={cn(s.locOption, i === active && s.locActive, opt.id === value && s.locChosen)}
            onMouseEnter={() => setActive(i)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => choose(opt)}
          >
            <span className={s.locIcon}>{opt.code ? <b>{opt.code}</b> : <Icon />}</span>
            <span className={s.locText}>
              <strong>{opt.label}</strong>
              <em>{opt.sublabel}</em>
            </span>
            {opt.group && <span className={s.locGroup}>{opt.group}</span>}
          </li>
        ))}
        {!data.length && !isFetching && <li className={s.locEmpty}>No matches for “{query}”. Try a nearby city.</li>}
      </ul>
    </Popover>
  )
}

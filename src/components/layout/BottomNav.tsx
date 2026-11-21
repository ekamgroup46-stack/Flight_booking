import { NavLink } from 'react-router'
import { SERVICE_ORDER, SERVICES } from '@/config/services'
import { cn } from '@/lib/cn'
import s from './BottomNav.module.css'

/** Phones & tablets: the five service lines, always one tap away in a fixed glass dock. */
export function BottomNav() {
  return (
    <nav className={s.dock} aria-label="Services" data-print="hide">
      {SERVICE_ORDER.map((id) => {
        const meta = SERVICES[id]
        const Icon = meta.icon
        return (
          <NavLink
            key={id}
            to={meta.path}
            className={({ isActive }) => cn(s.item, isActive && s.active)}
            style={{ ['--line' as string]: meta.color, ['--line-ink' as string]: meta.ink }}
          >
            <span className={s.icon}>
              <Icon strokeWidth={2} />
            </span>
            <span className={s.label}>{meta.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

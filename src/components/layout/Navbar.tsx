import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useLocation, useMatches, useNavigate } from 'react-router'
import { ArrowUpRight, CalendarClock, History, LogIn, LogOut, Menu, UserRound, X } from 'lucide-react'
import { ROUTES, withQuery } from '@/config/routes'
import { SERVICE_ORDER, SERVICES } from '@/config/services'
import { useDismiss, useLockBodyScroll, useScrolled } from '@/hooks'
import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/store/toast.store'
import { Logo, LineBundle, Roundel } from '../brand/Brand'
import s from './Navbar.module.css'

export interface RouteHandle {
  /** Page starts with a dark full-bleed hero: nav renders transparent until scrolled. */
  navOverlay?: boolean
}

const UPCOMING = withQuery(ROUTES.bookings, { tab: 'upcoming' })
const PAST = withQuery(ROUTES.bookings, { tab: 'completed' })

/** The only account control in the header: trips (upcoming / past) and log out. */
function ProfileMenu() {
  const user = useAuthStore((st) => st.user)
  const logout = useAuthStore((st) => st.logout)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  useDismiss([ref], () => setOpen(false), open)
  const close = () => setOpen(false)

  return (
    <div ref={ref} className={s.account}>
      <button
        type="button"
        className={cn(s.profileBtn, user && s.profileUser, open && s.profileOpen)}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={user ? `Account: ${user.name}` : 'Account'}
      >
        {user ? <span className={s.avatar}>{initials(user.name)}</span> : <UserRound />}
      </button>
      {open && (
        <div className={s.menu} role="menu" aria-label="Account">
          <div className={s.menuHead}>
            <span className={s.menuAvatar}>{user ? initials(user.name) : <UserRound />}</span>
            <span>
              <strong>{user ? user.name : 'Welcome to Ekam'}</strong>
              <em>{user ? user.email || `+91 ${user.phone}` : 'Trips booked on this device'}</em>
            </span>
          </div>
          <Link role="menuitem" to={UPCOMING} className={s.menuItem} onClick={close}>
            <CalendarClock /> Upcoming trips
          </Link>
          <Link role="menuitem" to={PAST} className={s.menuItem} onClick={close}>
            <History /> Past trips
          </Link>
          <span className={s.menuRule} role="separator" />
          {user ? (
            <button
              role="menuitem"
              type="button"
              className={cn(s.menuItem, s.menuLogout)}
              onClick={() => {
                logout()
                close()
                toast.info('You’re logged out', 'See you on the next journey.')
                navigate(ROUTES.home)
              }}
            >
              <LogOut /> Log out
            </button>
          ) : (
            <Link role="menuitem" to={ROUTES.login} className={s.menuItem} onClick={close}>
              <LogIn /> Log in / Sign up
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const matches = useMatches()
  const overlay = matches.some((m) => (m.handle as RouteHandle | undefined)?.navOverlay)
  const scrolled = useScrolled(24)
  const location = useLocation()
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const menuOpen = menuFor === location.pathname
  useLockBodyScroll(menuOpen)

  const transparent = overlay && !scrolled && !menuOpen

  return (
    <header className={cn(s.nav, menuOpen ? s.menuMode : transparent ? s.transparent : s.solid)} data-print="hide">
      <div className={cn('container', s.inner)}>
        <Link to={ROUTES.home} className={s.brand} aria-label="Ekam home">
          <Logo tone="paper" size={30} />
        </Link>

        <nav className={s.services} aria-label="Services">
          {SERVICE_ORDER.map((id) => (
            <NavLink key={id} to={SERVICES[id].path} className={({ isActive }) => cn(s.link, isActive && s.active)} style={{ ['--line' as string]: SERVICES[id].color }}>
              <i className={s.dot} />
              {SERVICES[id].label}
            </NavLink>
          ))}
          <span className={s.divider} />
          <NavLink to={ROUTES.offers} className={({ isActive }) => cn(s.link, isActive && s.active)}>
            Offers
            <span className={s.new}>New</span>
          </NavLink>
        </nav>

        <div className={s.right}>
          <ProfileMenu />
          <button type="button" className={s.burger} onClick={() => setMenuFor(menuOpen ? null : location.pathname)} aria-expanded={menuOpen} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Portalled: the header's backdrop-filter would otherwise trap this fixed sheet inside it. */}
      {menuOpen &&
        createPortal(
          <div className={s.sheet}>
            <div className="container">
              <p className={s.sheetEyebrow}>Choose your line</p>
              <ul className={s.lines}>
                {SERVICE_ORDER.map((id) => (
                  <li key={id}>
                    <Link to={SERVICES[id].path} className={s.lineRow} style={{ ['--line' as string]: SERVICES[id].color }}>
                      <Roundel service={id} size={40} />
                      <span>
                        <strong>{SERVICES[id].label}</strong>
                        <em>{SERVICES[id].blurb}</em>
                      </span>
                      <ArrowUpRight />
                    </Link>
                  </li>
                ))}
              </ul>
              <div className={s.sheetLinks}>
                <Link to={ROUTES.offers}>Offers & deals</Link>
                <Link to={ROUTES.cargoTrack}>Track shipment</Link>
              </div>
              <LineBundle thickness={3} gap={4} className={s.sheetBundle} />
            </div>
          </div>,
          document.body,
        )}
    </header>
  )
}

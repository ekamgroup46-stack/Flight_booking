import { useNavigate } from 'react-router'
import { withQuery } from '@/config/routes'
import { SERVICES, type ServiceId } from '@/config/services'
import { useSearchStore } from '@/store/search.store'

/** Remembers the search and navigates to the service's results route. */
export function useSearchNavigate(service: ServiceId) {
  const navigate = useNavigate()
  const remember = useSearchStore((st) => st.remember)
  return (query: Record<string, string>) => {
    remember(service, query)
    navigate(withQuery(SERVICES[service].resultsPath, query))
  }
}

/** Picks a starting value: explicit → last valid search → last places with default dates → default. */
export function initialSearch<T extends object>(
  service: ServiceId,
  parse: (sp: URLSearchParams) => T | null,
  fallback: () => T,
  carry: Array<keyof T>,
  explicit?: T,
): T {
  if (explicit) return explicit
  const recent = useSearchStore.getState().recent[service]
  if (!recent) return fallback()
  const sp = new URLSearchParams(recent)
  const parsed = parse(sp)
  if (parsed) return parsed
  const base = fallback()
  const patch: Partial<T> = {}
  for (const key of carry) {
    const v = sp.get(String(key))
    if (v) (patch as Record<string, unknown>)[String(key)] = v
  }
  return { ...base, ...patch }
}

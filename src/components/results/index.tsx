import type { ReactNode } from 'react'
import type { ServiceId } from '@/config/services'
import { InvalidSearch } from './InvalidSearch'

export * from './Results'
export { InvalidSearch }

/** Renders children for a valid search, or a friendly "fix your search" state. */
export function InvalidSearchGuard({ service, valid, form, children }: { service: ServiceId; valid: boolean; form: ReactNode; children: ReactNode }) {
  return valid ? <>{children}</> : <InvalidSearch service={service} form={form} />
}

import type { ReactNode } from 'react'
import { SERVICES, type ServiceId } from '@/config/services'
import { EmptyState } from '../ui/Feedback'

/** Shown when a results URL is missing or has invalid parameters. */
export function InvalidSearch({ service, form }: { service: ServiceId; form: ReactNode }) {
  return (
    <div className="container" data-service={service} style={{ padding: '56px var(--gutter) 0' }}>
      <EmptyState title={`Let’s set up your ${SERVICES[service].noun} search`} body="This link is missing a few details or points to a date that’s already passed. Fill in the search below and we’ll take it from there." />
      <div style={{ marginTop: 24 }} data-surface="light">
        {form}
      </div>
    </div>
  )
}

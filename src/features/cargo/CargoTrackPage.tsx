import { useSearchParams } from 'react-router'
import { SectionHead } from '@/components/layout/Section'
import { useDocumentTitle } from '@/hooks'
import { TrackForm, TrackingResult } from './Tracking'

export default function CargoTrackPage() {
  useDocumentTitle('Track shipment')
  const [params, setParams] = useSearchParams()
  const id = params.get('id')
  return (
    <div data-service="cargo" className="container" style={{ maxWidth: 880, padding: '64px var(--gutter) 0' }}>
      <SectionHead
        eyebrow="Cargo · Tracking"
        title={
          <>
            Every scan, <span className="serif-i">every</span> stop.
          </>
        }
      />
      <TrackForm key={id ?? ''} initial={id ?? ''} onTrack={(v) => setParams({ id: v })} />
      <TrackingResult id={id} />
    </div>
  )
}

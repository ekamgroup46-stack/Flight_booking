import { useState, type FormEvent } from 'react'
import { PackageSearch, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Display'
import { ErrorState, Skeleton } from '@/components/ui/Feedback'
import { Input } from '@/components/ui/Field'
import { cn } from '@/lib/cn'
import { timeOf } from '@/lib/dates'
import { formatDate } from '@/lib/format'
import { useShipment } from '@/services/cargo/api'
import { SAMPLE_TRACKING_IDS } from '@/services/cargo/mock'
import { STAGE_LABEL, type Shipment } from '@/services/cargo/types'
import s from './Tracking.module.css'

export function TrackForm({ initial = '', onTrack, compact }: { initial?: string; onTrack: (id: string) => void; compact?: boolean }) {
  const [id, setId] = useState(initial)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (id.trim()) onTrack(id.trim().toUpperCase())
  }
  return (
    <form className={s.form} onSubmit={submit}>
      <div className={s.formRow}>
        <Input value={id} onChange={(e) => setId(e.target.value.toUpperCase())} placeholder="Tracking ID, e.g. EKC204611238" icon={<PackageSearch />} aria-label="Tracking ID" maxLength={12} />
        <Button type="submit" variant="accent" iconLeft={<Search />}>
          Track
        </Button>
      </div>
      {!compact && (
        <p className={s.samples}>
          Try:{' '}
          {SAMPLE_TRACKING_IDS.map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => {
                setId(x)
                onTrack(x)
              }}
            >
              {x}
            </button>
          ))}
        </p>
      )}
    </form>
  )
}

function ShipmentView({ shipment }: { shipment: Shipment }) {
  const delivered = shipment.stage === 'delivered'
  return (
    <div className={s.shipment}>
      <div className={s.head}>
        <div>
          <span className="eyebrow">Tracking ID</span>
          <p className={s.id}>{shipment.trackingId}</p>
        </div>
        <Badge tone={delivered ? 'ok' : 'accent'}>{STAGE_LABEL[shipment.stage]}</Badge>
      </div>
      <div className={s.route}>
        <div>
          <span>From</span>
          <strong>{shipment.from}</strong>
        </div>
        <div className={s.bar} aria-label={`${Math.round(shipment.progress * 100)}% of the way`}>
          <span style={{ width: `${shipment.progress * 100}%` }} />
          <i style={{ left: `${shipment.progress * 100}%` }} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <span>To</span>
          <strong>{shipment.to}</strong>
        </div>
      </div>
      <dl className={s.facts}>
        <div>
          <dt>{delivered ? 'Delivered' : 'Expected by'}</dt>
          <dd>{formatDate(shipment.eta, 'medium')}</dd>
        </div>
        <div>
          <dt>Service</dt>
          <dd>{shipment.service}</dd>
        </div>
        <div>
          <dt>Weight</dt>
          <dd>{shipment.weightKg} kg</dd>
        </div>
        <div>
          <dt>Pieces</dt>
          <dd>{shipment.pieces}</dd>
        </div>
      </dl>
      <ol className={s.timeline}>
        {shipment.events.map((e) => (
          <li key={e.title} className={cn(s.event, s[e.state])}>
            <span className={s.dot} aria-hidden />
            <div className={s.eventBody}>
              <strong>{e.title}</strong>
              <span>
                {e.location}
                {e.detail ? ` · ${e.detail}` : ''}
              </span>
            </div>
            <time className={s.time}>{e.state === 'upcoming' ? 'Expected' : `${formatDate(e.at.slice(0, 10), 'short')}, ${timeOf(e.at)}`}</time>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function TrackingResult({ id }: { id: string | null }) {
  const { data, isLoading, isError, error, refetch } = useShipment(id)
  if (!id) return null
  if (isLoading)
    return (
      <div className={s.shipment}>
        <Skeleton h={22} w={220} />
        <Skeleton h={10} style={{ marginTop: 24 }} />
        <Skeleton h={160} style={{ marginTop: 24 }} r={14} />
      </div>
    )
  if (isError) return <ErrorState compact title="Couldn’t find that shipment" error={error} onRetry={() => refetch()} />
  return data ? <ShipmentView shipment={data} /> : null
}

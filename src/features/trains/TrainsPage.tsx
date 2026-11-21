import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Activity, Clock4, Percent, Search, Ticket, Undo2 } from 'lucide-react'
import { RouteBoard } from '@/components/journeys/RouteBoard'
import { FaqSection } from '@/components/layout/FaqSection'
import { SectionHead } from '@/components/layout/Section'
import { GlassSheet } from '@/components/layout/Backdrop'
import { ServiceHero, ServicePage } from '@/components/layout/ServiceHero'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Display'
import { Input } from '@/components/ui/Field'
import { useDocumentTitle } from '@/hooks'
import { getErrorMessage } from '@/lib/api/errors'
import { timeOf } from '@/lib/dates'
import { formatDate, formatMoney } from '@/lib/format'
import { SAMPLE_PNR, trainsApi } from '@/services/trains/api'
import { fareFor } from '@/services/trains/mock'
import { CLASS_INFO, type TrainClass } from '@/services/trains/types'
import l from '../shared/landing.module.css'
import { TrainSearchForm } from './TrainSearchForm'

function PnrStatusTool() {
  const [pnr, setPnr] = useState('')
  const lookup = useMutation({ mutationFn: (v: string) => trainsApi.pnrStatus(v) })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    lookup.mutate(pnr)
  }
  return (
    <div className={l.panel} data-reveal>
      <h3>PNR status</h3>
      <p>Booked elsewhere? Paste any 10-digit PNR — we’ll show confirmation status and chart updates.</p>
      <form className={l.inline} onSubmit={submit}>
        <Input inputMode="numeric" maxLength={10} placeholder="10-digit PNR" value={pnr} onChange={(e) => setPnr(e.target.value.replace(/\D/g, ''))} icon={<Ticket />} aria-label="PNR number" invalid={lookup.isError} />
        <Button type="submit" variant="accent" loading={lookup.isPending} iconLeft={<Search />}>
          Check
        </Button>
      </form>
      <button type="button" className="eyebrow" style={{ marginTop: 10, textTransform: 'none', letterSpacing: 0 }} onClick={() => setPnr(SAMPLE_PNR)}>
        Try a sample PNR: {SAMPLE_PNR}
      </button>
      {lookup.isError && <p style={{ marginTop: 12, color: 'var(--bad)', fontSize: 14 }}>{getErrorMessage(lookup.error)}</p>}
      {lookup.data && (
        <div className={l.result}>
          <p style={{ fontWeight: 600 }}>{lookup.data.train}</p>
          <p className={l.muted} style={{ fontSize: 14 }}>
            {lookup.data.from} → {lookup.data.to} · {formatDate(lookup.data.date, 'medium')} · Chart {lookup.data.chart.toLowerCase()}
          </p>
          <table className={l.table} style={{ marginTop: 14 }}>
            <thead>
              <tr>
                <th>Passenger</th>
                <th>Booked</th>
                <th>Current</th>
              </tr>
            </thead>
            <tbody>
              {lookup.data.passengers.map((p) => (
                <tr key={p.label}>
                  <td>{p.label}</td>
                  <td className="mono">{p.booking}</td>
                  <td>
                    <Badge tone={p.current.startsWith('CNF') ? 'ok' : 'warn'}>{p.current}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function LiveStatusTool() {
  const [num, setNum] = useState('')
  const lookup = useMutation({ mutationFn: (v: string) => trainsApi.liveStatus(v) })
  return (
    <div className={l.panel} data-reveal>
      <h3>Live running status</h3>
      <p>Where’s my train? Enter the 5-digit number to see its last station and expected arrival.</p>
      <form
        className={l.inline}
        onSubmit={(e) => {
          e.preventDefault()
          lookup.mutate(num)
        }}
      >
        <Input inputMode="numeric" maxLength={5} placeholder="e.g. 12951" value={num} onChange={(e) => setNum(e.target.value.replace(/\D/g, ''))} icon={<Activity />} aria-label="Train number" invalid={lookup.isError} />
        <Button type="submit" variant="secondary" loading={lookup.isPending}>
          Track
        </Button>
      </form>
      {lookup.isError && <p style={{ marginTop: 12, color: 'var(--bad)', fontSize: 14 }}>{getErrorMessage(lookup.error)}</p>}
      {lookup.data && (
        <div className={l.result}>
          <p style={{ fontWeight: 600 }}>
            {lookup.data.number} · {lookup.data.name}
          </p>
          <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px', marginTop: 14, fontSize: 14 }}>
            <div>
              <dt className={l.muted}>Last reported</dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>
                {lookup.data.lastStation} · {timeOf(lookup.data.updatedAt)}
              </dd>
            </div>
            <div>
              <dt className={l.muted}>Running</dt>
              <dd style={{ margin: 0 }}>
                <Badge tone={lookup.data.delayMin ? 'warn' : 'ok'}>{lookup.data.delayMin ? `${lookup.data.delayMin} min late` : 'On time'}</Badge>
              </dd>
            </div>
            <div>
              <dt className={l.muted}>Next station</dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>{lookup.data.nextStation}</dd>
            </div>
            <div>
              <dt className={l.muted}>Expected arrival</dt>
              <dd style={{ margin: 0, fontWeight: 600 }} className="mono">
                {timeOf(lookup.data.eta)}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}

const CLASSES: TrainClass[] = ['1A', '2A', '3A', '3E', 'SL', 'CC', 'EC']

export default function TrainsPage() {
  useDocumentTitle('Trains')
  return (
    <ServicePage service="trains">
      <ServiceHero
        service="trains"
        aside={
          <div className={l.chips}>
            <span>
              <Clock4 /> Live berth availability
            </span>
            <span>
              <Percent /> Waitlist confirmation chances
            </span>
            <span>
              <Undo2 /> Instant refunds to UPI
            </span>
          </div>
        }
      >
        <TrainSearchForm />
      </ServiceHero>
      <GlassSheet>

      <section className={`${l.section} ${l.first}`} id="pnr">
        <div className="container">
          <SectionHead index="01" eyebrow="Rail tools" title="Already booked? Stay on top of it." lede="PNR status and live running status for any train — no login needed." />
          <div className={l.split}>
            <PnrStatusTool />
            <LiveStatusTool />
          </div>
        </div>
      </section>

      <section className={l.section}>
        <div className="container">
          <SectionHead index="02" eyebrow="On the rails" title="Popular train routes" />
          <RouteBoard service="trains" title="Popular trains" />
        </div>
      </section>

      <section className={l.section}>
        <div className="container">
          <SectionHead
            index="03"
            eyebrow="Know your class"
            title={
              <>
                From <span className="serif-i">sleeper</span> to first AC.
              </>
            }
            lede="Indicative fares for a 500 km journey on a superfast train, general quota."
          />
          <div style={{ overflowX: 'auto' }} data-reveal>
            <table className={l.table}>
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Name</th>
                  <th>What to expect</th>
                  <th style={{ textAlign: 'right' }}>From</th>
                </tr>
              </thead>
              <tbody>
                {CLASSES.map((c) => (
                  <tr key={c}>
                    <td>
                      <span className={l.code}>{c}</span>
                    </td>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{CLASS_INFO[c].label}</td>
                    <td className={l.muted}>{CLASS_INFO[c].description}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatMoney(fareFor(c, 500, 'superfast', 'GN'))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <FaqSection topic="trains" index="04" />
      </GlassSheet>
    </ServicePage>
  )
}

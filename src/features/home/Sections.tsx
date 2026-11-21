import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight, ArrowUpRight, Headset, Lock, ReceiptText, Route, Zap } from 'lucide-react'
import { LineBundle, Roundel } from '@/components/brand/Brand'
import { RouteBoard } from '@/components/journeys/RouteBoard'
import { SectionHead } from '@/components/layout/Section'
import { OfferTicket } from '@/components/offers/OfferTicket'
import { ButtonLink } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/Display'
import { Chip } from '@/components/ui/Field'
import { ROUTES, withQuery } from '@/config/routes'
import { SERVICES } from '@/config/services'
import { CATEGORY_LABEL, DESTINATIONS, destinationLink, type DestinationCategory } from '@/content/destinations'
import { EXPERIENCES, TRENDING } from '@/content/journeys'
import { cn } from '@/lib/cn'
import { formatMoney } from '@/lib/format'
import { OFFERS } from '@/services/offers/data'
import s from './Home.module.css'

/* ---------- Trust strip ---------- */
export function TrustStrip() {
  const items = [
    { value: '₹0', label: 'convenience fee, on every booking' },
    { value: '4.8★', label: 'from 1.2 lakh verified reviews' },
    { value: '2,300+', label: 'verified bus & cab operators' },
    { value: '87 s', label: 'average time to a human' },
  ]
  return (
    <div className={cn('container', s.trust)}>
      {items.map((it) => (
        <div key={it.label} className={s.trustItem} data-reveal>
          <strong>{it.value}</strong>
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ---------- Destinations index ---------- */
export function Destinations() {
  const [cat, setCat] = useState<DestinationCategory | 'all'>('all')
  const list = DESTINATIONS.filter((d) => cat === 'all' || d.category === cat).slice(0, 7)
  const [activeId, setActiveId] = useState<string | undefined>(list[0]?.id)
  const active = list.find((d) => d.id === activeId) ?? list[0]
  const navigate = useNavigate()

  return (
    <section className={s.section}>
      <div className="container">
        <SectionHead
          index="01"
          eyebrow="Popular destinations"
          title={
            <>
              Where India is <span className="serif-i">headed</span> this season.
            </>
          }
          lede="Hand-picked by our trip planners and ranked by what travellers are actually booking. Every fare below is live-searchable in one tap."
          action={
            <div className={s.catChips} role="group" aria-label="Filter destinations">
              {(Object.keys(CATEGORY_LABEL) as Array<DestinationCategory | 'all'>).map((c) => (
                <Chip
                  key={c}
                  selected={cat === c}
                  onClick={() => {
                    setCat(c)
                    setActiveId(DESTINATIONS.find((d) => c === 'all' || d.category === c)?.id)
                  }}
                >
                  {CATEGORY_LABEL[c]}
                </Chip>
              ))}
            </div>
          }
        />

        <div className={s.destGrid}>
          <div className={s.destVisual} data-reveal data-reveal-media>
            {list.map((d) => (
              <img key={d.id} src={d.image} alt={`${d.name}, ${d.region}`} className={cn(s.destImg, d.id === active?.id && s.destImgOn)} loading="lazy" />
            ))}
            {active && (
              <div className={s.destCaption}>
                <span className={s.coords}>{active.coords}</span>
                <span className={s.season}>Best · {active.season}</span>
              </div>
            )}
          </div>

          <ol className={s.destList}>
            {list.map((d, i) => (
              <li key={d.id}>
                <Link
                  to={destinationLink(d)}
                  className={cn(s.destRow, d.id === active?.id && s.destRowOn)}
                  onMouseEnter={() => setActiveId(d.id)}
                  onFocus={() => setActiveId(d.id)}
                  style={{ ['--line' as string]: SERVICES[d.via].color }}
                >
                  <span className={s.destIdx}>{String(i + 1).padStart(2, '0')}</span>
                  <span className={s.destName}>
                    <strong>{d.name}</strong>
                    <em>
                      {d.region} · {d.tagline}
                    </em>
                  </span>
                  <span className={s.destModes} aria-label={`Reach by ${d.modes.map((m) => SERVICES[m].label).join(', ')}`}>
                    {d.modes.map((m) => (
                      <Roundel key={m} service={m} size={20} />
                    ))}
                  </span>
                  <span className={s.destPrice}>
                    <small>from</small>
                    {formatMoney(d.fromPrice)}
                  </span>
                  <ArrowUpRight className={s.destArrow} />
                </Link>
              </li>
            ))}
          </ol>
        </div>

        {/* Mobile carousel */}
        <div className={s.destRail}>
          {list.map((d) => (
            <button key={d.id} type="button" className={s.destCard} onClick={() => navigate(destinationLink(d))}>
              <img src={d.image} alt="" loading="lazy" />
              <span className={s.destCardText}>
                <em>{d.region}</em>
                <strong>{d.name}</strong>
                <span>from {formatMoney(d.fromPrice)}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Offers ---------- */
export function OffersSection() {
  const winter = OFFERS.find((o) => o.code === 'WINTER25')!
  const rail = OFFERS.filter((o) => o.code !== 'WINTER25').slice(0, 6)
  return (
    <section className={cn(s.section, s.offersSection)}>
      <div className="container">
        <SectionHead
          index="02"
          eyebrow="Exclusive offers"
          title={
            <>
              Fares worth <span className="serif-i">packing</span> for.
            </>
          }
          lede="Codes apply automatically when eligible — or copy one and paste it at checkout. No fine-print surprises: every condition is listed on the ticket."
          action={
            <ButtonLink to={ROUTES.offers} variant="secondary" iconRight={<ArrowRight />}>
              All offers
            </ButtonLink>
          }
        />

        <div className={s.campaign} data-reveal data-reveal-media data-service="flights">
          <img src="/images/misc/offer-winter.webp" alt="" loading="lazy" className={s.campaignImg} />
          <div className={s.campaignShade} />
          <div className={s.campaignCopy}>
            <span className={s.campaignKicker}>Winter getaways · ends {new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long' }).format(new Date(winter.validTill))}</span>
            <h3>
              25% off flights
              <br />
              to the hills <span className="serif-i">&amp;</span> the coast.
            </h3>
            <p>Srinagar, Leh, Goa, Port Blair and 40 more winter favourites. Up to ₹2,500 off per booking.</p>
            <div className={s.campaignActions}>
              <ButtonLink to={ROUTES.flights} variant="accent" size="lg" iconRight={<ArrowRight />}>
                Find winter fares
              </ButtonLink>
            </div>
          </div>
          <div className={s.coupon}>
            <span className={s.couponLabel}>Use code</span>
            <span className={s.couponCode}>{winter.code}</span>
            <CopyButton value={winter.code} />
          </div>
        </div>

        <div className={s.offerRail} role="list">
          {rail.map((o) => (
            <div key={o.id} role="listitem" className={s.offerItem} data-reveal>
              <OfferTicket offer={o} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Why Ekam ---------- */
const PROMISES = [
  { icon: Route, title: 'One search, five modes', body: 'Flights, trains, buses, cabs and cargo share one search, one checkout and one account. Compare a flight with an overnight sleeper in the same breath.', proof: '12,400+ routes · 640 cities' },
  { icon: ReceiptText, title: 'The price you see is the price you pay', body: 'Taxes included up front. No convenience fee, no payment-method surcharge, no pre-ticked add-ons quietly inflating your total.', proof: 'Convenience fee: ₹0' },
  { icon: Lock, title: 'Checkout that guards your money', body: 'Tokenised cards, UPI intent flows and PCI-DSS Level 1 payment partners. Fares are held for 15 minutes while you pay.', proof: 'PCI-DSS L1 · 3-D Secure' },
  { icon: Headset, title: 'Humans on call, all night', body: 'Missed connection at 2 AM? A real person answers — and can rebook, refund or reroute across modes, not just the one you booked.', proof: 'Median answer: 87 seconds' },
  { icon: Zap, title: 'Booked before your chai cools', body: 'Saved travellers, smart defaults and one-tap UPI. Most bookings complete in three screens and under a minute.', proof: 'Median checkout: 54 s' },
]

export function WhyUs() {
  return (
    <section className={cn(s.section, s.why)}>
      <div className={s.whyGlow} aria-hidden />
      <div className="container">
        <SectionHead
          tone="dark"
          index="03"
          eyebrow="Why Ekam"
          title={
            <>
              Booking travel shouldn’t feel like <span className="serif-i">work</span>.
            </>
          }
          lede="We built Ekam around five promises. Each one is a station on the line — and we don’t skip stops."
        />
        <div className={s.whyGrid}>
          <ol className={s.stations}>
            <LineBundle vertical thickness={2} gap={3} className={s.track} />
            {PROMISES.map((p, i) => (
              <li key={p.title} className={s.station} data-reveal style={{ ['--reveal-delay' as string]: `${i * 70}ms` }}>
                <span className={s.stationDot} aria-hidden>
                  <p.icon />
                </span>
                <div>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                  <span className={s.proof}>{p.proof}</span>
                </div>
              </li>
            ))}
          </ol>

          <div className={s.receiptCol}>
            <div className={s.receipt} data-reveal>
              <div className={s.receiptHead}>
                <span>Fare breakdown</span>
                <span className="mono">DEL → BOM</span>
              </div>
              <dl className={s.receiptLines}>
                <div>
                  <dt>Base fare · 1 adult</dt>
                  <dd>₹4,018</dd>
                </div>
                <div>
                  <dt>Taxes & airport fees</dt>
                  <dd>₹872</dd>
                </div>
                <div>
                  <dt>Convenience fee</dt>
                  <dd>
                    <s>₹349</s> ₹0
                  </dd>
                </div>
                <div>
                  <dt>Payment surcharge</dt>
                  <dd>
                    <s>₹110</s> ₹0
                  </dd>
                </div>
              </dl>
              <div className={s.receiptTotal}>
                <span>You pay</span>
                <strong>₹4,890</strong>
              </div>
              <p className={s.receiptNote}>Same number on the results page, the checkout and your card statement.</p>
            </div>
            <div className={s.supportCard} data-reveal>
              <span className={s.supportNum}>87s</span>
              <span>Median wait to reach a person — by phone, chat or WhatsApp, any hour.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Inspiration ---------- */
export function Inspiration() {
  const [lead, ...rest] = EXPERIENCES
  return (
    <section className={s.section}>
      <div className="container">
        <SectionHead
          index="04"
          eyebrow="Travel inspiration"
          title={
            <>
              Popular routes, <span className="serif-i">trending</span> places, slower journeys.
            </>
          }
          lede="Start from a route people love, or from a story worth taking. Every card opens a live search with the details filled in."
        />
        <RouteBoard />

        <div className={s.ticker} aria-label="Trending destinations this week">
          <span className={s.tickerLabel}>Trending this week</span>
          <div className={s.tickerTrack}>
            <div className={s.tickerMove}>
              {[...TRENDING, ...TRENDING].map((t, i) => (
                <span key={i} className={s.tickerItem}>
                  {t.name} <em>▲ {t.change}%</em>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={s.stories}>
          <Link to={withQuery(SERVICES[lead.service].resultsPath, lead.query)} className={s.storyLead} data-reveal data-reveal-media>
            <img src={lead.image} alt="" loading="lazy" />
            <span className={s.storyShade} />
            <span className={s.storyLeadText}>
              <em>{lead.kicker}</em>
              <strong>{lead.title}</strong>
              <span>{lead.blurb}</span>
              <span className={s.storyCta}>
                Plan this journey <ArrowRight />
              </span>
            </span>
          </Link>
          <ul className={s.storyList}>
            {rest.map((x, i) => (
              <li key={x.id} data-reveal style={{ ['--reveal-delay' as string]: `${i * 60}ms` }}>
                <Link to={withQuery(SERVICES[x.service].resultsPath, x.query)} className={s.storyRow}>
                  <img src={x.image} alt="" loading="lazy" />
                  <span>
                    <em>{x.kicker}</em>
                    <strong>{x.title}</strong>
                    <span>{x.blurb}</span>
                  </span>
                  <ArrowUpRight className={s.storyArrow} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

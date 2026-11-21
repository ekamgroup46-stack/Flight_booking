# Ekam — multi-modal travel booking (frontend, phase 1)

**Ekam** (एकम्, Sanskrit for *one*) is one place to search, compare and book **flights, trains, buses, cabs and cargo**.
This repository is the phase-1 build: the complete website design and frontend booking flows, running on
realistic mock data behind a backend-ready API layer. No live supplier APIs or payment gateways are connected yet.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build
npm run lint       # oxlint (incl. React hooks / compiler rules)
```

Requires Node 20+ (built and tested on Node 24).

---

## What's in it

| Area | Route | Highlights |
|---|---|---|
| Home | `/` | Split-flap departure board, glass multi-service search console, destinations index, offers, "Why Ekam", popular-routes board, stories |
| Flights | `/flights`, `/flights/results` | Fare-hint calendar, 30-day "when to fly" chart, round trips (outbound → return), Saver / Flexi / Super Flexi fares, filters & sorts |
| Trains | `/trains`, `/trains/results` | Class tiles with AVL / RAC / WL + confirmation chance, quotas incl. Tatkal, route & halts drawer, PNR & live-status tools |
| Buses | `/buses`, `/buses/results` | Lazy-loaded seat maps (2+1 sleeper decks, 2+2 seaters), women-reserved seats, boarding/dropping points |
| Cabs | `/cabs`, `/cabs/results` | Airport, hourly rental, outstation one-way & round trip; route map; inclusions/exclusions |
| Cargo | `/cargo`, `/cargo/quotes`, `/cargo/track` | Volumetric vs chargeable weight, air/surface/rail/PTL/FTL quotes with CO₂, pickup slots, tracking timeline |
| Checkout | `/checkout` | One generic flow for every service: details → extras & coupons → payment (UPI / card / net banking / wallet), 15-min fare hold |
| Confirmation | `/booking/:id/confirmed` | Boarding-pass ticket, add-to-calendar (.ics), print/PDF, share |
| My bookings | `/bookings` | Upcoming / completed / cancelled, ticket view, cancellation with refund quote |
| Other | `/offers`, `/login`, `/signup`, `/support`, `/about`, `/contact`, `/policies/booking`, `/terms`, `/privacy`, 404 | |

Every data view has **loading skeletons, empty states and error states with retry**. Search state lives in the URL, so
results pages are shareable and survive refresh.

### Demo tips

| Try | How |
|---|---|
| Error states | Append `?simulate=error` to any URL (or set `VITE_MOCK_FAILURE_RATE`) |
| Payment decline | Card number ending in **0002**, e.g. `4000 0000 0000 0002`. `4111 1111 1111 1111` succeeds |
| Login | Mobile OTP is **123456**; email login accepts any 6+ character password |
| Coupons | `EKAMFIRST`, `FLYHIGH`, `WINTER25`, `RAILJOY`, `NIGHTOWL`, `RIDE150`, `ROADTRIP`, `SHIPSMART`, `UPIFAST` (each validates service, tags and minimum amount) |
| Tracking | `EKC204611238`, `EKC981200457`, `EKC550019874` — or the tracking ID of a cargo booking you make |
| Reset demo data | Clear site data (localStorage keys start with `ekam.`) |

---

## Design system

The identity borrows from **transit wayfinding**: every service is a metro-style *line* with its own colour, and the
interface accent re-points to that line on each service page (`[data-service]` in `src/styles/tokens.css`).

| Line | Colour | | Line | Colour |
|---|---|---|---|---|
| Flights | `#2f6bff` | | Cabs | `#ffc21a` (dark text) |
| Trains | `#e4473b` | | Cargo | `#7b5cff` |
| Buses | `#0e9f6e` | | Brand signal | `#ff7a35` (logo dot, live indicators) |

- **Type:** Geist (UI), Instrument Serif italic (editorial accents only), Geist Mono (times, codes, PNRs) — self-hosted via Fontsource.
- **Motifs:** route lines with station dots, the five-line bundle, split-flap characters, ticket stubs with notches (CSS masks).
- **Fixed backdrop + glass:** one flight photograph (`HERO_IMAGE` in `config/services.ts`) is fixed behind the whole site (`components/layout/Backdrop.tsx`). Heroes are transparent over it; page content rides on a glossy frosted `GlassSheet`. A pre-blurred copy of the photo fades in as the sheet rises, so the glass looks frosted without per-frame backdrop blur.
- **Surfaces:** cards use a glossy `--surface` gradient with a specular top edge (`--sh-*` tokens); warm paper + ink neutrals; live frosted glass only where something sits directly over the photo (search consoles, nav, booking summary).
- Components live in `src/components` (UI kit, brand, layout, search, results). Tokens in `src/styles/tokens.css`.
- **Layout:** fluid full-width pages with a 10% side gap from 1280px up, tapering smoothly to 20px on phones (`--gutter` in `tokens.css`).
- **Motion:** page-enter transitions with a five-line sweep (`app/RootLayout`), inertial smooth scrolling via Lenis (`lib/smoothScroll.ts`, paused while dialogs are open), scroll-driven hero parallax, media and section reveals (`data-reveal`, `data-reveal-media`), a reading-progress line and a back-to-top button (`components/layout/ScrollUI`).
- Motion respects `prefers-reduced-motion`; focus states, ARIA tabs/combobox/dialog patterns and keyboard navigation are built in.

---

## Architecture

```
src/
  app/            router (lazy, code-split pages), providers, root layout, error boundary
  config/         app.config.ts (env, brand, booking rules) · services.ts (service registry) · routes.ts
  lib/            api/ (http client, mock transport, mock tables), dates, format, validation, files (.ics)
  services/       one module per domain — the only place that knows about APIs
    <service>/    types.ts · api.ts (fetchers + React Query hooks) · mock.ts · query.ts (URL ⇄ params)
                  filters.ts · checkout.ts (selection → CheckoutItem)
    bookings/     booking contract, pricing, mock backend · offers/ · auth/ · locations/ · support/
  store/          Zustand: checkout draft (sessionStorage), auth session, recent searches, toasts
  content/        marketing copy & editorial data (CMS-ready, typed)
  components/     reusable UI — ui/, brand/, layout/, search/, results/, offers/, journeys/
  features/       pages, grouped by feature (home, flights, trains, buses, cabs, cargo, checkout, bookings, …)
```

**Data flow:** page → React Query hook → `services/<domain>/api.ts` → `mockResponse()` *or* `http.get/post()`.
The mock transport simulates latency, cancellation and failures, so UI states behave exactly as they will in production.

**One checkout for five services.** Each service converts its selection into a `CheckoutItem`
(`src/services/bookings/types.ts`) — itinerary segments, fare lines, add-ons, passenger requirements, policy and coupon
tags. Checkout, confirmation and My Bookings only ever read that contract, so adding a sixth service means writing one
adapter, not a new checkout. Totals are computed in one place (`services/bookings/pricing.ts`).

### Connecting real APIs

1. Copy `.env.example` to `.env.local` and set `VITE_USE_MOCKS=false` and `VITE_API_BASE_URL`.
2. Implement these endpoints (request/response shapes are the TypeScript types in each `services/<domain>/types.ts`):

| Domain | Endpoints |
|---|---|
| Locations | `GET /locations/search?kind=&q=` |
| Flights | `GET /flights/search`, `GET /flights/fare-calendar` |
| Trains | `GET /trains/search`, `GET /trains/date-summary`, `GET /trains/pnr/:pnr`, `GET /trains/:number/live` |
| Buses | `GET /buses/search`, `GET /buses/:id/seats` |
| Cabs | `GET /cabs/quote` |
| Cargo | `GET /cargo/quotes`, `GET /cargo/shipments/:trackingId` |
| Offers | `GET /offers`, `POST /offers/validate` |
| Bookings | `GET /bookings`, `GET /bookings/:id`, `POST /bookings`, `GET /bookings/:id/cancellation-quote`, `POST /bookings/:id/cancel` |
| Auth | `POST /auth/otp`, `POST /auth/otp/verify`, `POST /auth/login` |
| Support | `POST /support/tickets` |

3. Payments: `POST /bookings` currently represents "payment captured + booking created". When a gateway is added, create
   a payment intent before it and confirm on the gateway callback — only `features/checkout/PaymentStep.tsx` and
   `bookingsApi.create` need to change.
4. Errors should return `{ message, code }` with an HTTP status; `lib/api/http.ts` normalises them into `ApiError`, which every
   error state already renders. The session token is sent as `Authorization: Bearer …`.

During local development you can proxy `/api` to your backend in `vite.config.ts`.

---

## Before launch

- Replace placeholder brand contact details in `src/config/app.config.ts`.
- Policy pages (`src/content/legal.ts`) are template copy — have them reviewed by legal counsel.
- Carriers, operators and fares in the mock data are fictional/illustrative; the QR on tickets is decorative.
- Photography is from [Unsplash](https://unsplash.com) under the Unsplash License, stored in `public/images/`.

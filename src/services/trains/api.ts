import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { appConfig } from '@/config/app.config'
import { ApiError } from '@/lib/api/errors'
import { http } from '@/lib/api/http'
import { mockResponse } from '@/lib/api/mock'
import { addDays, addMinutes, nowLocalDateTime, todayISO } from '@/lib/dates'
import { createRng, hashString } from '@/lib/random'
import { STATIONS } from '@/services/locations/data'
import { generateTrains, mockSearchTrains, mockTrainDateSummary } from './mock'
import { trainSearchToQuery } from './query'
import type { TrainSearchParams, TrainSearchResult } from './types'

export interface PnrStatus {
  pnr: string
  train: string
  from: string
  to: string
  date: string
  chart: 'Prepared' | 'Not prepared'
  passengers: { label: string; booking: string; current: string }[]
}

export interface LiveTrainStatus {
  number: string
  name: string
  lastStation: string
  updatedAt: string
  delayMin: number
  nextStation: string
  eta: string
}

function mockPnr(pnr: string): PnrStatus {
  if (!/^\d{10}$/.test(pnr)) throw new ApiError('A PNR has exactly 10 digits.', 422, 'INVALID_PNR')
  const rng = createRng(`pnr|${pnr}`)
  const [a, b] = rng.sample(STATIONS, 2)
  const date = addDays(todayISO(), rng.int(1, 20))
  const train = generateTrains(a.code, b.code, date)[0] ?? generateTrains('NDLS', 'JP', date)[0]
  const n = rng.int(1, 4)
  const charted = rng.chance(0.3)
  return {
    pnr,
    train: train ? `${train.number} ${train.name}` : '12957 Swarna Jayanti Rajdhani',
    from: a.name,
    to: b.name,
    date,
    chart: charted ? 'Prepared' : 'Not prepared',
    passengers: Array.from({ length: n }, (_, i) => {
      const wl = rng.chance(0.4)
      const coach = `${rng.pick(['B', 'A', 'S'])}${rng.int(1, 9)}`
      return {
        label: `Passenger ${i + 1}`,
        booking: wl ? `WL ${rng.int(4, 60)}` : `CNF/${coach}/${rng.int(1, 72)}`,
        current: wl ? (charted || rng.chance(0.5) ? `CNF/${coach}/${rng.int(1, 72)}` : `WL ${rng.int(1, 20)}`) : `CNF/${coach}/${rng.int(1, 72)}`,
      }
    }),
  }
}

function mockLiveStatus(number: string): LiveTrainStatus {
  if (!/^\d{5}$/.test(number)) throw new ApiError('Enter a 5-digit train number.', 422, 'INVALID_TRAIN')
  const rng = createRng(`live|${number}|${todayISO()}`)
  const [a, b] = rng.sample(STATIONS, 2)
  const delay = rng.chance(0.4) ? 0 : rng.int(4, 95)
  return {
    number,
    name: `${rng.pick(['Sahyadri', 'Kaveri', 'Malabar', 'Godavari', 'Avadh'])} Express`,
    lastStation: a.name,
    updatedAt: addMinutes(nowLocalDateTime(), -rng.int(2, 14)),
    delayMin: delay,
    nextStation: b.name,
    eta: addMinutes(nowLocalDateTime(), rng.int(20, 140) + delay),
  }
}

export const trainsApi = {
  search(p: TrainSearchParams, signal?: AbortSignal): Promise<TrainSearchResult> {
    if (appConfig.api.useMocks) return mockResponse(() => mockSearchTrains(p.from, p.to, p.date, p.quota), { signal })
    return http.get('/trains/search', trainSearchToQuery(p), { signal })
  },
  dateSummary(from: string, to: string, dates: string[], signal?: AbortSignal) {
    if (appConfig.api.useMocks) return mockResponse(() => mockTrainDateSummary(from, to, dates), { latency: [150, 350], failureRate: 0, signal })
    return http.get<ReturnType<typeof mockTrainDateSummary>>('/trains/date-summary', { from, to, dates: dates.join(',') }, { signal })
  },
  pnrStatus(pnr: string): Promise<PnrStatus> {
    if (appConfig.api.useMocks) return mockResponse(() => mockPnr(pnr.trim()))
    return http.get(`/trains/pnr/${encodeURIComponent(pnr)}`)
  },
  liveStatus(number: string): Promise<LiveTrainStatus> {
    if (appConfig.api.useMocks) return mockResponse(() => mockLiveStatus(number.trim()))
    return http.get(`/trains/${encodeURIComponent(number)}/live`)
  },
}

export function useTrainSearch(params: TrainSearchParams | null) {
  return useQuery({
    queryKey: ['trains', 'search', params],
    queryFn: ({ signal }) => trainsApi.search(params!, signal),
    enabled: !!params,
  })
}

export function useTrainDateSummary(from: string, to: string, start: string, days: number) {
  return useQuery({
    queryKey: ['trains', 'dates', from, to, start, days],
    queryFn: ({ signal }) => trainsApi.dateSummary(from, to, Array.from({ length: days }, (_, i) => addDays(start, i)), signal),
    staleTime: 10 * 60_000,
    placeholderData: keepPreviousData,
  })
}

/** Stable sample PNR for demos. */
export const SAMPLE_PNR = String(4_210_000_000 + (hashString('ekam') % 99_999_999))

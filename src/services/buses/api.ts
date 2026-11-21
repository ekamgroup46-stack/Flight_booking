import { useQuery } from '@tanstack/react-query'
import { appConfig } from '@/config/app.config'
import { http } from '@/lib/api/http'
import { mockResponse } from '@/lib/api/mock'
import { mockSearchBuses, mockSeatLayout } from './mock'
import { busSearchToQuery } from './query'
import type { BusSearchParams, BusSearchResult, SeatLayout } from './types'

export const busesApi = {
  search(p: BusSearchParams, signal?: AbortSignal): Promise<BusSearchResult> {
    if (appConfig.api.useMocks) return mockResponse(() => mockSearchBuses(p.from, p.to, p.date), { signal })
    return http.get('/buses/search', busSearchToQuery(p), { signal })
  },
  /** Seat maps are fetched lazily, per bus, exactly as a live inventory API would. */
  seatLayout(busId: string, signal?: AbortSignal): Promise<SeatLayout> {
    if (appConfig.api.useMocks) return mockResponse(() => mockSeatLayout(busId), { latency: [300, 650], signal })
    return http.get(`/buses/${encodeURIComponent(busId)}/seats`, undefined, { signal })
  },
}

export function useBusSearch(params: BusSearchParams | null) {
  return useQuery({
    queryKey: ['buses', 'search', params],
    queryFn: ({ signal }) => busesApi.search(params!, signal),
    enabled: !!params,
  })
}

export function useSeatLayout(busId: string | null) {
  return useQuery({
    queryKey: ['buses', 'seats', busId],
    queryFn: ({ signal }) => busesApi.seatLayout(busId!, signal),
    enabled: !!busId,
    staleTime: 30_000,
  })
}

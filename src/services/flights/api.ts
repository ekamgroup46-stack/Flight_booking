import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { appConfig } from '@/config/app.config'
import { http } from '@/lib/api/http'
import { mockResponse } from '@/lib/api/mock'
import { addDays } from '@/lib/dates'
import { mockFareCalendar, mockSearchFlights } from './mock'
import { flightSearchToQuery } from './query'
import type { CabinClass, FareDay, FlightSearchParams, FlightSearchResult } from './types'

/**
 * Flights API. Swap to a live provider by setting VITE_USE_MOCKS=false and
 * implementing these endpoints on the backend — the UI is unaffected.
 */
export const flightsApi = {
  search(params: FlightSearchParams, signal?: AbortSignal): Promise<FlightSearchResult> {
    if (appConfig.api.useMocks) return mockResponse(() => mockSearchFlights(params), { signal })
    return http.get('/flights/search', flightSearchToQuery(params), { signal })
  },

  fareCalendar(from: string, to: string, dates: string[], cabin: CabinClass, signal?: AbortSignal): Promise<FareDay[]> {
    if (appConfig.api.useMocks)
      return mockResponse(() => mockFareCalendar(from, to, dates, cabin), { latency: [150, 380], failureRate: 0, signal })
    return http.get('/flights/fare-calendar', { from, to, dates: dates.join(','), cabin }, { signal })
  },
}

export const flightKeys = {
  search: (p: FlightSearchParams) => ['flights', 'search', p] as const,
  calendar: (from: string, to: string, start: string, days: number, cabin: CabinClass) =>
    ['flights', 'calendar', from, to, start, days, cabin] as const,
}

export function useFlightSearch(params: FlightSearchParams | null) {
  return useQuery({
    queryKey: flightKeys.search(params!),
    queryFn: ({ signal }) => flightsApi.search(params!, signal),
    enabled: !!params,
  })
}

/** Lowest fare per day for a window of `days` starting at `start`. */
export function useFareCalendar(from: string, to: string, start: string, days: number, cabin: CabinClass = 'economy', enabled = true) {
  return useQuery({
    queryKey: flightKeys.calendar(from, to, start, days, cabin),
    queryFn: ({ signal }) =>
      flightsApi.fareCalendar(from, to, Array.from({ length: days }, (_, i) => addDays(start, i)), cabin, signal),
    enabled: enabled && !!from && !!to && from !== to,
    staleTime: 10 * 60_000,
    placeholderData: keepPreviousData,
  })
}

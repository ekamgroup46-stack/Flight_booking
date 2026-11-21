import { useQuery } from '@tanstack/react-query'
import { appConfig } from '@/config/app.config'
import { http } from '@/lib/api/http'
import { mockResponse } from '@/lib/api/mock'
import { diffInDays, todayISO } from '@/lib/dates'
import { bookingsTable } from '@/services/bookings/mock'
import { buildTimeline, mockCargoQuote, mockTrack } from './mock'
import { cargoSearchToQuery } from './query'
import type { CargoQuoteResult, CargoSearchParams, Shipment } from './types'

function trackLocal(id: string): Shipment {
  const normalized = id.trim().toUpperCase()
  // Shipments booked in this browser are tracked from the mock bookings table.
  const booking = bookingsTable.all().find((b) => b.service === 'cargo' && b.reference.value === normalized)
  if (booking) {
    const seg = booking.item.segments[0]
    const days = Math.max(1, diffInDays(booking.item.end.slice(0, 10), booking.item.start.slice(0, 10)))
    const started = booking.item.start.slice(0, 10) <= todayISO()
    return {
      trackingId: normalized,
      from: seg.from.name,
      to: seg.to.name,
      service: seg.carrier,
      stage: started ? 'picked_up' : 'booked',
      eta: booking.item.end.slice(0, 10),
      weightKg: Number.parseFloat(booking.item.meta.Weight ?? '1') || 1,
      pieces: Number(booking.item.meta.Pieces ?? 1),
      events: buildTimeline(normalized, seg.from.name, seg.to.name, started ? 'picked_up' : 'booked', booking.createdAt.slice(0, 16), days),
      progress: started ? 0.24 : 0.06,
    }
  }
  return mockTrack(normalized)
}

export const cargoApi = {
  quote(p: CargoSearchParams, signal?: AbortSignal): Promise<CargoQuoteResult> {
    if (appConfig.api.useMocks) return mockResponse(() => mockCargoQuote(p), { signal })
    return http.get('/cargo/quotes', cargoSearchToQuery(p), { signal })
  },
  track(id: string, signal?: AbortSignal): Promise<Shipment> {
    if (appConfig.api.useMocks) return mockResponse(() => trackLocal(id), { latency: [400, 800], signal })
    return http.get(`/cargo/shipments/${encodeURIComponent(id)}`, undefined, { signal })
  },
}

export function useCargoQuote(params: CargoSearchParams | null) {
  return useQuery({
    queryKey: ['cargo', 'quote', params],
    queryFn: ({ signal }) => cargoApi.quote(params!, signal),
    enabled: !!params,
  })
}

export function useShipment(id: string | null) {
  return useQuery({
    queryKey: ['cargo', 'track', id],
    queryFn: ({ signal }) => cargoApi.track(id!, signal),
    enabled: !!id,
    retry: false,
  })
}

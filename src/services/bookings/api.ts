import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { appConfig } from '@/config/app.config'
import { ApiError } from '@/lib/api/errors'
import { http } from '@/lib/api/http'
import { mockResponse } from '@/lib/api/mock'
import { nowLocalDateTime } from '@/lib/dates'
import { bookingsTable, cancelBookingLocal, cancellationQuoteLocal, createBookingLocal } from './mock'
import type { Booking, CancellationQuote, CreateBookingPayload } from './types'

export const bookingsApi = {
  list(): Promise<Booking[]> {
    if (appConfig.api.useMocks) return mockResponse(() => bookingsTable.all(), { latency: [300, 600] })
    return http.get('/bookings')
  },
  get(id: string): Promise<Booking> {
    if (appConfig.api.useMocks)
      return mockResponse(() => {
        const b = bookingsTable.get(id)
        if (!b) throw new ApiError('We couldn’t find that booking.', 404, 'NOT_FOUND')
        return b
      }, { latency: [200, 400], failureRate: 0 })
    return http.get(`/bookings/${encodeURIComponent(id)}`)
  },
  /** Creates the booking after (mock) payment capture. */
  create(payload: CreateBookingPayload): Promise<Booking> {
    if (appConfig.api.useMocks) return mockResponse(() => createBookingLocal(payload), { latency: [1400, 2200], failureRate: 0 })
    return http.post('/bookings', payload)
  },
  cancellationQuote(id: string): Promise<CancellationQuote> {
    if (appConfig.api.useMocks) return mockResponse(() => cancellationQuoteLocal(id), { latency: [300, 500], failureRate: 0 })
    return http.get(`/bookings/${encodeURIComponent(id)}/cancellation-quote`)
  },
  cancel(id: string): Promise<Booking> {
    if (appConfig.api.useMocks) return mockResponse(() => cancelBookingLocal(id), { latency: [700, 1100], failureRate: 0 })
    return http.post(`/bookings/${encodeURIComponent(id)}/cancel`)
  },
}

export const bookingKeys = {
  all: ['bookings'] as const,
  detail: (id: string) => ['bookings', id] as const,
}

export function useBookings() {
  return useQuery({ queryKey: bookingKeys.all, queryFn: bookingsApi.list })
}

export function useBooking(id: string | undefined) {
  return useQuery({ queryKey: bookingKeys.detail(id ?? ''), queryFn: () => bookingsApi.get(id!), enabled: !!id, retry: false })
}

export function useCreateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: bookingsApi.create,
    onSuccess: (booking) => {
      qc.setQueryData(bookingKeys.detail(booking.id), booking)
      void qc.invalidateQueries({ queryKey: bookingKeys.all })
    },
  })
}

export function useCancelBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: bookingsApi.cancel,
    onSuccess: (booking) => {
      qc.setQueryData(bookingKeys.detail(booking.id), booking)
      void qc.invalidateQueries({ queryKey: bookingKeys.all })
    },
  })
}

export type BookingTab = 'upcoming' | 'completed' | 'cancelled'

export function bookingTab(b: Booking): BookingTab {
  if (b.status === 'cancelled') return 'cancelled'
  return b.item.end >= nowLocalDateTime() ? 'upcoming' : 'completed'
}

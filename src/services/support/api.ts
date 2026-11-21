import { appConfig } from '@/config/app.config'
import { http } from '@/lib/api/http'
import { mockResponse } from '@/lib/api/mock'
import { randomDigits } from '@/lib/random'

export interface SupportTicketInput {
  name: string
  email: string
  topic: string
  bookingId?: string
  message: string
}

export interface SupportTicket {
  ticketId: string
  responseWithin: string
}

export const supportApi = {
  createTicket(input: SupportTicketInput): Promise<SupportTicket> {
    if (appConfig.api.useMocks)
      return mockResponse(() => ({ ticketId: `SR-${randomDigits(7)}`, responseWithin: input.bookingId ? '30 minutes' : '2 hours' }), { latency: [700, 1200] })
    return http.post('/support/tickets', input)
  },
}

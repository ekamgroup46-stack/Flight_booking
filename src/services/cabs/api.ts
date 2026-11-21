import { useQuery } from '@tanstack/react-query'
import { appConfig } from '@/config/app.config'
import { http } from '@/lib/api/http'
import { mockResponse } from '@/lib/api/mock'
import { mockCabQuote } from './mock'
import { cabSearchToQuery } from './query'
import type { CabQuoteResult, CabSearchParams } from './types'

export const cabsApi = {
  quote(p: CabSearchParams, signal?: AbortSignal): Promise<CabQuoteResult> {
    if (appConfig.api.useMocks) return mockResponse(() => mockCabQuote(p), { signal })
    return http.get('/cabs/quote', cabSearchToQuery(p), { signal })
  },
}

export function useCabQuote(params: CabSearchParams | null) {
  return useQuery({
    queryKey: ['cabs', 'quote', params],
    queryFn: ({ signal }) => cabsApi.quote(params!, signal),
    enabled: !!params,
  })
}

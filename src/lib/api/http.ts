import { appConfig } from '@/config/app.config'
import { ApiError } from './errors'

/**
 * Thin fetch wrapper used by every service module once mocks are switched
 * off (VITE_USE_MOCKS=false). Handles base URL, query strings, JSON, auth
 * header, timeouts and error normalisation in one place.
 */

type QueryValue = string | number | boolean | null | undefined
export type Query = Record<string, QueryValue | QueryValue[]>

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Query
  body?: unknown
  signal?: AbortSignal
  headers?: Record<string, string>
}

let getAuthToken: () => string | null = () => null

/** Registered by the auth store so requests carry the session token. */
export function setAuthTokenProvider(provider: () => string | null) {
  getAuthToken = provider
}

function buildUrl(path: string, query?: Query): string {
  const base = appConfig.api.baseUrl.replace(/\/$/, '')
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`
  if (!query) return url
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    const values = Array.isArray(value) ? value : [value]
    for (const v of values) if (v !== undefined && v !== null && v !== '') qs.append(key, String(v))
  }
  const s = qs.toString()
  return s ? `${url}?${s}` : url
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, signal, headers } = options
  const timeout = new AbortController()
  const timer = setTimeout(() => timeout.abort(), appConfig.api.timeoutMs)
  const combined = signal ? AbortSignal.any([signal, timeout.signal]) : timeout.signal
  const token = getAuthToken()

  try {
    const res = await fetch(buildUrl(path, query), {
      method,
      signal: combined,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    const data: unknown = res.status === 204 ? undefined : await res.json().catch(() => undefined)
    if (!res.ok) {
      const payload = (data ?? {}) as { message?: string; code?: string }
      throw new ApiError(payload.message ?? res.statusText, res.status, payload.code, data)
    }
    return data as T
  } catch (err) {
    if (err instanceof ApiError) throw err
    if (signal?.aborted) throw err
    if (timeout.signal.aborted) throw new ApiError('The request timed out. Please try again.', 408, 'TIMEOUT')
    throw new ApiError('We could not reach Ekam. Check your connection and retry.', 0, 'NETWORK')
  } finally {
    clearTimeout(timer)
  }
}

export const http = {
  get: <T>(path: string, query?: Query, init?: Omit<RequestOptions, 'method' | 'query'>) =>
    request<T>(path, { ...init, method: 'GET', query }),
  post: <T>(path: string, body?: unknown, init?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...init, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, init?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...init, method: 'PATCH', body }),
  delete: <T>(path: string, init?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...init, method: 'DELETE' }),
}

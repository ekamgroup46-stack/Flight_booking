import { appConfig } from '@/config/app.config'
import { storage } from '@/lib/storage'
import { ApiError } from './errors'

/**
 * Mock transport. Service modules call `mockResponse(() => data)` while
 * `appConfig.api.useMocks` is on. It simulates latency, cancellation and
 * failures so loading / error states behave exactly as they will against a
 * real backend.
 *
 * Force failures in the browser with `?simulate=error` on any URL.
 */

export interface MockOptions {
  latency?: [number, number]
  failureRate?: number
  signal?: AbortSignal
}

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const t = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}

function forcedFailure(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('simulate') === 'error'
  } catch {
    return false
  }
}

export async function mockResponse<T>(produce: () => T | Promise<T>, options: MockOptions = {}): Promise<T> {
  const [min, max] = options.latency ?? appConfig.mock.latency
  await wait(min + Math.random() * (max - min), options.signal)
  const failureRate = options.failureRate ?? appConfig.mock.failureRate
  if (forcedFailure() || Math.random() < failureRate) {
    throw new ApiError(
      'Our partner systems are taking longer than usual to respond. Please try again.',
      503,
      'UPSTREAM_UNAVAILABLE',
    )
  }
  const value = await produce()
  return value === undefined ? value : structuredClone(value)
}

/** Tiny localStorage-backed table that stands in for server persistence. */
export function createMockTable<T extends { id: string }>(name: string, seed?: () => T[]) {
  const key = `ekam.mockdb.v1.${name}`
  const read = (): T[] => {
    const rows = storage.get<T[]>(key)
    if (rows) return rows
    const seeded = seed?.() ?? []
    storage.set(key, seeded)
    return seeded
  }
  const write = (rows: T[]) => storage.set(key, rows)

  return {
    all: read,
    get: (id: string) => read().find((r) => r.id === id) ?? null,
    insert(row: T) {
      write([row, ...read()])
      return row
    },
    update(id: string, patch: Partial<T>) {
      let updated: T | null = null
      write(
        read().map((r) => {
          if (r.id !== id) return r
          updated = { ...r, ...patch }
          return updated
        }),
      )
      return updated as T | null
    },
    reset() {
      storage.remove(key)
    },
  }
}

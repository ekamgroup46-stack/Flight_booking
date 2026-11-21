/** Storage wrappers that never throw (private mode, blocked storage, quota). */

function safe(kind: 'local' | 'session'): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export const storage = {
  get<T>(key: string, kind: 'local' | 'session' = 'local'): T | null {
    try {
      const raw = safe(kind)?.getItem(key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  },
  set(key: string, value: unknown, kind: 'local' | 'session' = 'local'): void {
    try {
      safe(kind)?.setItem(key, JSON.stringify(value))
    } catch {
      /* ignore quota / privacy errors */
    }
  },
  remove(key: string, kind: 'local' | 'session' = 'local'): void {
    try {
      safe(kind)?.removeItem(key)
    } catch {
      /* ignore */
    }
  },
}

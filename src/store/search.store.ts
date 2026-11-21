import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ServiceId } from '@/config/services'

/** Remembers the last search per service so forms reopen where you left off. */
interface SearchState {
  recent: Partial<Record<ServiceId, Record<string, string>>>
  last?: ServiceId
  remember: (service: ServiceId, query: Record<string, string>) => void
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      recent: {},
      last: undefined,
      remember: (service, query) => set((s) => ({ recent: { ...s.recent, [service]: query }, last: service })),
    }),
    { name: 'ekam.search', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
)

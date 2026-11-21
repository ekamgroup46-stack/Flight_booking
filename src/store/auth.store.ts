import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { setAuthTokenProvider } from '@/lib/api/http'
import type { Session, User } from '@/services/auth/api'

interface AuthState {
  user: User | null
  token: string | null
  setSession: (session: Session) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setSession: ({ user, token }) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'ekam.auth', storage: createJSONStorage(() => localStorage), version: 1 },
  ),
)

// Every HTTP request picks up the current session token.
setAuthTokenProvider(() => useAuthStore.getState().token)

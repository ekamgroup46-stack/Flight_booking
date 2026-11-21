import { create } from 'zustand'
import { randomCode } from '@/lib/random'

export type ToastTone = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  title: string
  description?: string
  tone: ToastTone
}

interface ToastState {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (t) => set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id: randomCode(6) }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = {
  success: (title: string, description?: string) => useToastStore.getState().push({ title, description, tone: 'success' }),
  error: (title: string, description?: string) => useToastStore.getState().push({ title, description, tone: 'error' }),
  info: (title: string, description?: string) => useToastStore.getState().push({ title, description, tone: 'info' }),
}

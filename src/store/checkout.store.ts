import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { appConfig } from '@/config/app.config'
import { randomCode } from '@/lib/random'
import type { AppliedCoupon, CabDetails, CargoDetails, CargoParty, CheckoutItem, Contact, Traveller } from '@/services/bookings/types'

/**
 * The in-progress booking ("cart"). Lives in sessionStorage so a refresh
 * mid-checkout keeps the traveller's work, but it never leaks across tabs.
 */

export interface CheckoutDraft {
  id: string
  item: CheckoutItem
  createdAt: number
  holdUntil: number
  travellers: Traveller[]
  contact: Contact
  cab: CabDetails
  cargo: CargoDetails
  addons: string[]
  coupon?: AppliedCoupon
}

interface Prefill {
  name?: string
  email?: string
  phone?: string
}

interface CheckoutState {
  draft: CheckoutDraft | null
  start: (item: CheckoutItem, prefill?: Prefill) => void
  updateTraveller: (id: string, patch: Partial<Traveller>) => void
  setContact: (patch: Partial<Contact>) => void
  setCab: (patch: Partial<CabDetails>) => void
  setCargo: (patch: Partial<Omit<CargoDetails, 'sender' | 'receiver'>>) => void
  setCargoParty: (party: 'sender' | 'receiver', patch: Partial<CargoParty>) => void
  toggleAddon: (id: string) => void
  setCoupon: (coupon?: AppliedCoupon) => void
  extendHold: () => void
  clear: () => void
}

const emptyParty = (): CargoParty => ({ name: '', phone: '', address: '', pincode: '' })

function initialTravellers(item: CheckoutItem, prefill?: Prefill): Traveller[] {
  if (item.details !== 'passengers') return []
  const { adults, children, infants, seats } = item.passengers
  const [first = '', ...rest] = (prefill?.name ?? '').split(' ')
  const list: Traveller[] = []
  const push = (type: Traveller['type'], count: number) => {
    for (let i = 0; i < count; i++) {
      const idx = list.length
      list.push({
        id: randomCode(5),
        type,
        firstName: idx === 0 ? first : '',
        lastName: idx === 0 ? rest.join(' ') : '',
        age: '',
        gender: '',
        seat: seats?.[idx],
        berth: item.passengers.berthPreference ? 'No preference' : undefined,
      })
    }
  }
  push('adult', adults)
  push('child', children)
  push('infant', infants)
  return list
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      draft: null,
      start: (item, prefill) =>
        set({
          draft: {
            id: randomCode(10),
            item,
            createdAt: Date.now(),
            holdUntil: Date.now() + appConfig.booking.holdMinutes * 60_000,
            travellers: initialTravellers(item, prefill),
            contact: { email: prefill?.email ?? '', phone: prefill?.phone ?? '' },
            cab: { passengerName: prefill?.name ?? '', pickupAddress: '', flightNumber: '', notes: '' },
            cargo: { sender: { ...emptyParty(), name: prefill?.name ?? '', phone: prefill?.phone ?? '' }, receiver: emptyParty(), contents: '', declaredValue: '' },
            addons: [],
          },
        }),
      updateTraveller: (id, patch) =>
        set((s) => (s.draft ? { draft: { ...s.draft, travellers: s.draft.travellers.map((t) => (t.id === id ? { ...t, ...patch } : t)) } } : s)),
      setContact: (patch) => set((s) => (s.draft ? { draft: { ...s.draft, contact: { ...s.draft.contact, ...patch } } } : s)),
      setCab: (patch) => set((s) => (s.draft ? { draft: { ...s.draft, cab: { ...s.draft.cab, ...patch } } } : s)),
      setCargo: (patch) => set((s) => (s.draft ? { draft: { ...s.draft, cargo: { ...s.draft.cargo, ...patch } } } : s)),
      setCargoParty: (party, patch) =>
        set((s) => (s.draft ? { draft: { ...s.draft, cargo: { ...s.draft.cargo, [party]: { ...s.draft.cargo[party], ...patch } } } } : s)),
      toggleAddon: (id) =>
        set((s) =>
          s.draft
            ? { draft: { ...s.draft, addons: s.draft.addons.includes(id) ? s.draft.addons.filter((a) => a !== id) : [...s.draft.addons, id] } }
            : s,
        ),
      setCoupon: (coupon) => set((s) => (s.draft ? { draft: { ...s.draft, coupon } } : s)),
      extendHold: () => set((s) => (s.draft ? { draft: { ...s.draft, holdUntil: Date.now() + appConfig.booking.holdMinutes * 60_000 } } : s)),
      clear: () => set({ draft: null }),
    }),
    { name: 'ekam.checkout', storage: createJSONStorage(() => sessionStorage), version: 1 },
  ),
)

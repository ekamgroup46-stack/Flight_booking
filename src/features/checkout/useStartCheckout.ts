import { useNavigate } from 'react-router'
import { ROUTES } from '@/config/routes'
import type { CheckoutItem } from '@/services/bookings/types'
import { useAuthStore } from '@/store/auth.store'
import { useCheckoutStore } from '@/store/checkout.store'

/** Turns any service selection into a checkout draft and opens checkout. */
export function useStartCheckout() {
  const start = useCheckoutStore((s) => s.start)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  return (item: CheckoutItem) => {
    start(item, user ? { name: user.name, email: user.email, phone: user.phone } : undefined)
    navigate(ROUTES.checkout)
  }
}

import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight, CircleAlert, LogIn, RefreshCw } from 'lucide-react'
import { LineBundle } from '@/components/brand/Brand'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Stepper } from '@/components/ui/Display'
import { EmptyState } from '@/components/ui/Feedback'
import { Modal } from '@/components/ui/Overlay'
import { ROUTES } from '@/config/routes'
import { SERVICES } from '@/config/services'
import { useDocumentTitle } from '@/hooks'
import { smoothScroll } from '@/lib/smoothScroll'
import { getErrorMessage } from '@/lib/api/errors'
import { formatMoney } from '@/lib/format'
import { hasErrors, type Errors } from '@/lib/validation'
import { useCreateBooking } from '@/services/bookings/api'
import { computePricing } from '@/services/bookings/pricing'
import { useAuthStore } from '@/store/auth.store'
import { useCheckoutStore, type CheckoutDraft } from '@/store/checkout.store'
import { toast } from '@/store/toast.store'
import { CheckoutSummary } from './CheckoutSummary'
import { DetailsStep, validateDetails } from './DetailsStep'
import { ExtrasStep } from './ExtrasStep'
import { initialPayment, PaymentStep, paymentLabel, validatePayment, type PaymentState } from './PaymentStep'
import s from './Checkout.module.css'

const STEPS = ['Details', 'Extras', 'Payment']

export default function CheckoutPage() {
  useDocumentTitle('Checkout')
  const draft = useCheckoutStore((st) => st.draft)
  if (!draft)
    return (
      <div className="container" style={{ padding: '72px var(--gutter)' }}>
        <EmptyState
          title="Nothing to check out yet"
          body="Your basket is empty — or the fare hold ended in another tab. Start a search and pick a fare to continue."
          action={
            <>
              <ButtonLink to={ROUTES.home}>Start a search</ButtonLink>
              <ButtonLink to={ROUTES.bookings} variant="secondary">
                My bookings
              </ButtonLink>
            </>
          }
        />
      </div>
    )
  return <Checkout draft={draft} />
}

function Checkout({ draft }: { draft: CheckoutDraft }) {
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Errors>({})
  const [payment, setPayment] = useState<PaymentState>(initialPayment)
  const [expired, setExpired] = useState(() => draft.item.service !== 'cargo' && draft.holdUntil < Date.now())
  const pricing = useMemo(() => computePricing(draft.item, draft.addons, draft.coupon), [draft.item, draft.addons, draft.coupon])
  const create = useCreateBooking()
  const clear = useCheckoutStore((st) => st.clear)
  const extendHold = useCheckoutStore((st) => st.extendHold)
  const user = useAuthStore((st) => st.user)
  const navigate = useNavigate()
  const service = SERVICES[draft.item.service]

  const goTo = (i: number) => {
    setStep(i)
    setErrors({})
    smoothScroll.to(0)
  }

  const next = () => {
    if (step === 0) {
      const e = validateDetails(draft)
      setErrors(e)
      if (hasErrors(e)) {
        toast.error('A few details need attention', 'Check the highlighted fields.')
        document.getElementById(Object.keys(e)[0])?.focus()
        return
      }
    }
    goTo(step + 1)
  }

  const pay = () => {
    const e = validatePayment(payment, pricing.total)
    setErrors(e)
    if (hasErrors(e)) return
    create.mutate(
      {
        item: draft.item,
        travellers: draft.travellers,
        contact: draft.contact,
        cab: draft.item.details === 'cab' ? draft.cab : undefined,
        cargo: draft.item.details === 'cargo' ? draft.cargo : undefined,
        addons: draft.addons,
        coupon: draft.coupon,
        payment: { method: payment.method, label: paymentLabel(payment) },
        simulateDecline: payment.method === 'card' && payment.card.number.replace(/\D/g, '').endsWith('0002'),
      },
      {
        onSuccess: (booking) => {
          navigate(ROUTES.confirmation(booking.id), { replace: true })
          setTimeout(clear, 0)
        },
      },
    )
  }

  return (
    <div data-service={draft.item.service} className={s.page}>
      <div className="container">
        <div className={s.top}>
          <button type="button" className={s.back} onClick={() => (step ? goTo(step - 1) : navigate(-1))}>
            <ArrowLeft /> {step ? `Back to ${STEPS[step - 1].toLowerCase()}` : 'Back to results'}
          </button>
          <Stepper steps={STEPS} current={step} onStepClick={goTo} />
        </div>

        {!user && step === 0 && (
          <div className={s.nudge}>
            <LogIn />
            <span>
              <Link to={ROUTES.login}>Log in</Link> to autofill saved travellers and manage this booking from any device — or continue as a guest.
            </span>
          </div>
        )}

        <div className={s.grid}>
          <div className={s.main}>
            {step === 0 && <DetailsStep errors={errors} />}
            {step === 1 && <ExtrasStep pricing={pricing} />}
            {step === 2 && <PaymentStep value={payment} onChange={setPayment} errors={errors} total={pricing.total} />}

            {create.isError && (
              <div className={s.payError} role="alert">
                <CircleAlert />
                <div>
                  <strong>Payment didn’t go through</strong>
                  <span>{getErrorMessage(create.error)}</span>
                </div>
              </div>
            )}

            <div className={s.actions}>
              {step > 0 ? (
                <Button variant="ghost" iconLeft={<ArrowLeft />} onClick={() => goTo(step - 1)}>
                  Back
                </Button>
              ) : (
                <span />
              )}
              {step < 2 ? (
                <Button size="lg" variant="accent" iconRight={<ArrowRight />} onClick={next}>
                  Continue to {STEPS[step + 1].toLowerCase()}
                </Button>
              ) : (
                <Button size="lg" variant="accent" loading={create.isPending} onClick={pay}>
                  Pay {formatMoney(pricing.total)} securely
                </Button>
              )}
            </div>
          </div>
          <CheckoutSummary draft={draft} pricing={pricing} onExpire={() => setExpired(true)} />
        </div>
      </div>

      {create.isPending &&
        createPortal(
        <div className={s.processing} role="status" aria-live="assertive">
          <div className={s.processingCard}>
            <LineBundle thickness={3} gap={4} animated />
            <strong>Confirming with {draft.item.segments[0]?.carrier.split(' · ')[0] ?? service.label}…</strong>
            <span>Securing your {service.noun} and capturing payment. Please don’t close this tab.</span>
          </div>
        </div>,
          document.body,
        )}

      <Modal
        open={expired}
        onClose={() => setExpired(false)}
        size="sm"
        title="Your fare hold has ended"
        description="Prices and seats can change after 15 minutes. Refresh to re-check the fare — it’s usually unchanged."
        footer={
          <>
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Back to results
            </Button>
            <Button
              variant="primary"
              iconLeft={<RefreshCw />}
              onClick={() => {
                extendHold()
                setExpired(false)
                toast.success('Fare re-confirmed', `Still ${formatMoney(pricing.total)} — held for another 15 minutes.`)
              }}
            >
              Refresh fare
            </Button>
          </>
        }
      >
        <span />
      </Modal>
    </div>
  )
}

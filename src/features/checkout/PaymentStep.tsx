import { CreditCard, Info, Landmark, Lock, Smartphone, Wallet } from 'lucide-react'
import { PseudoQR } from '@/components/brand/Brand'
import { Checkbox, Field, Input, Select } from '@/components/ui/Field'
import { Tabs } from '@/components/ui/Display'
import { Link } from 'react-router'
import { ROUTES } from '@/config/routes'
import { formatMoney } from '@/lib/format'
import { isUpiId, luhn, type Errors } from '@/lib/validation'
import type { PaymentMethod } from '@/services/bookings/types'
import s from './Checkout.module.css'

export interface PaymentState {
  method: PaymentMethod
  upiId: string
  upiMode: 'id' | 'qr'
  card: { number: string; name: string; expiry: string; cvv: string }
  bank: string
  accepted: boolean
}

export const initialPayment: PaymentState = {
  method: 'upi',
  upiId: '',
  upiMode: 'id',
  card: { number: '', name: '', expiry: '', cvv: '' },
  bank: '',
  accepted: false,
}

export const WALLET_BALANCE = 1250

const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Bank of Baroda', 'Punjab National Bank', 'Yes Bank']

export function validatePayment(p: PaymentState, total: number): Errors {
  const e: Errors = {}
  if (p.method === 'upi' && p.upiMode === 'id' && !isUpiId(p.upiId)) e.upi = 'Enter a UPI ID like name@bank'
  if (p.method === 'card') {
    if (!luhn(p.card.number)) e.number = 'Check the card number'
    if (!p.card.name.trim()) e.name = 'Name as on card'
    const m = /^(\d{2})\/(\d{2})$/.exec(p.card.expiry)
    const valid = m && Number(m[1]) >= 1 && Number(m[1]) <= 12 && new Date(2000 + Number(m[2]), Number(m[1])) > new Date()
    if (!valid) e.expiry = 'MM/YY in the future'
    if (!/^\d{3,4}$/.test(p.card.cvv)) e.cvv = '3 or 4 digits'
  }
  if (p.method === 'netbanking' && !p.bank) e.bank = 'Choose your bank'
  if (p.method === 'wallet' && total > WALLET_BALANCE) e.wallet = 'Not enough balance'
  if (!p.accepted) e.accepted = 'Please accept the booking policy'
  return e
}

export function paymentLabel(p: PaymentState): string {
  switch (p.method) {
    case 'upi':
      return p.upiMode === 'qr' ? 'UPI · QR' : `UPI · ${p.upiId}`
    case 'card':
      return `Card · •••• ${p.card.number.replace(/\D/g, '').slice(-4)}`
    case 'netbanking':
      return `Net banking · ${p.bank}`
    case 'wallet':
      return 'Ekam Wallet'
  }
}

const formatCard = (v: string) =>
  v
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')

export function PaymentStep({ value, onChange, errors, total }: { value: PaymentState; onChange: (p: PaymentState) => void; errors: Errors; total: number }) {
  const set = (patch: Partial<PaymentState>) => onChange({ ...value, ...patch })
  const setCard = (patch: Partial<PaymentState['card']>) => set({ card: { ...value.card, ...patch } })

  return (
    <div className={s.stepBody}>
      <section className={s.block}>
        <h2 className={s.blockTitle}>How would you like to pay?</h2>
        <p className={s.blockSub}>
          <Lock size={13} style={{ display: 'inline', verticalAlign: '-1px' }} /> Encrypted and processed by a PCI-DSS certified partner. No payment surcharge on any method.
        </p>
        <div className={s.payBox}>
          <Tabs<PaymentMethod>
            label="Payment method"
            value={value.method}
            onChange={(method) => set({ method })}
            items={[
              { id: 'upi', label: 'UPI', icon: <Smartphone /> },
              { id: 'card', label: 'Card', icon: <CreditCard /> },
              { id: 'netbanking', label: 'Net banking', icon: <Landmark /> },
              { id: 'wallet', label: 'Wallet', icon: <Wallet /> },
            ]}
          />
          <div className={s.payPanel}>
            {value.method === 'upi' && (
              <div className={s.upi}>
                <div>
                  <Field label="UPI ID" htmlFor="pay.upi" error={errors.upi} hint="You’ll approve the request in your UPI app">
                    <Input id="pay.upi" value={value.upiId} placeholder="yourname@okbank" onChange={(e) => set({ upiId: e.target.value.trim(), upiMode: 'id' })} invalid={!!errors.upi} />
                  </Field>
                  <button type="button" className={s.linkBtn} onClick={() => set({ upiMode: value.upiMode === 'qr' ? 'id' : 'qr' })}>
                    {value.upiMode === 'qr' ? 'Use a UPI ID instead' : 'Scan a QR with any UPI app instead'}
                  </button>
                </div>
                {value.upiMode === 'qr' && (
                  <div className={s.qr}>
                    <PseudoQR value={`upi:ekam:${total}`} size={140} />
                    <span>Scan to pay {formatMoney(total)}</span>
                  </div>
                )}
              </div>
            )}
            {value.method === 'card' && (
              <div className={s.cardForm}>
                <Field label="Card number" htmlFor="pay.number" error={errors.number} hint="Demo: any valid test card works · one ending in 0002 is declined">
                  <Input id="pay.number" inputMode="numeric" autoComplete="cc-number" placeholder="4111 1111 1111 1111" value={value.card.number} onChange={(e) => setCard({ number: formatCard(e.target.value) })} icon={<CreditCard />} invalid={!!errors.number} />
                </Field>
                <Field label="Name on card" htmlFor="pay.name" error={errors.name}>
                  <Input id="pay.name" autoComplete="cc-name" value={value.card.name} onChange={(e) => setCard({ name: e.target.value })} invalid={!!errors.name} />
                </Field>
                <div className={s.grid2}>
                  <Field label="Expiry" htmlFor="pay.expiry" error={errors.expiry}>
                    <Input
                      id="pay.expiry"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/YY"
                      value={value.card.expiry}
                      onChange={(e) => {
                        const d = e.target.value.replace(/\D/g, '').slice(0, 4)
                        setCard({ expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d })
                      }}
                      invalid={!!errors.expiry}
                    />
                  </Field>
                  <Field label="CVV" htmlFor="pay.cvv" error={errors.cvv}>
                    <Input id="pay.cvv" inputMode="numeric" autoComplete="cc-csc" type="password" maxLength={4} value={value.card.cvv} onChange={(e) => setCard({ cvv: e.target.value.replace(/\D/g, '') })} invalid={!!errors.cvv} />
                  </Field>
                </div>
              </div>
            )}
            {value.method === 'netbanking' && (
              <Field label="Your bank" htmlFor="pay.bank" error={errors.bank} hint="You’ll be redirected to your bank’s secure page">
                <Select id="pay.bank" value={value.bank} onChange={(e) => set({ bank: e.target.value })} invalid={!!errors.bank}>
                  <option value="">Select a bank</option>
                  {BANKS.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </Select>
              </Field>
            )}
            {value.method === 'wallet' && (
              <div className={s.wallet}>
                <Wallet />
                <div>
                  <strong>Ekam Wallet · {formatMoney(WALLET_BALANCE)} available</strong>
                  <span>{total > WALLET_BALANCE ? `Add ${formatMoney(total - WALLET_BALANCE)} or choose another method.` : 'Pays instantly, refunds land back in seconds.'}</span>
                  {errors.wallet && <em>{errors.wallet}</em>}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <div className={s.consent}>
        <Checkbox
          checked={value.accepted}
          onChange={(e) => set({ accepted: e.target.checked })}
          label={
            <>
              I’ve read the <Link to={ROUTES.bookingPolicy}>booking & cancellation policy</Link> and accept the <Link to={ROUTES.terms}>terms</Link>.
            </>
          }
        />
        {errors.accepted && <p className={s.couponError}>{errors.accepted}</p>}
        <p className={s.demo}>
          <Info size={14} /> Prototype checkout — no real payment is taken and no money moves.
        </p>
      </div>
    </div>
  )
}

import { Field, Input, Segmented, Select, Textarea } from '@/components/ui/Field'
import { isEmail, isGstin, isIndianMobile, isPincode, type Errors } from '@/lib/validation'
import type { Traveller } from '@/services/bookings/types'
import { BERTH_PREFERENCES } from '@/services/trains/types'
import { useCheckoutStore, type CheckoutDraft } from '@/store/checkout.store'
import s from './Checkout.module.css'

const TYPE_LABEL: Record<Traveller['type'], string> = { adult: 'Adult', child: 'Child', infant: 'Infant' }

/** Validates the details step; returns a flat map of field-id → message. */
export function validateDetails(d: CheckoutDraft): Errors {
  const e: Errors = {}
  if (d.item.details === 'passengers') {
    d.travellers.forEach((t) => {
      if (!t.firstName.trim()) e[`${t.id}.firstName`] = 'Enter first name'
      if (!t.lastName.trim()) e[`${t.id}.lastName`] = 'Enter last name'
      const age = Number(t.age)
      const [min, max] = t.type === 'infant' ? [0, 1] : t.type === 'child' ? [2, 11] : [12, 110]
      if (t.age === '' || !Number.isFinite(age) || age < min || age > max) e[`${t.id}.age`] = `Age ${min}–${max}`
      if (!t.gender) e[`${t.id}.gender`] = 'Select gender'
    })
  }
  if (d.item.details === 'cab') {
    if (!d.cab.passengerName.trim()) e['cab.passengerName'] = 'Who are we picking up?'
    if (d.cab.pickupAddress.trim().length < 6) e['cab.pickupAddress'] = 'Add a pickup address or terminal/gate'
  }
  if (d.item.details === 'cargo') {
    for (const party of ['sender', 'receiver'] as const) {
      const p = d.cargo[party]
      if (!p.name.trim()) e[`${party}.name`] = 'Enter a name'
      if (!isIndianMobile(p.phone)) e[`${party}.phone`] = 'Enter a 10-digit mobile'
      if (p.address.trim().length < 8) e[`${party}.address`] = 'Enter the full address'
      if (!isPincode(p.pincode)) e[`${party}.pincode`] = '6-digit PIN code'
    }
    if (!d.cargo.contents.trim()) e['cargo.contents'] = 'Describe what you’re sending'
    if (!(Number(d.cargo.declaredValue) > 0)) e['cargo.declaredValue'] = 'Enter the value in ₹'
  }
  if (!isEmail(d.contact.email)) e['contact.email'] = 'Enter a valid email'
  if (!isIndianMobile(d.contact.phone)) e['contact.phone'] = 'Enter a 10-digit mobile number'
  if (d.contact.gstin && !isGstin(d.contact.gstin)) e['contact.gstin'] = 'GSTIN looks incorrect'
  return e
}

function TravellerForm({ t, index, errors, berth }: { t: Traveller; index: number; errors: Errors; berth?: boolean }) {
  const update = useCheckoutStore((st) => st.updateTraveller)
  const id = (f: string) => `${t.id}.${f}`
  return (
    <fieldset className={s.traveller}>
      <legend className={s.travellerHead}>
        <span className={s.travellerNum}>{String(index + 1).padStart(2, '0')}</span>
        Traveller {index + 1} · {TYPE_LABEL[t.type]}
        {t.seat && <span className={s.seatTag}>Seat {t.seat}</span>}
      </legend>
      <div className={s.grid3}>
        <Field label="First name" htmlFor={id('firstName')} error={errors[id('firstName')]}>
          <Input id={id('firstName')} value={t.firstName} onChange={(e) => update(t.id, { firstName: e.target.value })} autoComplete={index === 0 ? 'given-name' : 'off'} invalid={!!errors[id('firstName')]} />
        </Field>
        <Field label="Last name" htmlFor={id('lastName')} error={errors[id('lastName')]}>
          <Input id={id('lastName')} value={t.lastName} onChange={(e) => update(t.id, { lastName: e.target.value })} autoComplete={index === 0 ? 'family-name' : 'off'} invalid={!!errors[id('lastName')]} />
        </Field>
        <Field label="Age" htmlFor={id('age')} error={errors[id('age')]}>
          <Input id={id('age')} type="number" inputMode="numeric" min={0} max={110} value={t.age} onChange={(e) => update(t.id, { age: e.target.value })} invalid={!!errors[id('age')]} />
        </Field>
      </div>
      <div className={s.grid2}>
        <Field label="Gender" error={errors[id('gender')]}>
          <Segmented
            label={`Gender of traveller ${index + 1}`}
            value={t.gender || ('' as Traveller['gender'])}
            onChange={(gender) => update(t.id, { gender })}
            options={[
              { value: 'female', label: 'Female' },
              { value: 'male', label: 'Male' },
              { value: 'other', label: 'Other' },
            ]}
          />
        </Field>
        {berth && (
          <Field label="Berth preference" htmlFor={id('berth')}>
            <Select id={id('berth')} value={t.berth} onChange={(e) => update(t.id, { berth: e.target.value })}>
              {BERTH_PREFERENCES.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </Select>
          </Field>
        )}
      </div>
    </fieldset>
  )
}

function CargoParty({ party, errors }: { party: 'sender' | 'receiver'; errors: Errors }) {
  const value = useCheckoutStore((st) => st.draft!.cargo[party])
  const set = useCheckoutStore((st) => st.setCargoParty)
  const id = (f: string) => `${party}.${f}`
  return (
    <fieldset className={s.traveller}>
      <legend className={s.travellerHead}>{party === 'sender' ? 'Pickup from (sender)' : 'Deliver to (receiver)'}</legend>
      <div className={s.grid2}>
        <Field label="Full name or company" htmlFor={id('name')} error={errors[id('name')]}>
          <Input id={id('name')} value={value.name} onChange={(e) => set(party, { name: e.target.value })} invalid={!!errors[id('name')]} />
        </Field>
        <Field label="Mobile" htmlFor={id('phone')} error={errors[id('phone')]}>
          <Input id={id('phone')} inputMode="tel" value={value.phone} onChange={(e) => set(party, { phone: e.target.value })} suffix="+91" invalid={!!errors[id('phone')]} />
        </Field>
      </div>
      <div className={s.grid2b}>
        <Field label="Address" htmlFor={id('address')} error={errors[id('address')]}>
          <Input id={id('address')} value={value.address} onChange={(e) => set(party, { address: e.target.value })} placeholder="Building, street, area" invalid={!!errors[id('address')]} />
        </Field>
        <Field label="PIN code" htmlFor={id('pincode')} error={errors[id('pincode')]}>
          <Input id={id('pincode')} inputMode="numeric" maxLength={6} value={value.pincode} onChange={(e) => set(party, { pincode: e.target.value.replace(/\D/g, '') })} invalid={!!errors[id('pincode')]} />
        </Field>
      </div>
    </fieldset>
  )
}

export function DetailsStep({ errors }: { errors: Errors }) {
  const draft = useCheckoutStore((st) => st.draft!)
  const setContact = useCheckoutStore((st) => st.setContact)
  const setCab = useCheckoutStore((st) => st.setCab)
  const setCargo = useCheckoutStore((st) => st.setCargo)
  const { item } = draft

  return (
    <div className={s.stepBody}>
      {item.details === 'passengers' && (
        <section className={s.block}>
          <h2 className={s.blockTitle}>Who’s travelling?</h2>
          <p className={s.blockSub}>Names must match government ID exactly.</p>
          {draft.travellers.map((t, i) => (
            <TravellerForm key={t.id} t={t} index={i} errors={errors} berth={item.passengers.berthPreference} />
          ))}
        </section>
      )}

      {item.details === 'cab' && (
        <section className={s.block}>
          <h2 className={s.blockTitle}>Pickup details</h2>
          <p className={s.blockSub}>Your driver gets these 60 minutes before pickup.</p>
          <div className={s.traveller}>
            <div className={s.grid2}>
              <Field label="Passenger name" htmlFor="cab.passengerName" error={errors['cab.passengerName']}>
                <Input id="cab.passengerName" value={draft.cab.passengerName} onChange={(e) => setCab({ passengerName: e.target.value })} invalid={!!errors['cab.passengerName']} />
              </Field>
              {item.couponTags.includes('airport') && (
                <Field label="Flight number" htmlFor="cab.flight" optional hint="We track it and adjust pickup for delays">
                  <Input id="cab.flight" value={draft.cab.flightNumber} onChange={(e) => setCab({ flightNumber: e.target.value.toUpperCase() })} placeholder="e.g. 6E 512" />
                </Field>
              )}
            </div>
            <Field label="Exact pickup point" htmlFor="cab.pickupAddress" error={errors['cab.pickupAddress']} hint="House / building, landmark — or terminal & gate for airports">
              <Textarea id="cab.pickupAddress" rows={3} value={draft.cab.pickupAddress} onChange={(e) => setCab({ pickupAddress: e.target.value })} invalid={!!errors['cab.pickupAddress']} />
            </Field>
            <Field label="Note for the driver" htmlFor="cab.notes" optional>
              <Input id="cab.notes" value={draft.cab.notes} onChange={(e) => setCab({ notes: e.target.value })} placeholder="e.g. Two large suitcases" />
            </Field>
          </div>
        </section>
      )}

      {item.details === 'cargo' && (
        <section className={s.block}>
          <h2 className={s.blockTitle}>Sender & receiver</h2>
          <p className={s.blockSub}>Our pickup partner will call the sender 30 minutes before arriving.</p>
          <CargoParty party="sender" errors={errors} />
          <CargoParty party="receiver" errors={errors} />
          <div className={s.traveller}>
            <div className={s.grid2}>
              <Field label="What’s inside?" htmlFor="cargo.contents" error={errors['cargo.contents']}>
                <Input id="cargo.contents" value={draft.cargo.contents} onChange={(e) => setCargo({ contents: e.target.value })} placeholder="e.g. Books, apparel samples" invalid={!!errors['cargo.contents']} />
              </Field>
              <Field label="Declared value" htmlFor="cargo.value" error={errors['cargo.declaredValue']} hint="Used for insurance and e-way bills">
                <Input id="cargo.value" inputMode="numeric" value={draft.cargo.declaredValue} onChange={(e) => setCargo({ declaredValue: e.target.value.replace(/\D/g, '') })} suffix="₹" invalid={!!errors['cargo.declaredValue']} />
              </Field>
            </div>
          </div>
        </section>
      )}

      <section className={s.block}>
        <h2 className={s.blockTitle}>Where should we send {item.details === 'cargo' ? 'updates' : 'tickets'}?</h2>
        <div className={s.traveller}>
          <div className={s.grid2}>
            <Field label="Email" htmlFor="contact.email" error={errors['contact.email']}>
              <Input id="contact.email" type="email" autoComplete="email" value={draft.contact.email} onChange={(e) => setContact({ email: e.target.value })} invalid={!!errors['contact.email']} />
            </Field>
            <Field label="Mobile number" htmlFor="contact.phone" error={errors['contact.phone']} hint="For SMS & WhatsApp updates">
              <Input id="contact.phone" type="tel" autoComplete="tel-national" value={draft.contact.phone} onChange={(e) => setContact({ phone: e.target.value })} icon={<span style={{ fontSize: 14, color: 'var(--text-2)' }}>+91</span>} invalid={!!errors['contact.phone']} />
            </Field>
          </div>
          <Field label="GSTIN" htmlFor="contact.gstin" optional error={errors['contact.gstin']} hint="Add it to claim input tax credit on a business trip">
            <Input id="contact.gstin" value={draft.contact.gstin ?? ''} onChange={(e) => setContact({ gstin: e.target.value.toUpperCase() })} maxLength={15} invalid={!!errors['contact.gstin']} />
          </Field>
        </div>
      </section>
    </div>
  )
}

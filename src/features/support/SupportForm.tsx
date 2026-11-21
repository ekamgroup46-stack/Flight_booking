import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CircleCheck, Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { getErrorMessage } from '@/lib/api/errors'
import { hasErrors, isEmail, type Errors } from '@/lib/validation'
import { supportApi, type SupportTicketInput } from '@/services/support/api'
import { useAuthStore } from '@/store/auth.store'
import s from '../info/Info.module.css'

const TOPICS = ['Cancel or change a booking', 'Refund status', 'Payment issue', 'Ticket not received', 'Cargo pickup or delivery', 'Business & partnerships', 'Something else']

export function SupportForm({ defaultTopic }: { defaultTopic?: string }) {
  const user = useAuthStore((st) => st.user)
  const [form, setForm] = useState<SupportTicketInput>({ name: user?.name ?? '', email: user?.email ?? '', topic: defaultTopic ?? TOPICS[0], bookingId: '', message: '' })
  const [errors, setErrors] = useState<Errors>({})
  const submit = useMutation({ mutationFn: supportApi.createTicket })
  const set = (patch: Partial<SupportTicketInput>) => setForm((f) => ({ ...f, ...patch }))

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const err: Errors = {}
    if (!form.name.trim()) err.name = 'Tell us your name'
    if (!isEmail(form.email)) err.email = 'Enter a valid email'
    if (form.message.trim().length < 12) err.message = 'A little more detail helps us help faster'
    setErrors(err)
    if (!hasErrors(err)) submit.mutate(form)
  }

  if (submit.isSuccess)
    return (
      <div className={s.formDone} role="status">
        <CircleCheck />
        <h3>Request received · {submit.data.ticketId}</h3>
        <p>
          A specialist will reply to {form.email} within {submit.data.responseWithin}. For anything urgent, call us — the line is open 24×7.
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            submit.reset()
            set({ message: '', bookingId: '' })
          }}
        >
          Send another request
        </Button>
      </div>
    )

  return (
    <form className={s.form} onSubmit={onSubmit} noValidate>
      <div className={s.formGrid}>
        <Field label="Your name" htmlFor="sf.name" error={errors.name}>
          <Input id="sf.name" value={form.name} onChange={(e) => set({ name: e.target.value })} autoComplete="name" invalid={!!errors.name} />
        </Field>
        <Field label="Email" htmlFor="sf.email" error={errors.email}>
          <Input id="sf.email" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} autoComplete="email" invalid={!!errors.email} />
        </Field>
        <Field label="Topic" htmlFor="sf.topic">
          <Select id="sf.topic" value={form.topic} onChange={(e) => set({ topic: e.target.value })}>
            {TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <Field label="Booking ID or PNR" htmlFor="sf.booking" optional hint="Speeds things up a lot">
          <Input id="sf.booking" value={form.bookingId} onChange={(e) => set({ bookingId: e.target.value.toUpperCase() })} placeholder="e.g. EK7K2Q9MXA" />
        </Field>
      </div>
      <Field label="How can we help?" htmlFor="sf.message" error={errors.message}>
        <Textarea id="sf.message" rows={5} value={form.message} onChange={(e) => set({ message: e.target.value })} invalid={!!errors.message} />
      </Field>
      {submit.isError && <p className={s.formError}>{getErrorMessage(submit.error)}</p>}
      <div>
        <Button type="submit" variant="primary" loading={submit.isPending} iconLeft={<Send />}>
          Send request
        </Button>
      </div>
    </form>
  )
}

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Lock, Mail, Smartphone } from 'lucide-react'
import { LineBundle, Logo } from '@/components/brand/Brand'
import { Button } from '@/components/ui/Button'
import { Field, Input, Segmented } from '@/components/ui/Field'
import { ROUTES } from '@/config/routes'
import { useDocumentTitle, useNow } from '@/hooks'
import { getErrorMessage } from '@/lib/api/errors'
import { isEmail, isIndianMobile } from '@/lib/validation'
import { authApi, DEMO_OTP, type Session } from '@/services/auth/api'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/store/toast.store'
import s from './Auth.module.css'

function OtpInput({ value, onChange, invalid }: { value: string; onChange: (v: string) => void; invalid?: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => ref.current?.focus(), [])
  return (
    <label className={`${s.otp} ${invalid ? s.otpInvalid : ''}`} onClick={() => ref.current?.focus()}>
      <input
        ref={ref}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        aria-label="6-digit code"
        className={s.otpInput}
      />
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className={`${s.otpCell} ${i === value.length ? s.otpActive : ''}`} aria-hidden>
          {value[i] ?? ''}
        </span>
      ))}
    </label>
  )
}

export default function AuthPage() {
  const { pathname } = useLocation()
  const isSignup = pathname === ROUTES.signup
  useDocumentTitle(isSignup ? 'Create account' : 'Log in')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const setSession = useAuthStore((st) => st.setSession)

  const [method, setMethod] = useState<'otp' | 'email'>('otp')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [sentAt, setSentAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const now = useNow(1000)
  const resendIn = sentAt ? Math.max(0, 30 - Math.floor((now - sentAt) / 1000)) : 0

  const done = (session: Session) => {
    setSession(session)
    toast.success(isSignup ? `Welcome aboard, ${session.user.name.split(' ')[0]}` : `Welcome back, ${session.user.name.split(' ')[0]}`)
    navigate(params.get('next') ?? ROUTES.bookings, { replace: true })
  }

  const requestOtp = useMutation({ mutationFn: () => authApi.requestOtp(phone), onSuccess: () => setSentAt(Date.now()), onError: (e) => setError(getErrorMessage(e)) })
  const verify = useMutation({ mutationFn: () => authApi.verifyOtp(phone, code, isSignup ? { name, email } : undefined), onSuccess: done, onError: (e) => setError(getErrorMessage(e)) })
  const login = useMutation({ mutationFn: () => authApi.loginWithPassword(email, password), onSuccess: done, onError: (e) => setError(getErrorMessage(e)) })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (method === 'email' && !isSignup) {
      if (!isEmail(email)) return setError('Enter a valid email address.')
      return login.mutate()
    }
    if (!sentAt) {
      if (isSignup && name.trim().length < 2) return setError('Tell us your name.')
      if (isSignup && !isEmail(email)) return setError('Enter a valid email address.')
      if (!isIndianMobile(phone)) return setError('Enter a valid 10-digit mobile number.')
      return requestOtp.mutate()
    }
    if (code.length !== 6) return setError('Enter the 6-digit code.')
    verify.mutate()
  }

  const busy = requestOtp.isPending || verify.isPending || login.isPending

  return (
    <div className={s.page}>
      <div className={s.visual}>
        <img src="/images/misc/auth-lounge.webp" alt="" />
        <div className={s.visualShade} />
        <div className={s.quote}>
          <LineBundle thickness={3} gap={3} className={s.quoteBundle} />
          <p>“Flight in, cab out, train home on Sunday. Three tickets, one app, zero spreadsheets.”</p>
          <span>— How most of our travellers describe a weekend</span>
        </div>
      </div>

      <div className={s.panel}>
        <div className={s.card}>
          <Link to={ROUTES.home} className={s.logo} aria-label="Ekam home">
            <Logo size={28} />
          </Link>
          <h1 className={s.title}>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
          <p className={s.sub}>{isSignup ? 'One account for every flight, train, bus, cab and shipment.' : 'Log in to see your trips and travel faster.'}</p>

          {!isSignup && !sentAt && (
            <Segmented
              label="Login method"
              value={method}
              onChange={(m) => {
                setMethod(m)
                setError(null)
              }}
              options={[
                { value: 'otp', label: 'Mobile OTP', icon: <Smartphone /> },
                { value: 'email', label: 'Email', icon: <Mail /> },
              ]}
              className={s.methods}
            />
          )}

          <form onSubmit={submit} className={s.form} noValidate>
            {sentAt ? (
              <>
                <button type="button" className={s.backLink} onClick={() => { setSentAt(null); setCode(''); setError(null) }}>
                  <ArrowLeft size={15} /> Change number
                </button>
                <p className={s.sentTo}>
                  Enter the code sent to <strong>+91 {phone.replace(/\D/g, '').slice(-10)}</strong>
                </p>
                <OtpInput value={code} onChange={setCode} invalid={!!error} />
                <p className={s.hint}>
                  Demo mode: use <b className="mono">{DEMO_OTP}</b> ·{' '}
                  {resendIn ? (
                    `Resend in ${resendIn}s`
                  ) : (
                    <button type="button" className={s.inlineBtn} onClick={() => requestOtp.mutate()}>
                      Resend code
                    </button>
                  )}
                </p>
              </>
            ) : method === 'email' && !isSignup ? (
              <>
                <Field label="Email" htmlFor="auth.email">
                  <Input id="auth.email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail />} />
                </Field>
                <Field label="Password" htmlFor="auth.password" hint="Demo mode: any password of 6+ characters">
                  <Input id="auth.password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock />} />
                </Field>
              </>
            ) : (
              <>
                {isSignup && (
                  <>
                    <Field label="Full name" htmlFor="auth.name">
                      <Input id="auth.name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </Field>
                    <Field label="Email" htmlFor="auth.semail">
                      <Input id="auth.semail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail />} />
                    </Field>
                  </>
                )}
                <Field label="Mobile number" htmlFor="auth.phone" hint="We’ll text you a 6-digit code">
                  <Input id="auth.phone" type="tel" inputMode="tel" autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<span className={s.cc}>+91</span>} />
                </Field>
              </>
            )}

            {error && (
              <p className={s.error} role="alert">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" block loading={busy}>
              {sentAt ? 'Verify & continue' : method === 'email' && !isSignup ? 'Log in' : 'Send code'}
            </Button>
          </form>

          <p className={s.switch}>
            {isSignup ? (
              <>
                Already have an account? <Link to={ROUTES.login}>Log in</Link>
              </>
            ) : (
              <>
                New to Ekam? <Link to={ROUTES.signup}>Create an account</Link>
              </>
            )}
          </p>
          <p className={s.legal}>
            By continuing you agree to our <Link to={ROUTES.terms}>Terms</Link> and <Link to={ROUTES.privacy}>Privacy policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}

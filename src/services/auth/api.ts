import { appConfig } from '@/config/app.config'
import { ApiError } from '@/lib/api/errors'
import { http } from '@/lib/api/http'
import { createMockTable, mockResponse } from '@/lib/api/mock'
import { todayISO } from '@/lib/dates'
import { randomCode } from '@/lib/random'
import { isEmail, isIndianMobile } from '@/lib/validation'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  memberSince: string
}

export interface Session {
  user: User
  token: string
}

/** Demo OTP accepted by the mock backend. */
export const DEMO_OTP = '123456'

const users = createMockTable<User>('users')
const normalizePhone = (p: string) => p.replace(/\D/g, '').slice(-10)

function upsertUser(patch: Partial<User> & { phone?: string; email?: string }): User {
  const existing = users.all().find((u) => (patch.phone && u.phone === patch.phone) || (patch.email && u.email === patch.email))
  if (existing) return users.update(existing.id, { ...patch, name: patch.name || existing.name }) ?? existing
  return users.insert({
    id: `U${randomCode(8)}`,
    name: patch.name || 'Ekam traveller',
    email: patch.email ?? '',
    phone: patch.phone ?? '',
    memberSince: todayISO(),
  })
}

export const authApi = {
  requestOtp(phone: string): Promise<{ sentTo: string; resendIn: number }> {
    if (!isIndianMobile(phone)) return Promise.reject(new ApiError('Enter a valid 10-digit mobile number.', 422, 'INVALID_PHONE'))
    if (appConfig.api.useMocks) return mockResponse(() => ({ sentTo: normalizePhone(phone), resendIn: 30 }), { latency: [500, 900], failureRate: 0 })
    return http.post('/auth/otp', { phone })
  },

  verifyOtp(phone: string, code: string, profile?: { name?: string; email?: string }): Promise<Session> {
    if (appConfig.api.useMocks)
      return mockResponse(
        () => {
          if (code !== DEMO_OTP) throw new ApiError('That code doesn’t match. Check the SMS and try again.', 401, 'INVALID_OTP')
          const user = upsertUser({ phone: normalizePhone(phone), ...profile })
          return { user, token: `mock.${randomCode(24)}` }
        },
        { latency: [600, 1000], failureRate: 0 },
      )
    return http.post('/auth/otp/verify', { phone, code, ...profile })
  },

  loginWithPassword(email: string, password: string): Promise<Session> {
    if (appConfig.api.useMocks)
      return mockResponse(
        () => {
          if (!isEmail(email)) throw new ApiError('Enter a valid email address.', 422, 'INVALID_EMAIL')
          if (password.length < 6) throw new ApiError('Email or password is incorrect.', 401, 'INVALID_CREDENTIALS')
          const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
          const user = upsertUser({ email: email.toLowerCase(), name })
          return { user, token: `mock.${randomCode(24)}` }
        },
        { latency: [600, 1000], failureRate: 0 },
      )
    return http.post('/auth/login', { email, password })
  },
}

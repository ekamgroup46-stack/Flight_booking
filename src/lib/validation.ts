export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())

/** Indian mobile: 10 digits starting 6–9 (optionally prefixed by +91 / 0). */
export const isIndianMobile = (v: string) => /^(?:\+?91[\s-]?|0)?[6-9]\d{9}$/.test(v.replace(/\s+/g, ''))

export const isPincode = (v: string) => /^[1-9]\d{5}$/.test(v.trim())

export const isGstin = (v: string) =>
  /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v.trim().toUpperCase())

export function luhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '')
  if (digits.length < 12) return false
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i])
    if (double) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    double = !double
  }
  return sum % 10 === 0
}

export const isUpiId = (v: string) => /^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(v.trim())

export type Errors<T extends string = string> = Partial<Record<T, string>>

export function hasErrors(errors: Record<string, unknown>): boolean {
  return Object.values(errors).some(Boolean)
}

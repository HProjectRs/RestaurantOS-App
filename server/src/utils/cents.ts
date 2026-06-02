export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

export function fromCents(cents: number): number {
  return Math.round(cents) / 100
}

export function safeAdd(...amounts: number[]): number {
  const totalCents = amounts.reduce((sum, amount) => sum + toCents(amount), 0)
  return fromCents(totalCents)
}

export function safeSubtract(a: number, b: number): number {
  return fromCents(toCents(a) - toCents(b))
}

export function safeMultiply(amount: number, factor: number): number {
  return fromCents(Math.round(toCents(amount) * factor))
}

export function safeDivide(amount: number, divisor: number): number {
  if (divisor === 0) return 0
  return fromCents(Math.round(toCents(amount) / divisor))
}

export function formatMoney(amount: number, currency: string = 'SAR'): string {
  return `${Math.abs(amount).toFixed(2)} ${currency}`
}

import { describe, it, expect } from 'vitest'
import { required, email, phone, minLength, maxLength, number, positive, validateForm } from '../../utils/validators'

describe('required', () => {
  it('returns error for empty value', () => {
    expect(required(null)).toBe('الحقل مطلوب')
    expect(required(undefined)).toBe('الحقل مطلوب')
    expect(required('')).toBe('الحقل مطلوب')
    expect(required('   ')).toBe('الحقل مطلوب')
  })
  it('returns null for valid value', () => {
    expect(required('test')).toBeNull()
    expect(required(0)).toBeNull()
    expect(required(false)).toBeNull()
  })
  it('uses custom field name', () => {
    expect(required(null, 'الاسم')).toBe('الاسم مطلوب')
  })
})

describe('email', () => {
  it('returns null for empty', () => {
    expect(email('')).toBeNull()
    expect(email(null)).toBeNull()
  })
  it('validates email format', () => {
    expect(email('test@example.com')).toBeNull()
    expect(email('user@co.dz')).toBeNull()
  })
  it('invalidates bad email', () => {
    expect(email('not-email')).toBe('البريد الإلكتروني غير صالح')
    expect(email('@domain.com')).toBe('البريد الإلكتروني غير صالح')
  })
})

describe('phone', () => {
  it('returns null for empty', () => {
    expect(phone('')).toBeNull()
    expect(phone(null)).toBeNull()
  })
  it('validates Algerian mobile numbers', () => {
    expect(phone('0555123456')).toBeNull()
    expect(phone('0650123456')).toBeNull()
    expect(phone('0770123456')).toBeNull()
  })
  it('invalidates bad numbers', () => {
    expect(phone('12345')).toBe('رقم الهاتف غير صالح')
    expect(phone('0111111111')).toBe('رقم الهاتف غير صالح')
  })
})

describe('minLength', () => {
  it('returns null for empty', () => {
    expect(minLength(3)('')).toBeNull()
  })
  it('validates minimum length', () => {
    expect(minLength(3)('ab')).toBe('الحقل يجب أن يكون على الأقل 3 حروف')
    expect(minLength(3)('abc')).toBeNull()
    expect(minLength(3)('abcd')).toBeNull()
  })
})

describe('maxLength', () => {
  it('returns null for empty', () => {
    expect(maxLength(10)('')).toBeNull()
  })
  it('validates maximum length', () => {
    expect(maxLength(3)('abcd')).toBe('الحقل يجب أن يكون أقل من 3 حروف')
    expect(maxLength(3)('abc')).toBeNull()
  })
})

describe('number', () => {
  it('returns null for empty', () => {
    expect(number(null)).toBeNull()
    expect(number(undefined)).toBeNull()
    expect(number('')).toBeNull()
  })
  it('validates numbers', () => {
    expect(number(42)).toBeNull()
    expect(number('42')).toBeNull()
    expect(number('abc')).toBe('الحقل يجب أن يكون رقماً')
    expect(number('12.5')).toBeNull()
  })
})

describe('positive', () => {
  it('returns null for empty', () => {
    expect(positive(null)).toBeNull()
    expect(positive('')).toBeNull()
  })
  it('validates positive', () => {
    expect(positive(5)).toBeNull()
    expect(positive(0)).toBe('الحقل يجب أن يكون موجباً')
    expect(positive(-1)).toBe('الحقل يجب أن يكون موجباً')
    expect(positive('abc')).toBe('الحقل يجب أن يكون موجباً')
  })
})

describe('validateForm', () => {
  it('returns valid for no errors', () => {
    const rules = { name: [required] }
    const result = validateForm(rules, { name: 'test' })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })
  it('returns errors for invalid fields', () => {
    const rules = { name: [required], email: [email] }
    const result = validateForm(rules, { name: '', email: 'bad' }) as { valid: boolean; errors: { name: string; email: string } }
    expect(result.valid).toBe(false)
    expect(result.errors.name).toBe('الحقل مطلوب')
    expect(result.errors.email).toBe('البريد الإلكتروني غير صالح')
  })
  it('stops at first error per field', () => {
    const rules = { name: [required, () => 'second'] }
    const result = validateForm(rules, { name: '' }) as { valid: boolean; errors: { name: string } }
    expect(result.errors.name).toBe('الحقل مطلوب')
  })
})

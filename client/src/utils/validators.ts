export function required(value, fieldName = 'الحقل') {
  if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} مطلوب`;
  }
  return null;
}

export function email(value) {
  if (!value) return null;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(value) ? null : 'البريد الإلكتروني غير صالح';
}

export function phone(value) {
  if (!value) return null;
  const cleaned = value.replace(/\D/g, '');
  const re = /^(0[567][0-9]{8}|00213[567][0-9]{8}|213[567][0-9]{8})$/;
  return re.test(cleaned) ? null : 'رقم الهاتف غير صالح';
}

export function minLength(min) {
  return (value, fieldName = 'الحقل') => {
    if (!value) return null;
    return value.length >= min ? null : `${fieldName} يجب أن يكون على الأقل ${min} حروف`;
  };
}

export function maxLength(max) {
  return (value, fieldName = 'الحقل') => {
    if (!value) return null;
    return value.length <= max ? null : `${fieldName} يجب أن يكون أقل من ${max} حروف`;
  };
}

export function number(value, fieldName = 'الحقل') {
  if (value === undefined || value === null || value === '') return null;
  return !isNaN(Number(value)) ? null : `${fieldName} يجب أن يكون رقماً`;
}

export function positive(value, fieldName = 'الحقل') {
  if (value === undefined || value === null || value === '') return null;
  return Number(value) > 0 ? null : `${fieldName} يجب أن يكون موجباً`;
}

export function validateForm(rules, values) {
  const errors = {};
    for (const [field, fieldRules] of Object.entries<any[]>(rules)) {
    for (const rule of fieldRules) {
      const error = rule(values[field]);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

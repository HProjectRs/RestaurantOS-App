export const BASE_URL = import.meta.env.VITE_API_URL || '/api'
export const TIMEOUT = 30000

export const API = {
  BASE_URL,
  AUTH: {
    LOGIN: `${BASE_URL}/auth/login`,
    REGISTER: `${BASE_URL}/auth/register`,
    REFRESH: `${BASE_URL}/auth/refresh`,
    ME: `${BASE_URL}/auth/me`,
    PROFILE: `${BASE_URL}/auth/profile`,
    CHANGE_PASSWORD: `${BASE_URL}/auth/change-password`,
  },
  MENU: {
    CATEGORIES: `${BASE_URL}/menu/categories`,
    ITEMS: `${BASE_URL}/menu/items`,
    MODIFIERS: `${BASE_URL}/menu/modifiers`,
  },
  ORDERS: {
    BASE: `${BASE_URL}/orders`,
    ACTIVE: `${BASE_URL}/orders/active`,
    TRACK: `${BASE_URL}/orders/track`,
    CALL_WAITER: `${BASE_URL}/orders/call-waiter`,
  },
  TABLES: `${BASE_URL}/tables`,
  WIFI: {
    QR_CODES: `${BASE_URL}/wifi/qr-codes`,
    CONNECT: `${BASE_URL}/wifi/connect`,
    SESSIONS: `${BASE_URL}/wifi/sessions`,
  },
  EMPLOYEES: {
    BASE: `${BASE_URL}/employees`,
    SHIFTS: `${BASE_URL}/employees/shifts`,
    PAYROLL: `${BASE_URL}/employees/payroll`,
    CLOCK_IN: `${BASE_URL}/employees/clock-in`,
    CLOCK_OUT: `${BASE_URL}/employees/clock-out`,
    ATTENDANCE: `${BASE_URL}/employees/attendance`,
  },
  REPORTS: {
    DASHBOARD: `${BASE_URL}/reports/dashboard`,
    SALES: `${BASE_URL}/reports/sales`,
    CATEGORIES: `${BASE_URL}/reports/categories`,
    EMPLOYEES: `${BASE_URL}/reports/employees`,
    ITEMS_PERFORMANCE: `${BASE_URL}/reports/items-performance`,
    PEAK_HOURS: `${BASE_URL}/reports/peak-hours`,
    PAYMENT_METHODS: `${BASE_URL}/reports/payment-methods`,
  },
  RESERVATIONS: `${BASE_URL}/reservations`,
  SETTINGS: {
    BASE: `${BASE_URL}/settings`,
    PUBLIC: `${BASE_URL}/settings/public`,
  },
  EXPENSES: `${BASE_URL}/expenses`,
  LICENSES: `${BASE_URL}/licenses`,
  BACKUPS: `${BASE_URL}/backups`,
  INVOICES: `${BASE_URL}/invoices`,
  PAYMENTS: {
    CONFIG: `${BASE_URL}/payments/config`,
    CREATE_INTENT: `${BASE_URL}/payments/create-intent`,
  },
  SUBSCRIPTIONS: {
    PLANS: `${BASE_URL}/subscriptions/plans`,
    CURRENT: `${BASE_URL}/subscriptions/current`,
    CHECKOUT: `${BASE_URL}/subscriptions/create-checkout`,
    PORTAL: `${BASE_URL}/subscriptions/portal`,
    CANCEL: `${BASE_URL}/subscriptions/cancel`,
  },
  LOYALTY: {
    PROGRAM: `${BASE_URL}/loyalty/program`,
    CUSTOMERS: `${BASE_URL}/loyalty/customers`,
    POINTS_ADD: `${BASE_URL}/loyalty/points/add`,
    POINTS_REDEEM: `${BASE_URL}/loyalty/points/redeem`,
  },
  DELIVERY: {
    DRIVERS: `${BASE_URL}/delivery/drivers`,
    ZONES: `${BASE_URL}/delivery/zones`,
    DELIVERIES: `${BASE_URL}/delivery/deliveries`,
  },
}

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin

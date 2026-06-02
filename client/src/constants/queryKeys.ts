export const queryKeys = {
  orders: {
    all: ['orders'],
    list: (filters) => ['orders', 'list', filters],
    detail: (id) => ['orders', 'detail', id],
  },
  menu: {
    all: ['menu'],
    categories: ['menu', 'categories'],
    category: (id) => ['menu', 'category', id],
    items: (filters) => ['menu', 'items', filters],
    item: (id) => ['menu', 'item', id],
  },
  inventory: {
    all: ['inventory'],
    list: (filters) => ['inventory', 'list', filters],
    item: (id) => ['inventory', 'item', id],
    lowStock: ['inventory', 'lowStock'],
    movements: (id) => ['inventory', 'movements', id],
  },
  customers: {
    all: ['customers'],
    list: (filters) => ['customers', 'list', filters],
    detail: (id) => ['customers', 'detail', id],
  },
  employees: {
    all: ['employees'],
    list: (filters) => ['employees', 'list', filters],
    detail: (id) => ['employees', 'detail', id],
  },
  tables: {
    all: ['tables'],
    available: ['tables', 'available'],
  },
  reports: {
    sales: (filters) => ['reports', 'sales', filters],
    inventory: (filters) => ['reports', 'inventory', filters],
    financial: (filters) => ['reports', 'financial', filters],
  },
  accounting: {
    transactions: (filters) => ['accounting', 'transactions', filters],
    summary: (filters) => ['accounting', 'summary', filters],
  },
  settings: {
    all: ['settings'],
    restaurant: ['settings', 'restaurant'],
  },
};

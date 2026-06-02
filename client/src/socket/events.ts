export const ORDER_CREATED = 'order:created';
export const ORDER_UPDATED = 'order:updated';
export const KDS_UPDATE = 'kds:update';
export const TABLE_STATUS_CHANGED = 'table:status_changed';
export const STOCK_ALERT = 'stock:alert';
export const WAITER_CALLED = 'waiter:called';
export const PAYMENT_CONFIRMED = 'payment:confirmed';

const socketEvents = {
  ORDER_CREATED,
  ORDER_UPDATED,
  KDS_UPDATE,
  TABLE_STATUS_CHANGED,
  STOCK_ALERT,
  WAITER_CALLED,
  PAYMENT_CONFIRMED,
};

export default socketEvents;

import { useCallback, useMemo } from 'react';
import { usePOSStore } from '../store/posStore';
import { useSettingsStore } from '../store/settingsStore';

const TAX_RATE = 0.19;

export function usePOS() {
  const { currentOrder, heldOrders, addItem, removeItem, updateQty, setCustomer, setTable, setNotes, holdOrder, resumeOrder, clearOrder } = usePOSStore();
  const taxRate = useSettingsStore((s) => s.taxRate ?? TAX_RATE);

  const subtotal = useMemo(
    () => currentOrder.items.reduce((sum, item) => sum + item.price * item.qty, 0),
    [currentOrder.items]
  );

  const tax = useMemo(() => subtotal * taxRate, [subtotal, taxRate]);

  const total = useMemo(() => subtotal + tax - (currentOrder.discount ?? 0), [subtotal, tax, currentOrder.discount]);

  const applyDiscount = useCallback((amount) => {
    usePOSStore.setState((s) => ({
      currentOrder: { ...s.currentOrder, discount: amount },
    }));
  }, []);

  const splitBill = useCallback(
    (numParts) => {
      const perPerson = total / numParts;
      return Array.from({ length: numParts }, (_, i) => ({
        part: i + 1,
        items: [...currentOrder.items],
        total: perPerson,
      }));
    },
    [total, currentOrder.items]
  );

  return {
    items: currentOrder.items,
    customer: currentOrder.customer,
    table: currentOrder.table,
    notes: currentOrder.notes,
    discount: currentOrder.discount,
    subtotal,
    tax,
    total,
    heldOrders,
    addItem,
    removeItem,
    updateQty,
    setCustomer,
    setTable,
    setNotes,
    holdOrder,
    resumeOrder,
    clearOrder,
    applyDiscount,
    splitBill,
  };
}

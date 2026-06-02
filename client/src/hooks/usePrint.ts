import { useState, useCallback } from 'react';
import { formatReceipt, openPrintWindow } from '../utils/print';

export function usePrint(receiptData) {
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState(null);

  const print = useCallback(async (printerWidth = '80mm') => {
    setPrinting(true);
    setError(null);
    try {
      const html = formatReceipt(receiptData, printerWidth);
      openPrintWindow(html);
    } catch (err) {
      setError(err.message || 'فشلت الطباعة');
    } finally {
      setPrinting(false);
    }
  }, [receiptData]);

  return { print, printing, error };
}

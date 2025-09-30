import { useCallback } from 'react';
import { useOrdersData } from '../orders/OrdersDataContext';

export function useOrdersActionsState() {
  const { processingOrders, setProcessingOrders } = useOrdersData();

  // Idempotency guard
  const isOrderProcessing = useCallback((ordineId: string): boolean => {
    return processingOrders.has(ordineId);
  }, [processingOrders]);

  const setOrderProcessing = useCallback((ordineId: string, processing: boolean) => {
    setProcessingOrders(prev => {
      const newSet = new Set(prev);
      if (processing) {
        newSet.add(ordineId);
      } else {
        newSet.delete(ordineId);
      }
      return newSet;
    });
  }, [setProcessingOrders]);

  return {
    processingOrders,
    isOrderProcessing,
    setOrderProcessing
  };
}

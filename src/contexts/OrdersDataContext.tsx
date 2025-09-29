// refactor: context per dati ordini (puri, senza side-effects)
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Ordine } from '../types/orders';

interface OrdersDataContextType {
  ordiniInviati: Ordine[];
  ordiniStorico: Ordine[];
  loading: boolean;
  setOrdiniInviati: (ordini: Ordine[]) => void;
  setOrdiniStorico: (ordini: Ordine[]) => void;
  setLoading: (loading: boolean) => void;
}

const OrdersDataContext = createContext<OrdersDataContextType | undefined>(undefined);

export function OrdersDataProvider({ children }: { children: ReactNode }) {
  const [ordiniInviati, setOrdiniInviati] = useState<Ordine[]>([]);
  const [ordiniStorico, setOrdiniStorico] = useState<Ordine[]>([]);
  const [loading, setLoading] = useState(true);

  const value = useMemo(() => ({
    ordiniInviati,
    ordiniStorico,
    loading,
    setOrdiniInviati,
    setOrdiniStorico,
    setLoading
  }), [ordiniInviati, ordiniStorico, loading]);

  return (
    <OrdersDataContext.Provider value={value}>
      {children}
    </OrdersDataContext.Provider>
  );
}

export function useOrdersData() {
  const context = useContext(OrdersDataContext);
  if (context === undefined) {
    throw new Error('useOrdersData must be used within an OrdersDataProvider');
  }
  return context;
}

// Selectors per ridurre re-render
export function useOrdersInviati() {
  const context = useContext(OrdersDataContext);
  if (context === undefined) {
    throw new Error('useOrdersInviati must be used within an OrdersDataProvider');
  }
  return context.ordiniInviati;
}

export function useOrdersStorico() {
  const context = useContext(OrdersDataContext);
  if (context === undefined) {
    throw new Error('useOrdersStorico must be used within an OrdersDataProvider');
  }
  return context.ordiniStorico;
}

export function useOrdersLoading() {
  const context = useContext(OrdersDataContext);
  if (context === undefined) {
    throw new Error('useOrdersLoading must be used within an OrdersDataProvider');
  }
  return context.loading;
}

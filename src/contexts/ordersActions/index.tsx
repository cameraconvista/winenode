import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { OrdersActionsContextType } from './types';
import { useOrdersActionsHandlers } from './OrdersActionsHandlers';
import { useOrdersActionsConfirm } from './OrdersActionsConfirm';
import { useOrdersActionsLoader } from './OrdersActionsLoader';

const OrdersActionsContext = createContext<OrdersActionsContextType | undefined>(undefined);

export function OrdersActionsProvider({ children }: { children: ReactNode }) {
  // Import all handlers from specialized modules
  const {
    aggiungiOrdine,
    aggiornaStatoOrdine,
    aggiornaQuantitaOrdine,
    eliminaOrdineInviato,
    eliminaOrdineStorico
  } = useOrdersActionsHandlers();

  const {
    confermaRicezioneOrdine,
    confermaRicezioneOrdineConQuantita
  } = useOrdersActionsConfirm();

  const { loadOrdiniFromSupabase } = useOrdersActionsLoader();

  // Compose the context value with all actions
  const value = useMemo(() => ({
    aggiungiOrdine,
    aggiornaStatoOrdine,
    aggiornaQuantitaOrdine,
    confermaRicezioneOrdine,
    confermaRicezioneOrdineConQuantita,
    eliminaOrdineInviato,
    eliminaOrdineStorico
  }), [
    aggiungiOrdine,
    aggiornaStatoOrdine,
    aggiornaQuantitaOrdine,
    confermaRicezioneOrdine,
    confermaRicezioneOrdineConQuantita,
    eliminaOrdineInviato,
    eliminaOrdineStorico
  ]);

  return (
    <OrdersActionsContext.Provider value={value}>
      {children}
    </OrdersActionsContext.Provider>
  );
}

export function useOrdersActions() {
  const context = useContext(OrdersActionsContext);
  if (context === undefined) {
    throw new Error('useOrdersActions must be used within an OrdersActionsProvider');
  }
  return context;
}

// Re-export types for compatibility
export type { OrdersActionsContextType } from './types';

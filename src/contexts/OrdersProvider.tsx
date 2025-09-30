// refactor: orchestratore dei tre context e re-export hook pubblici (API invariata)
import React, { ReactNode, useEffect, useRef } from 'react';
import { OrdersDataProvider, useOrdersData, useOrdersInviati, useOrdersStorico, useOrdersLoading } from './OrdersDataContext';
import { OrdersActionsProvider, useOrdersActions } from './OrdersActionsContext';
import { QuantityManagementProvider, useQuantityManagement } from './QuantityManagementContext';
import { OrdiniProvider } from './OrdiniContext';

// Re-export tipi per compatibilità
export type { Ordine, OrdineDettaglio } from '../types/orders';

// Provider orchestratore che combina i tre context
export function OrdersProvider({ children }: { children: ReactNode }) {
  return (
    <OrdersDataProvider>
      <OrdersActionsProvider>
        <QuantityManagementProvider>
          <OrdiniProvider>
            <OrdersInitializer>
              {children}
            </OrdersInitializer>
          </OrdiniProvider>
        </QuantityManagementProvider>
      </OrdersActionsProvider>
    </OrdersDataProvider>
  );
}

// Componente per inizializzazione automatica
function OrdersInitializer({ children }: { children: ReactNode }) {
  const { loadOrdiniFromSupabase } = useOrdersActions();
  const hasLoadedRef = useRef(false); // hotfix: loop load guard

  useEffect(() => {
    // hotfix: loop load guard - carica solo una volta su mount
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadOrdiniFromSupabase();
    }
  }, []); // hotfix: dipendenze vuote per evitare loop

  return <>{children}</>;
}

// Hook principale che combina tutti i context (API invariata)
export function useOrdini() {
  const { ordiniInviati, ordiniStorico, loading } = useOrdersData();
  const {
    aggiungiOrdine,
    aggiornaStatoOrdine,
    aggiornaQuantitaOrdine,
    confermaRicezioneOrdine,
    confermaRicezioneOrdineConQuantita,
    eliminaOrdineInviato,
    eliminaOrdineStorico
  } = useOrdersActions();
  const {
    inizializzaQuantitaConfermate,
    aggiornaQuantitaConfermata,
    getQuantitaConfermate
  } = useQuantityManagement();

  return {
    ordiniInviati,
    ordiniStorico,
    loading,
    aggiungiOrdine,
    aggiornaStatoOrdine,
    aggiornaQuantitaOrdine,
    confermaRicezioneOrdine,
    confermaRicezioneOrdineConQuantita,
    eliminaOrdineInviato,
    eliminaOrdineStorico,
    inizializzaQuantitaConfermate,
    aggiornaQuantitaConfermata,
    getQuantitaConfermate
  };
}

// Re-export selectors per compatibilità (API invariata)
export { useOrdersInviati as useOrdiniInviati };
export { useOrdersStorico as useOrdiniStorico };
export { useOrdersLoading as useOrdiniLoading };

// Re-export actions per compatibilità
export function useOrdiniActions() {
  const {
    aggiungiOrdine,
    aggiornaStatoOrdine,
    aggiornaQuantitaOrdine,
    confermaRicezioneOrdine,
    eliminaOrdineInviato,
    eliminaOrdineStorico
  } = useOrdersActions();

  return {
    aggiungiOrdine,
    aggiornaStatoOrdine,
    aggiornaQuantitaOrdine,
    confermaRicezioneOrdine,
    eliminaOrdineInviato,
    eliminaOrdineStorico
  };
}

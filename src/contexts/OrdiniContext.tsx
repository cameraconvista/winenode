import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { 
  OrdersDataProvider, 
  QuantityManagementProvider, 
  OrdersActionsProvider,
  useOrdersData,
  useQuantityManagement,
  useOrdersActions,
  Ordine, 
  OrdineDettaglio 
} from './orders';

// Re-export per compatibilità con componenti esistenti
export type { Ordine, OrdineDettaglio };

interface OrdiniContextType {
  ordiniInviati: Ordine[];
  ordiniStorico: Ordine[];
  loading: boolean;
  aggiungiOrdine: (ordine: Omit<Ordine, 'id'>) => Promise<void>;
  aggiornaStatoOrdine: (ordineId: string, nuovoStato: Ordine['stato']) => Promise<void>;
  aggiornaQuantitaOrdine: (ordineId: string, dettagli: OrdineDettaglio[]) => void;
  confermaRicezioneOrdine: (ordineId: string) => Promise<void>;
  confermaRicezioneOrdineConQuantita: (ordineId: string, quantitaConfermate?: Record<string, number>) => Promise<void>;
  eliminaOrdineInviato: (ordineId: string) => Promise<void>;
  eliminaOrdineStorico: (ordineId: string) => Promise<void>;
  // Nuove funzioni per quantità confermate
  inizializzaQuantitaConfermate: (ordineId: string, dettagli: OrdineDettaglio[]) => void;
  aggiornaQuantitaConfermata: (ordineId: string, wineId: string, quantity: number) => void;
  getQuantitaConfermate: (ordineId: string) => Record<string, number>;
}

const OrdiniContext = createContext<OrdiniContextType | undefined>(undefined);

// Provider orchestratore che combina i tre context modulari
export function OrdiniProvider({ children }: { children: ReactNode }) {
  return (
    <OrdersDataProvider>
      <QuantityManagementProvider>
        <OrdersActionsProvider>
          <OrdiniContextProvider>
            {children}
          </OrdiniContextProvider>
        </OrdersActionsProvider>
      </QuantityManagementProvider>
    </OrdersDataProvider>
  );
}

// Provider interno che espone l'API unificata
function OrdiniContextProvider({ children }: { children: ReactNode }) {
  const { ordiniInviati, ordiniStorico, loading } = useOrdersData();
  const { 
    inizializzaQuantitaConfermate, 
    aggiornaQuantitaConfermata, 
    getQuantitaConfermate 
  } = useQuantityManagement();
  const {
    aggiungiOrdine,
    aggiornaStatoOrdine,
    aggiornaQuantitaOrdine,
    confermaRicezioneOrdine,
    confermaRicezioneOrdineConQuantita,
    eliminaOrdineInviato,
    eliminaOrdineStorico
  } = useOrdersActions();

  const value = useMemo(() => ({
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
  }), [
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
  ]);

  return (
    <OrdiniContext.Provider value={value}>
      {children}
    </OrdiniContext.Provider>
  );
}

// Hook principale - API invariata
export function useOrdini() {
  const context = useContext(OrdiniContext);
  if (context === undefined) {
    throw new Error('useOrdini must be used within an OrdiniProvider');
  }
  return context;
}

// Selectors per ridurre re-render - API invariata
export function useOrdiniInviati() {
  const context = useContext(OrdiniContext);
  if (context === undefined) {
    throw new Error('useOrdiniInviati must be used within an OrdiniProvider');
  }
  return context.ordiniInviati;
}

export function useOrdiniStorico() {
  const context = useContext(OrdiniContext);
  if (context === undefined) {
    throw new Error('useOrdiniStorico must be used within an OrdiniProvider');
  }
  return context.ordiniStorico;
}

export function useOrdiniLoading() {
  const context = useContext(OrdiniContext);
  if (context === undefined) {
    throw new Error('useOrdiniLoading must be used within an OrdiniProvider');
  }
  return context.loading;
}

export function useOrdiniActions() {
  const context = useContext(OrdiniContext);
  if (context === undefined) {
    throw new Error('useOrdiniActions must be used within an OrdiniProvider');
  }
  return useMemo(() => ({
    aggiungiOrdine: context.aggiungiOrdine,
    aggiornaStatoOrdine: context.aggiornaStatoOrdine,
    aggiornaQuantitaOrdine: context.aggiornaQuantitaOrdine,
    confermaRicezioneOrdine: context.confermaRicezioneOrdine,
    confermaRicezioneOrdineConQuantita: context.confermaRicezioneOrdineConQuantita,
    eliminaOrdineInviato: context.eliminaOrdineInviato,
    eliminaOrdineStorico: context.eliminaOrdineStorico
  }), [
    context.aggiungiOrdine,
    context.aggiornaStatoOrdine,
    context.aggiornaQuantitaOrdine,
    context.confermaRicezioneOrdine,
    context.confermaRicezioneOrdineConQuantita,
    context.eliminaOrdineInviato,
    context.eliminaOrdineStorico
  ]);
}

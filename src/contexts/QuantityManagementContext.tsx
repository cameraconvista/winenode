// refactor: context per gestione quantità transient, isolato
import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { OrdineDettaglio } from '../types/orders';

interface QuantityManagementContextType {
  quantitaConfermate: Record<string, Record<string, number>>;
  inizializzaQuantitaConfermate: (ordineId: string, dettagli: OrdineDettaglio[]) => void;
  aggiornaQuantitaConfermata: (ordineId: string, wineId: string, quantity: number) => void;
  getQuantitaConfermate: (ordineId: string) => Record<string, number>;
  resetQuantitaConfermate: (ordineId: string) => void;
}

const QuantityManagementContext = createContext<QuantityManagementContextType | undefined>(undefined);

export function QuantityManagementProvider({ children }: { children: ReactNode }) {
  // Draft state per quantità confermate (single source of truth)
  const [quantitaConfermate, setQuantitaConfermate] = useState<Record<string, Record<string, number>>>({});

  // Inizializza quantità confermate per un ordine
  const inizializzaQuantitaConfermate = useCallback((ordineId: string, dettagli: OrdineDettaglio[]) => {
    const quantitaInitiali: Record<string, number> = {};
    dettagli.forEach(item => {
      quantitaInitiali[item.wineId] = item.quantity;
    });
    setQuantitaConfermate(prev => ({
      ...prev,
      [ordineId]: quantitaInitiali
    }));
  }, []);

  // Aggiorna quantità confermata per un prodotto specifico
  const aggiornaQuantitaConfermata = useCallback((ordineId: string, wineId: string, quantity: number) => {
    setQuantitaConfermate(prev => ({
      ...prev,
      [ordineId]: {
        ...prev[ordineId],
        [wineId]: quantity
      }
    }));
  }, []);

  // Ottieni quantità confermate per un ordine
  const getQuantitaConfermate = useCallback((ordineId: string): Record<string, number> => {
    return quantitaConfermate[ordineId] || {};
  }, [quantitaConfermate]);

  // Reset quantità confermate per un ordine
  const resetQuantitaConfermate = useCallback((ordineId: string) => {
    setQuantitaConfermate(prev => {
      const newState = { ...prev };
      delete newState[ordineId];
      return newState;
    });
  }, []);

  const value = useMemo(() => ({
    quantitaConfermate,
    inizializzaQuantitaConfermate,
    aggiornaQuantitaConfermata,
    getQuantitaConfermate,
    resetQuantitaConfermate
  }), [
    quantitaConfermate,
    inizializzaQuantitaConfermate,
    aggiornaQuantitaConfermata,
    getQuantitaConfermate,
    resetQuantitaConfermate
  ]);

  return (
    <QuantityManagementContext.Provider value={value}>
      {children}
    </QuantityManagementContext.Provider>
  );
}

export function useQuantityManagement() {
  const context = useContext(QuantityManagementContext);
  if (context === undefined) {
    throw new Error('useQuantityManagement must be used within a QuantityManagementProvider');
  }
  return context;
}

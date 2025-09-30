import React, { createContext, useContext, useState, ReactNode } from 'react';
import { OrdineDettaglio } from '../../services/ordiniService';

interface QuantityManagementContextType {
  inizializzaQuantitaConfermate: (ordineId: string, dettagli: OrdineDettaglio[]) => void;
  aggiornaQuantitaConfermata: (ordineId: string, wineId: string, quantity: number) => void;
  getQuantitaConfermate: (ordineId: string) => Record<string, number>;
}

const QuantityManagementContext = createContext<QuantityManagementContextType | undefined>(undefined);

export function QuantityManagementProvider({ children }: { children: ReactNode }) {
  // Draft state per quantità confermate (single source of truth)
  const [quantitaConfermate, setQuantitaConfermate] = useState<Record<string, Record<string, number>>>({});
  
  // Inizializza quantità confermate per un ordine
  const inizializzaQuantitaConfermate = (ordineId: string, dettagli: OrdineDettaglio[]) => {
    const quantitaInitiali: Record<string, number> = {};
    dettagli.forEach(item => {
      quantitaInitiali[item.wineId] = item.quantity;
    });
    setQuantitaConfermate(prev => ({
      ...prev,
      [ordineId]: quantitaInitiali
    }));
  };
  
  // Aggiorna quantità confermata per un prodotto specifico
  const aggiornaQuantitaConfermata = (ordineId: string, wineId: string, quantity: number) => {
    setQuantitaConfermate(prev => ({
      ...prev,
      [ordineId]: {
        ...prev[ordineId],
        [wineId]: quantity
      }
    }));
  };
  
  // Ottieni quantità confermate per un ordine
  const getQuantitaConfermate = (ordineId: string): Record<string, number> => {
    return quantitaConfermate[ordineId] || {};
  };

  return (
    <QuantityManagementContext.Provider value={{
      inizializzaQuantitaConfermate,
      aggiornaQuantitaConfermata,
      getQuantitaConfermate
    }}>
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

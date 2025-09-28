import { useState, useEffect } from 'react';
import { ordiniService, Ordine, OrdineDettaglio } from '../services/ordiniService';
export function useSupabaseOrdini() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carica tutti gli ordini dal database
  const loadOrdini = async (): Promise<{
    inviati: Ordine[];
    storico: Ordine[];
  }> => {
    try {
      setLoading(true);
      setError(null);

      const result = await ordiniService.loadOrdini();
      return result;
    } catch (error) {
      console.error('❌ Errore caricamento ordini:', error);
      setError(error instanceof Error ? error.message : 'Errore sconosciuto');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const salvaOrdine = async (ordine: Omit<Ordine, 'id'>): Promise<string | null> => {
    try {
      const ordineId = await ordiniService.createOrdine(ordine);
      return ordineId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore salvataggio';
      console.error('❌ Errore salvataggio ordine:', errorMessage);
      setError(errorMessage);
      return null;
    }
  };

  // Aggiorna stato ordine
  const aggiornaStatoOrdine = async (ordineId: string, nuovoStato: Ordine['stato']): Promise<boolean> => {
    try {
      await ordiniService.updateStatoOrdine(ordineId, nuovoStato);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore aggiornamento';
      console.error('❌ Errore aggiornamento stato:', errorMessage);
      setError(errorMessage);
      return false;
    }
  };

  // Elimina ordine
  const eliminaOrdine = async (ordineId: string): Promise<boolean> => {
    try {
      await ordiniService.deleteOrdine(ordineId);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore eliminazione';
      console.error('❌ Errore eliminazione ordine:', errorMessage);
      setError(errorMessage);
      return false;
    }
  };

  return {
    loading,
    error,
    loadOrdini,
    salvaOrdine,
    aggiornaStatoOrdine,
    eliminaOrdine
  };
}

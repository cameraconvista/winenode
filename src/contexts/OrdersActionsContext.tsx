// refactor: context per azioni ordini (fetch/update, side-effects)
import React, { createContext, useContext, useCallback, useState, ReactNode, useMemo, useRef } from 'react';
import { useSupabaseOrdini } from '../hooks/useSupabaseOrdini';
import { isFeatureEnabled } from '../config/featureFlags';
import { useWines } from '../hooks/useWines';
import { Ordine, OrdineDettaglio } from '../types/orders';
import { useOrdersData } from './OrdersDataContext';

interface OrdersActionsContextType {
  aggiungiOrdine: (ordine: Omit<Ordine, 'id'>) => Promise<void>;
  aggiornaStatoOrdine: (ordineId: string, nuovoStato: Ordine['stato']) => Promise<void>;
  aggiornaQuantitaOrdine: (ordineId: string, dettagli: OrdineDettaglio[]) => void;
  confermaRicezioneOrdine: (ordineId: string) => Promise<void>;
  confermaRicezioneOrdineConQuantita: (ordineId: string, quantitaConfermate?: Record<string, number>) => Promise<void>;
  eliminaOrdineInviato: (ordineId: string) => Promise<void>;
  eliminaOrdineStorico: (ordineId: string) => Promise<void>;
  loadOrdiniFromSupabase: () => Promise<void>;
  processingOrders: Set<string>;
}

const OrdersActionsContext = createContext<OrdersActionsContextType | undefined>(undefined);

export function OrdersActionsProvider({ children }: { children: ReactNode }) {
  const { ordiniInviati, setOrdiniInviati, setOrdiniStorico, setLoading } = useOrdersData();
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  
  const supabaseOrdini = useSupabaseOrdini();
  const { wines, updateWineInventory } = useWines();

  // hotfix: loop load guard - throttle audit logging
  const lastAuditTimeRef = useRef<Record<string, number>>({});
  
  // Audit trail function
  const logAuditEvent = useCallback((action: string, ordineId: string, details: any) => {
    if (isFeatureEnabled('AUDIT_LOGS')) {
      const now = Date.now();
      const key = `${action}_${ordineId}`;
      const lastTime = lastAuditTimeRef.current[key] || 0;
      
      // hotfix: loop load guard - throttle a 1000ms per evitare spam
      if (now - lastTime < 1000) {
        return;
      }
      
      lastAuditTimeRef.current[key] = now;
      
      const auditEntry = {
        timestamp: new Date().toISOString(),
        action,
        ordineId,
        details,
        user: 'current_user' // TODO: get from auth context
      };
      console.log('📋 AUDIT:', auditEntry);
      // TODO: Save to audit table in database
    }
  }, []);

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
  }, []);

  const loadOrdiniFromSupabase = useCallback(async () => {
    try {
      setLoading(true);
      const result = await supabaseOrdini.loadOrdini();
      
      setOrdiniInviati(result.inviati);
      setOrdiniStorico(result.storico);
      
      logAuditEvent('LOAD_ORDINI', 'system', { 
        inviatiCount: result.inviati.length, 
        storicoCount: result.storico.length 
      });
    } catch (error) {
      console.error('❌ Errore nel caricamento ordini:', error);
      logAuditEvent('LOAD_ORDINI_ERROR', 'system', { error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  }, [supabaseOrdini, setOrdiniInviati, setOrdiniStorico, setLoading, logAuditEvent]);

  const aggiungiOrdine = useCallback(async (ordine: Omit<Ordine, 'id'>) => {
    try {
      logAuditEvent('ADD_ORDINE_START', 'new', ordine);
      const ordineId = await supabaseOrdini.salvaOrdine(ordine);
      if (!ordineId) throw new Error('Errore nella creazione ordine');
      
      // Ricarica gli ordini per ottenere l'ordine completo
      await loadOrdiniFromSupabase();
      logAuditEvent('ADD_ORDINE_SUCCESS', ordineId, { ordineId });
    } catch (error) {
      console.error('❌ Errore nell\'aggiunta ordine:', error);
      logAuditEvent('ADD_ORDINE_ERROR', 'new', { error: error.message });
      throw error;
    }
  }, [supabaseOrdini, setOrdiniInviati, logAuditEvent]);

  const aggiornaStatoOrdine = useCallback(async (ordineId: string, nuovoStato: Ordine['stato']) => {
    if (isOrderProcessing(ordineId)) {
      console.warn('⚠️ Ordine già in elaborazione:', ordineId);
      return;
    }

    try {
      setOrderProcessing(ordineId, true);
      logAuditEvent('UPDATE_STATO_START', ordineId, { nuovoStato });
      
      await supabaseOrdini.aggiornaStatoOrdine(ordineId, nuovoStato);
      
      // Ricarica gli ordini per aggiornare lo stato
      await loadOrdiniFromSupabase();
      
      logAuditEvent('UPDATE_STATO_SUCCESS', ordineId, { nuovoStato });
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento stato ordine:', error);
      logAuditEvent('UPDATE_STATO_ERROR', ordineId, { error: error.message });
      throw error;
    } finally {
      setOrderProcessing(ordineId, false);
    }
  }, [supabaseOrdini, loadOrdiniFromSupabase, isOrderProcessing, setOrderProcessing, logAuditEvent]);

  const aggiornaQuantitaOrdine = useCallback((ordineId: string, dettagli: OrdineDettaglio[]) => {
    logAuditEvent('UPDATE_QUANTITY_LOCAL', ordineId, { dettagli });
    
    const updatedOrdini = ordiniInviati.map(ordine => 
      ordine.id === ordineId 
        ? { 
            ...ordine, 
            dettagli,
            totale: dettagli.reduce((sum, d) => sum + d.totalPrice, 0)
          }
        : ordine
    );
    setOrdiniInviati(updatedOrdini);
  }, [ordiniInviati, setOrdiniInviati, logAuditEvent]);

  const confermaRicezioneOrdine = useCallback(async (ordineId: string) => {
    if (isOrderProcessing(ordineId)) {
      console.warn('⚠️ Ordine già in elaborazione:', ordineId);
      return;
    }

    try {
      setOrderProcessing(ordineId, true);
      logAuditEvent('CONFIRM_RECEPTION_START', ordineId, {});

      // Aggiorna stato a archiviato (completato non esiste nel tipo)
      await supabaseOrdini.aggiornaStatoOrdine(ordineId, 'archiviato');

      // Se abilitato, aggiorna le giacenze
      if (isFeatureEnabled('ORDINI_CONFIRM_IN_CREATI')) {
        // TODO: Implementare aggiornamento giacenze quando disponibile l'ordine
        console.log('Aggiornamento giacenze da implementare');
      }

      // Ricarica gli ordini
      await loadOrdiniFromSupabase();
      
      logAuditEvent('CONFIRM_RECEPTION_SUCCESS', ordineId, {});
    } catch (error) {
      console.error('❌ Errore nella conferma ricezione:', error);
      logAuditEvent('CONFIRM_RECEPTION_ERROR', ordineId, { error: error.message });
      throw error;
    } finally {
      setOrderProcessing(ordineId, false);
    }
  }, [supabaseOrdini, wines, updateWineInventory, loadOrdiniFromSupabase, isOrderProcessing, setOrderProcessing, logAuditEvent]);

  // FIX: Nuova funzione per conferma con quantità modificate (operazione atomica)
  const confermaRicezioneOrdineConQuantita = useCallback(async (ordineId: string, quantitaConfermate?: Record<string, number>) => {
    if (isOrderProcessing(ordineId)) {
      console.warn('⚠️ Ordine già in elaborazione:', ordineId);
      return;
    }

    try {
      setOrderProcessing(ordineId, true);
      logAuditEvent('CONFIRM_RECEPTION_WITH_QUANTITIES_START', ordineId, { quantitaConfermate });

      // Trova l'ordine corrente
      const ordine = ordiniInviati.find(o => o.id === ordineId);
      if (!ordine?.dettagli) {
        throw new Error('Ordine non trovato o senza dettagli');
      }

      // Se non ci sono quantità modificate, usa la funzione standard
      if (!quantitaConfermate || Object.keys(quantitaConfermate).length === 0) {
        await confermaRicezioneOrdine(ordineId);
        return;
      }

      // Usa l'operazione atomica per applicare quantità e archiviare
      await supabaseOrdini.archiveOrdineWithAppliedQuantities({
        ordineId,
        quantitaConfermate,
        contenutoCorrente: ordine.dettagli
      });

      // Se abilitato, aggiorna le giacenze
      if (isFeatureEnabled('ORDINI_CONFIRM_IN_CREATI')) {
        // TODO: Implementare aggiornamento giacenze quando disponibile l'ordine
        console.log('Aggiornamento giacenze da implementare');
      }

      // Ricarica gli ordini
      await loadOrdiniFromSupabase();
      
      logAuditEvent('CONFIRM_RECEPTION_WITH_QUANTITIES_SUCCESS', ordineId, { quantitaConfermate });
    } catch (error) {
      console.error('❌ Errore nella conferma ricezione con quantità:', error);
      logAuditEvent('CONFIRM_RECEPTION_WITH_QUANTITIES_ERROR', ordineId, { error: error.message });
      throw error;
    } finally {
      setOrderProcessing(ordineId, false);
    }
  }, [supabaseOrdini, ordiniInviati, confermaRicezioneOrdine, loadOrdiniFromSupabase, isOrderProcessing, setOrderProcessing, logAuditEvent]);

  const eliminaOrdineInviato = useCallback(async (ordineId: string) => {
    try {
      logAuditEvent('DELETE_INVIATO_START', ordineId, {});
      await supabaseOrdini.eliminaOrdine(ordineId);
      
      await loadOrdiniFromSupabase();
      logAuditEvent('DELETE_INVIATO_SUCCESS', ordineId, {});
    } catch (error) {
      console.error('❌ Errore nell\'eliminazione ordine inviato:', error);
      logAuditEvent('DELETE_INVIATO_ERROR', ordineId, { error: error.message });
      throw error;
    }
  }, [supabaseOrdini, loadOrdiniFromSupabase, logAuditEvent]); // hotfix: loop load guard - usa loadOrdiniFromSupabase invece di setter

  const eliminaOrdineStorico = useCallback(async (ordineId: string) => {
    try {
      logAuditEvent('DELETE_STORICO_START', ordineId, {});
      await supabaseOrdini.eliminaOrdine(ordineId);
      
      await loadOrdiniFromSupabase();
      logAuditEvent('DELETE_STORICO_SUCCESS', ordineId, {});
    } catch (error) {
      console.error('❌ Errore nell\'eliminazione ordine storico:', error);
      logAuditEvent('DELETE_STORICO_ERROR', ordineId, { error: error.message });
      throw error;
    }
  }, [supabaseOrdini, loadOrdiniFromSupabase, logAuditEvent]); // hotfix: loop load guard - usa loadOrdiniFromSupabase invece di setter

  const value = useMemo(() => ({
    aggiungiOrdine,
    aggiornaStatoOrdine,
    aggiornaQuantitaOrdine,
    confermaRicezioneOrdine,
    confermaRicezioneOrdineConQuantita,
    eliminaOrdineInviato,
    eliminaOrdineStorico,
    loadOrdiniFromSupabase,
    processingOrders
  }), [
    aggiungiOrdine,
    aggiornaStatoOrdine,
    aggiornaQuantitaOrdine,
    confermaRicezioneOrdine,
    confermaRicezioneOrdineConQuantita,
    eliminaOrdineInviato,
    eliminaOrdineStorico,
    loadOrdiniFromSupabase,
    processingOrders
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

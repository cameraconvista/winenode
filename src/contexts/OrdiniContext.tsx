import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabaseOrdini } from '../hooks/useSupabaseOrdini';
import { isFeatureEnabled } from '../config/featureFlags';
import useWines from '../hooks/useWines';

export interface OrdineDettaglio {
  wineId: string;
  wineName: string;
  quantity: number;
  unit: 'bottiglie' | 'cartoni';
  unitPrice: number;
  totalPrice: number;
}

export interface Ordine {
  id: string;
  fornitore: string;
  totale: number;
  bottiglie: number;
  data: string;
  stato: 'sospeso' | 'inviato' | 'ricevuto' | 'archiviato'; // Stati validi database Supabase
  tipo: 'inviato' | 'ricevuto';
  dettagli?: OrdineDettaglio[];
}

interface OrdiniContextType {
  ordiniInviati: Ordine[];
  ordiniRicevuti: Ordine[];
  ordiniStorico: Ordine[];
  loading: boolean;
  aggiungiOrdine: (ordine: Omit<Ordine, 'id'>) => Promise<void>;
  aggiornaStatoOrdine: (ordineId: string, nuovoStato: Ordine['stato']) => Promise<void>;
  spostaOrdineInviatiARicevuti: (ordineId: string) => void;
  aggiornaQuantitaOrdine: (ordineId: string, dettagli: OrdineDettaglio[]) => void;
  confermaRicezioneOrdine: (ordineId: string) => Promise<void>;
  eliminaOrdineInviato: (ordineId: string) => Promise<void>;
  eliminaOrdineRicevuto: (ordineId: string) => Promise<void>;
  eliminaOrdineStorico: (ordineId: string) => Promise<void>;
}

const OrdiniContext = createContext<OrdiniContextType | undefined>(undefined);
export function OrdiniProvider({ children }: { children: ReactNode }) {
  const [ordiniInviati, setOrdiniInviati] = useState<Ordine[]>([]);
  const [ordiniRicevuti, setOrdiniRicevuti] = useState<Ordine[]>([]);
  const [ordiniStorico, setOrdiniStorico] = useState<Ordine[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  
  const supabaseOrdini = useSupabaseOrdini();
  const { wines, updateWineInventory } = useWines();

  // Audit trail function
  const logAuditEvent = (action: string, ordineId: string, details: any) => {
    if (isFeatureEnabled('AUDIT_LOGS')) {
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
  };

  // Idempotency guard
  const isOrderProcessing = (ordineId: string): boolean => {
    return processingOrders.has(ordineId);
  };

  const setOrderProcessing = (ordineId: string, processing: boolean) => {
    setProcessingOrders(prev => {
      const newSet = new Set(prev);
      if (processing) {
        newSet.add(ordineId);
      } else {
        newSet.delete(ordineId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const loadOrdiniFromSupabase = async () => {
      try {
        setLoading(true);
        console.log('🔄 Caricando ordini da Supabase...');
        const { inviati, ricevuti, storico } = await supabaseOrdini.loadOrdini();
        
        setOrdiniInviati(inviati);
        setOrdiniRicevuti(ricevuti);
        setOrdiniStorico(storico);
        
        console.log('✅ Ordini caricati:', {
          inviati: inviati.length,
          ricevuti: ricevuti.length,
          storico: storico.length
        });
      } catch (error) {
        console.error('❌ Errore caricamento ordini nel context:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrdiniFromSupabase();
  }, []);

  const aggiungiOrdine = async (ordine: Omit<Ordine, 'id'>) => {
    console.log('💾 Salvando ordine in Supabase:', ordine);

    const ordineId = await supabaseOrdini.salvaOrdine(ordine);
    
    if (ordineId) {
      const nuovoOrdine: Ordine = {
        ...ordine,
        id: ordineId
      };

      // Verifica che l'ordine non esista già prima di aggiungerlo
      if (ordine.tipo === 'inviato') {
        setOrdiniInviati(prev => {
          const exists = prev.some(o => o.id === ordineId);
          if (exists) {
            console.log('⚠️ Ordine già presente, evito duplicazione:', ordineId);
            return prev;
          }
          return [nuovoOrdine, ...prev];
        });
      } else {
        setOrdiniRicevuti(prev => {
          const exists = prev.some(o => o.id === ordineId);
          if (exists) {
            console.log('⚠️ Ordine già presente, evito duplicazione:', ordineId);
            return prev;
          }
          return [nuovoOrdine, ...prev];
        });
      }
      
      console.log('✅ Ordine salvato e aggiunto al context:', ordineId);
    } else {
      console.error('❌ Errore salvataggio ordine');
    }
  };

  const aggiornaStatoOrdine = async (ordineId: string, nuovoStato: Ordine['stato']) => {
    console.log('🔄 Aggiornando stato ordine in Supabase:', ordineId, '→', nuovoStato);
    
    const success = await supabaseOrdini.aggiornaStatoOrdine(ordineId, nuovoStato);
    
    if (success) {
      const aggiorna = (ordini: Ordine[]) =>
        ordini.map(ordine =>
          ordine.id === ordineId ? { ...ordine, stato: nuovoStato } : ordine
        );

      setOrdiniInviati(aggiorna);
      setOrdiniRicevuti(aggiorna);
      setOrdiniStorico(aggiorna);
      
      console.log('✅ Stato ordine aggiornato nel context');
    }
  };

  const spostaOrdineInviatiARicevuti = async (ordineId: string) => {
    console.log('🔄 Spostando ordine da Inviati a Ricevuti:', ordineId);
    
    // Aggiorna lo stato nel database prima di spostare nel context
    const success = await supabaseOrdini.aggiornaStatoOrdine(ordineId, 'ricevuto');
    
    if (success) {
      setOrdiniInviati(prev => {
        const ordine = prev.find(o => o.id === ordineId);
        if (!ordine) return prev;
        
        // Sposta l'ordine nei ricevuti con stato aggiornato
        const ordineRicevuto: Ordine = {
          ...ordine,
          stato: 'ricevuto'
        };
        
        setOrdiniRicevuti(prevRicevuti => {
          // Controlla se l'ordine esiste già nei ricevuti per evitare duplicazioni
          const exists = prevRicevuti.some(o => o.id === ordineId);
          if (exists) {
            console.log('⚠️ Ordine già presente nei ricevuti, evito duplicazione:', ordineId);
            return prevRicevuti;
          }
          return [ordineRicevuto, ...prevRicevuti];
        });
        
        // Rimuovi dai inviati
        return prev.filter(o => o.id !== ordineId);
      });
    }
  };

  const aggiornaQuantitaOrdine = (ordineId: string, dettagli: OrdineDettaglio[]) => {
    console.log('📝 Aggiornando quantità ordine:', ordineId, dettagli);
    
    const nuoveTotali = dettagli.reduce((acc, item) => ({
      bottiglie: acc.bottiglie + (item.quantity * (item.unit === 'cartoni' ? 6 : 1)),
      totale: acc.totale + item.totalPrice
    }), { bottiglie: 0, totale: 0 });

    // Aggiorna ordiniInviati (per Gestione Ordini)
    setOrdiniInviati(prev =>
      prev.map(ordine =>
        ordine.id === ordineId
          ? {
              ...ordine,
              dettagli,
              bottiglie: nuoveTotali.bottiglie,
              totale: nuoveTotali.totale
            }
          : ordine
      )
    );

    // Aggiorna anche ordiniRicevuti (per compatibilità)
    setOrdiniRicevuti(prev =>
      prev.map(ordine =>
        ordine.id === ordineId
          ? {
              ...ordine,
              dettagli,
              bottiglie: nuoveTotali.bottiglie,
              totale: nuoveTotali.totale
            }
          : ordine
      )
    );
  };

  const confermaRicezioneOrdine = async (ordineId: string) => {
    console.log('✅ Confermando ricezione ordine:', ordineId);
    
    // Idempotency guard - previene doppi click
    if (isFeatureEnabled('IDEMPOTENCY_GUARD') && isOrderProcessing(ordineId)) {
      console.log('⚠️ Ordine già in elaborazione, ignoro richiesta duplicata:', ordineId);
      return;
    }

    // Audit trail - start
    logAuditEvent('CONFERMA_RICEZIONE_START', ordineId, { timestamp: Date.now() });

    try {
      // Set processing flag
      if (isFeatureEnabled('IDEMPOTENCY_GUARD')) {
        setOrderProcessing(ordineId, true);
      }

      // Atomic transaction simulation
      if (isFeatureEnabled('INVENTORY_TX')) {
        console.log('🔒 Inizio transazione atomica per ordine:', ordineId);
      }

      // Trova l'ordine prima di aggiornare lo stato (cerca in entrambe le liste)
      const ordineInviato = ordiniInviati.find(o => o.id === ordineId);
      const ordineRicevuto = ordiniRicevuti.find(o => o.id === ordineId);
      const ordine = ordineInviato || ordineRicevuto;
      
      if (!ordine) {
        logAuditEvent('CONFERMA_RICEZIONE_ERROR', ordineId, { error: 'Ordine non trovato' });
        return;
      }

      // AGGIORNA LE GIACENZE REALI DEI VINI PRIMA DI ARCHIVIARE
      if (ordine.dettagli) {
        console.log('📦 Aggiornamento giacenze per ordine:', ordine);
        
        // Aggiorna le giacenze per ogni vino nell'ordine
        for (const item of ordine.dettagli) {
          const currentWine = wines.find(w => w.id === item.wineId);
          if (currentWine) {
            const currentInventory = currentWine.inventory || 0;
            const bottlesToAdd = item.quantity * (item.unit === 'cartoni' ? 6 : 1);
            const newInventory = currentInventory + bottlesToAdd;
            
            console.log(`📦 ${item.wineName}: ${currentInventory} + ${bottlesToAdd} = ${newInventory}`);
            
            // Aggiorna la giacenza nel database
            await updateWineInventory(item.wineId, newInventory);
          }
        }
        
        // Log delle quantità per audit
        const inventoryChanges = ordine.dettagli?.map(item => {
          const currentWine = wines.find(w => w.id === item.wineId);
          const currentInventory = currentWine?.inventory || 0;
          const bottlesToAdd = item.quantity * (item.unit === 'cartoni' ? 6 : 1);
          return {
            wineId: item.wineId,
            wineName: item.wineName,
            quantityBefore: currentInventory,
            quantityAfter: currentInventory + bottlesToAdd,
            delta: bottlesToAdd
          };
        }) || [];

        logAuditEvent('INVENTORY_UPDATE', ordineId, { 
          changes: inventoryChanges,
          totalBottiglie: ordine.bottiglie,
          totalValue: ordine.totale
        });
      }

      // Aggiorna lo stato nel database
      const success = await supabaseOrdini.aggiornaStatoOrdine(ordineId, 'archiviato');
      
      if (success) {
        // Crea l'ordine completato
        const ordineCompletato: Ordine = {
          ...ordine,
          stato: 'archiviato' // Stato finale per ordini completati
        };
        
        // Aggiungi allo storico (archiviati)
        setOrdiniStorico(prevStorico => {
          // Controlla se l'ordine esiste già nello storico per evitare duplicazioni
          const exists = prevStorico.some(o => o.id === ordineId);
          if (exists) {
            console.log('⚠️ Ordine già presente nello storico, evito duplicazione:', ordineId);
            logAuditEvent('CONFERMA_RICEZIONE_DUPLICATE', ordineId, { warning: 'Ordine già archiviato' });
            return prevStorico;
          }
          return [ordineCompletato, ...prevStorico];
        });
        
        // Rimuovi dalla lista di origine (inviati o ricevuti)
        if (ordineInviato) {
          setOrdiniInviati(prev => prev.filter(o => o.id !== ordineId));
          console.log('📤 Ordine rimosso da inviati e spostato in archiviati:', ordineId);
        } else if (ordineRicevuto) {
          setOrdiniRicevuti(prev => prev.filter(o => o.id !== ordineId));
          console.log('📦 Ordine rimosso da ricevuti e spostato in archiviati:', ordineId);
        }
        
        // Audit trail - success
        logAuditEvent('CONFERMA_RICEZIONE_SUCCESS', ordineId, { 
          finalState: 'archiviato',
          movedToStorico: true,
          sourceList: ordineInviato ? 'inviati' : 'ricevuti',
          processingTime: Date.now()
        });

        if (isFeatureEnabled('INVENTORY_TX')) {
          console.log('✅ Transazione atomica completata per ordine:', ordineId);
        }
      } else {
        logAuditEvent('CONFERMA_RICEZIONE_ERROR', ordineId, { error: 'Aggiornamento database fallito' });
      }
    } catch (error) {
      console.error('❌ Errore durante conferma ricezione:', error);
      logAuditEvent('CONFERMA_RICEZIONE_ERROR', ordineId, { error: error.message });
    } finally {
      // Clear processing flag
      if (isFeatureEnabled('IDEMPOTENCY_GUARD')) {
        setOrderProcessing(ordineId, false);
      }
    }
  };

  const eliminaOrdineInviato = async (ordineId: string) => {
    console.log('🗑️ Eliminando ordine inviato da Supabase:', ordineId);
    
    const success = await supabaseOrdini.eliminaOrdine(ordineId);
    
    if (success) {
      setOrdiniInviati(prev => {
        const ordine = prev.find(o => o.id === ordineId);
        if (ordine) {
          console.log('📋 Ordine inviato eliminato:', ordine.fornitore, '- €' + ordine.totale.toFixed(2));
        }
        return prev.filter(o => o.id !== ordineId);
      });
    }
  };

  const eliminaOrdineRicevuto = async (ordineId: string) => {
    console.log('🗑️ Eliminando ordine ricevuto da Supabase:', ordineId);
    
    const success = await supabaseOrdini.eliminaOrdine(ordineId);
    
    if (success) {
      setOrdiniRicevuti(prev => {
        const ordine = prev.find(o => o.id === ordineId);
        if (ordine) {
          console.log('📋 Ordine ricevuto eliminato:', ordine.fornitore, '- €' + ordine.totale.toFixed(2));
        }
        return prev.filter(o => o.id !== ordineId);
      });
    }
  };

  const eliminaOrdineStorico = async (ordineId: string) => {
    console.log('🗑️ Eliminando ordine storico da Supabase:', ordineId);
    
    const success = await supabaseOrdini.eliminaOrdine(ordineId);
    
    if (success) {
      setOrdiniStorico(prev => {
        const ordine = prev.find(o => o.id === ordineId);
        if (ordine) {
          console.log('📋 Ordine storico eliminato:', ordine.fornitore, '- €' + ordine.totale.toFixed(2));
        }
        return prev.filter(o => o.id !== ordineId);
      });
    }
  };

  return (
    <OrdiniContext.Provider value={{
      ordiniInviati,
      ordiniRicevuti,
      ordiniStorico,
      loading,
      aggiungiOrdine,
      aggiornaStatoOrdine,
      spostaOrdineInviatiARicevuti,
      aggiornaQuantitaOrdine,
      confermaRicezioneOrdine,
      eliminaOrdineInviato,
      eliminaOrdineRicevuto,
      eliminaOrdineStorico
    }}>
      {children}
    </OrdiniContext.Provider>
  );
}

export function useOrdini() {
  const context = useContext(OrdiniContext);
  if (context === undefined) {
    throw new Error('useOrdini must be used within an OrdiniProvider');
  }
  return context;
}

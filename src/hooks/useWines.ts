import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { supabaseGuarded } from '../services/supabaseGuard';
import { useRealtimeGiacenza } from './useRealtimeGiacenza';

export interface WineType {
  id: string;
  name: string;
  type: string;
  supplier: string;
  inventory: number;
  minStock: number;
  price: string;
  cost?: number;
  vintage: string | null;
  region: string | null;
  description: string | null;
  // Campi per optimistic locking con PK giacenza
  giacenza_id?: string;
  inventoryVersion?: number;
  inventoryUpdatedAt?: string;
}

const useWines = () => {
  const [wines, setWines] = useState<WineType[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TASK 2 - Feature flag per realtime (da env) con logging runtime
  const realtimeEnabled = import.meta.env.VITE_REALTIME_GIACENZE_ENABLED === 'true';
  
  // Log feature flag una sola volta all'avvio (solo in dev)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug('🔧 REALTIME_GIACENZE_ENABLED:', realtimeEnabled, 
        '(env value:', import.meta.env.VITE_REALTIME_GIACENZE_ENABLED, ')');
    }
  }, []); // Solo al mount

  const fetchWines = async () => {
    setLoading(true);
    try {
      // Query diretta DB senza filtri user_id (RLS disabilitata)
      const [{ data: viniData, error: viniError }, { data: giacenzeData, error: giacenzeError }] = await Promise.all([
        supabase.from('vini').select('*').order('nome_vino', { ascending: true }),
        supabase.from('giacenza').select('id, vino_id, giacenza, min_stock, version, updated_at, user_id, created_at')
      ]);

      if (viniError) throw viniError;
      if (giacenzeError) throw giacenzeError;

      const giacenzeMap = new Map(giacenzeData?.map((g: any) => [g.vino_id, g]));

      const mappedWines: WineType[] = (viniData || []).map((wine: any) => {
        const g = giacenzeMap.get(wine.id);
        return {
          id: wine.id,
          name: wine.nome_vino || '',
          type: wine.tipologia || '',
          supplier: (wine.fornitore && 
            !wine.fornitore.toLowerCase().includes('non specif') &&
            wine.fornitore.toLowerCase() !== 'non specificato') 
            ? wine.fornitore : '',
          inventory: g?.giacenza ?? 0,
          minStock: g?.min_stock ?? 2,
          price: wine.vendita?.toString() || '',
          cost: wine.costo || 0,
          vintage: wine.anno?.toString() || '',
          region: wine.provenienza || '',
          description: wine.produttore || '',
          // Campi optimistic locking con PK giacenza
          giacenza_id: g?.id,
          inventoryVersion: g?.version ?? 1,
          inventoryUpdatedAt: g?.updated_at
        };
      });

      const uniqueSuppliers = [...new Set(mappedWines.map(w => w.supplier).filter(Boolean))].sort();
      setWines(mappedWines);
      setSuppliers(uniqueSuppliers);
      setError(null);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') console.error('Errore caricamento vini:', err.message);
      setError(err.message);
      setWines([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  // TASK 5 - Helper refetch by PK giacenza (definito prima degli handler)
  const refetchGiacenzaById = useCallback(async (giacenzaId: string) => {
    try {
      const { data, error } = await supabase
        .from('giacenza')
        .select('id, vino_id, giacenza, min_stock, version, updated_at')
        .eq('id', giacenzaId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Giacenza non trovata per ID:', giacenzaId);
          }
          return null;
        }
        throw error;
      }

      // Merge record aggiornato nello store per vino_id
      setWines(prev => prev.map(wine => 
        wine.id === data.vino_id 
          ? { 
              ...wine, 
              inventory: data.giacenza, 
              minStock: data.min_stock ?? wine.minStock,
              giacenza_id: data.id,
              inventoryVersion: data.version ?? wine.inventoryVersion,
              inventoryUpdatedAt: data.updated_at
            }
          : wine
      ));

      return data;
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('Errore refetch giacenza by ID:', err.message);
      return null;
    }
  }, []);

  // Handler per eventi realtime giacenza
  const handleRealtimeInsert = useCallback((record: any) => {
    if (import.meta.env.DEV) {
      console.log('🔄 Realtime INSERT giacenza:', record);
    }
    
    setWines(prev => prev.map(wine => 
      wine.id === record.vino_id 
        ? { 
            ...wine, 
            inventory: record.giacenza, 
            minStock: record.min_stock ?? wine.minStock,
            giacenza_id: record.id,
            inventoryVersion: record.version ?? wine.inventoryVersion,
            inventoryUpdatedAt: record.updated_at
          }
        : wine
    ));
  }, []);

  const handleRealtimeUpdate = useCallback((record: any) => {
    if (import.meta.env.DEV) {
      console.log('🔄 Realtime UPDATE giacenza:', record);
    }
    
    // Merge locale
    setWines(prev => prev.map(wine => 
      wine.id === record.vino_id 
        ? { 
            ...wine, 
            inventory: record.giacenza, 
            minStock: record.min_stock ?? wine.minStock,
            giacenza_id: record.id,
            inventoryVersion: record.version ?? wine.inventoryVersion,
            inventoryUpdatedAt: record.updated_at
          }
        : wine
    ));

    // STEP 4 - Fallback diagnostico: refetch by PK con debounce (TEMPORANEO)
    // TODO: Rimuovere dopo conferma sincronizzazione OK in produzione
    if (record.id) {
      setTimeout(() => {
        refetchGiacenzaById(record.id);
        if (import.meta.env.DEV || import.meta.env.VITE_RT_DEBUG === 'true') {
          console.debug('🔄 Fallback refetch by PK:', record.id);
        }
      }, 250);
    }
  }, [refetchGiacenzaById]);

  const handleRealtimeDelete = useCallback((record: any) => {
    if (import.meta.env.DEV) {
      console.log('🔄 Realtime DELETE giacenza:', record);
    }
    
    // Reset a valori default quando giacenza viene eliminata
    setWines(prev => prev.map(wine => 
      wine.id === record.vino_id 
        ? { 
            ...wine, 
            inventory: 0, 
            minStock: 2,
            giacenza_id: undefined,
            inventoryVersion: 1,
            inventoryUpdatedAt: undefined
          }
        : wine
    ));
  }, []);

  // TASK 4 - Helper refetch puntuale per conflitti (fallback by vino_id)
  const refetchGiacenzaByVinoId = useCallback(async (vinoId: string) => {
    try {
      const { data, error } = await supabase
        .from('giacenza')
        .select('id, vino_id, giacenza, min_stock, version, updated_at')
        .eq('vino_id', vinoId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Record non trovato - reset a default
          setWines(prev => prev.map(wine => 
            wine.id === vinoId 
              ? { 
                  ...wine, 
                  inventory: 0, 
                  minStock: 2,
                  inventoryVersion: 1,
                  inventoryUpdatedAt: undefined
                }
              : wine
          ));
          return null;
        }
        throw error;
      }

      // Merge record aggiornato nello store
      setWines(prev => prev.map(wine => 
        wine.id === vinoId 
          ? { 
              ...wine, 
              inventory: data.giacenza, 
              minStock: data.min_stock ?? wine.minStock,
              inventoryVersion: data.version ?? wine.inventoryVersion,
              inventoryUpdatedAt: data.updated_at
            }
          : wine
      ));

      return data;
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('Errore refetch giacenza:', err.message);
      return null;
    }
  }, []);

  const updateWineInventory = async (id: string, newInventory: number): Promise<boolean> => {
    try {
      // Marca update come pending per evitare eco realtime
      if (realtimeEnabled) {
        markUpdatePending(id);
      }

      // Trova il wine corrente per ottenere giacenza_id e versione
      const currentWine = wines.find(w => w.id === id);
      const currentVersion = currentWine?.inventoryVersion ?? 1;
      const giacenzaId = currentWine?.giacenza_id;

      if (import.meta.env.DEV) {
        console.log(`🔄 Update giacenza vino ${id}: ${currentWine?.inventory} → ${newInventory} (version: ${currentVersion}, giacenza_id: ${giacenzaId})`);
      }

      // Se abbiamo giacenza_id, usa optimistic locking con PK
      if (giacenzaId) {
        const result = await supabase
          .from('giacenza')
          .update({
            giacenza: newInventory
          })
          .eq('id', giacenzaId)
          .eq('version', currentVersion)
          .select('id, vino_id, giacenza, min_stock, version, updated_at');

        // Gestione conflitto (0 righe aggiornate)
        if (result.data && result.data.length === 0) {
          if (import.meta.env.DEV) {
            console.warn(`⚠️ Conflitto concorrenza per giacenza ${giacenzaId} (version ${currentVersion})`);
          }

          // Refetch by PK per riallineare
          await refetchGiacenzaById(giacenzaId);
          
          console.warn('🔄 Valore aggiornato da un altro utente, dati ricaricati.');
          return false; // Conflitto gestito
        }

        // Successo - merge della riga confermata con nuova version
        if (result.data && result.data.length > 0) {
          const updatedRecord = result.data[0];
          setWines(prev => prev.map(w => 
            w.id === id 
              ? { 
                  ...w, 
                  inventory: updatedRecord.giacenza,
                  minStock: updatedRecord.min_stock ?? w.minStock,
                  giacenza_id: updatedRecord.id,
                  inventoryVersion: updatedRecord.version,
                  inventoryUpdatedAt: updatedRecord.updated_at
                }
              : w
          ));
        }

        if (result.error) throw result.error;
        return true;
      }

      // Fallback: controlla se esiste già un record per questo vino
      const { data: existingRecord, error: checkError } = await supabase
        .from('giacenza')
        .select('id, version')
        .eq('vino_id', id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = "The result contains 0 rows" (record non trovato)
        throw checkError;
      }

      let result;
      if (existingRecord) {
        // TASK 1 - Record esiste: aggiorna con optimistic locking (WHERE id + version)
        result = await supabase
          .from('giacenza')
          .update({
            giacenza: newInventory
            // Non scriviamo updated_at dal client - solo server-side
          })
          .eq('vino_id', id)
          .eq('version', currentVersion)
          .select('id, vino_id, giacenza, min_stock, version, updated_at');

        // TASK 2 - Gestione conflitto (0 righe aggiornate)
        if (result.data && result.data.length === 0) {
          if (import.meta.env.DEV) {
            console.warn(`⚠️ Conflitto concorrenza per vino ${id} (version ${currentVersion})`);
          }

          // Refetch puntuale per riallineare
          const refetchedData = await refetchGiacenzaByVinoId(id);
          
          // TASK 2 - Toast non bloccante
          // TODO: Implementare toast system
          console.warn('🔄 Valore aggiornato da un altro utente, dati ricaricati.');
          
          return false; // Conflitto gestito
        }

        // Successo - merge della riga confermata con nuova version
        if (result.data && result.data.length > 0) {
          const updatedRecord = result.data[0];
          setWines(prev => prev.map(w => 
            w.id === id 
              ? { 
                  ...w, 
                  inventory: updatedRecord.giacenza,
                  minStock: updatedRecord.min_stock ?? w.minStock,
                  inventoryVersion: updatedRecord.version,
                  inventoryUpdatedAt: updatedRecord.updated_at
                }
              : w
          ));
        }
      } else {
        // Record non esiste: inserisci (version iniziale = 1)
        result = await supabase
          .from('giacenza')
          .insert({
            vino_id: id,
            giacenza: newInventory,
            version: 1,
            user_id: '00000000-0000-0000-0000-000000000000', // UUID fisso per app senza autenticazione
            created_at: new Date().toISOString()
            // updated_at gestito da trigger DB
          })
          .select('id, vino_id, giacenza, min_stock, version, updated_at');

        // Merge del nuovo record
        if (result.data && result.data.length > 0) {
          const newRecord = result.data[0];
          setWines(prev => prev.map(w => 
            w.id === id 
              ? { 
                  ...w, 
                  inventory: newRecord.giacenza,
                  minStock: newRecord.min_stock ?? w.minStock,
                  inventoryVersion: newRecord.version,
                  inventoryUpdatedAt: newRecord.updated_at
                }
              : w
          ));
        }
      }

      if (result.error) throw result.error;
      
      return true;
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('Errore aggiornamento giacenza:', err.message);
      return false;
    }
  };

  const updateMultipleWineInventories = async (updates: Array<{id: string, newInventory: number}>): Promise<boolean> => {
    try {
      // Usa la funzione singola per ogni aggiornamento per evitare problemi di constraint
      const updatePromises = updates.map(update => 
        updateWineInventory(update.id, update.newInventory)
      );

      const results = await Promise.all(updatePromises);
      const hasErrors = results.some(result => !result);

      if (hasErrors) {
        return false;
      }

      return true;
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('❌ Errore aggiornamento giacenze multiple:', err.message);
      return false;
    }
  };

  // TASK 5 - Update min_stock con optimistic locking
  const updateWineMinStock = async (id: string, newMinStock: number): Promise<boolean> => {
    try {
      // Marca update come pending per evitare eco realtime
      if (realtimeEnabled) {
        markUpdatePending(id);
      }

      // Trova il wine corrente per ottenere giacenza_id e versione
      const currentWine = wines.find(w => w.id === id);
      const currentVersion = currentWine?.inventoryVersion ?? 1;
      const giacenzaId = currentWine?.giacenza_id;

      // TASK 3 - LOGGING DIAGNOSTICO per debug
      if (import.meta.env.DEV || import.meta.env.VITE_RT_DEBUG === 'true') {
        console.debug(`🟡 giacenza.update (min_stock): { vino_id: ${id}, prevVersion: ${currentVersion}, nextValue: ${newMinStock}, giacenza_id: ${giacenzaId} }`);
      }

      // Se abbiamo giacenza_id, usa optimistic locking con PK
      if (giacenzaId) {
        const result = await supabase
          .from('giacenza')
          .update({
            min_stock: newMinStock
          })
          .eq('id', giacenzaId)
          .eq('version', currentVersion)
          .select('id, vino_id, giacenza, min_stock, version, updated_at');

        // Gestione conflitto (0 righe aggiornate)
        if (result.data && result.data.length === 0) {
          if (import.meta.env.DEV) {
            console.warn(`⚠️ Conflitto concorrenza min_stock per giacenza ${giacenzaId} (version ${currentVersion})`);
          }

          // Refetch by PK per riallineare
          await refetchGiacenzaById(giacenzaId);
          
          console.warn('🔄 Soglia minima aggiornata da un altro utente, dati ricaricati.');
          return false; // Conflitto gestito
        }

        // Successo - merge della riga confermata
        if (result.data && result.data.length > 0) {
          const updatedRecord = result.data[0];
          setWines(prev => prev.map(w => 
            w.id === id 
              ? { 
                  ...w, 
                  inventory: updatedRecord.giacenza,
                  minStock: updatedRecord.min_stock,
                  giacenza_id: updatedRecord.id,
                  inventoryVersion: updatedRecord.version,
                  inventoryUpdatedAt: updatedRecord.updated_at
                }
              : w
          ));
        }

        if (result.error) throw result.error;
        return true;
      }

      // Controlla se esiste già un record per questo vino
      const { data: existingRecord, error: checkError } = await supabase
        .from('giacenza')
        .select('id, version')
        .eq('vino_id', id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      let result;
      if (existingRecord) {
        // Record esiste: aggiorna con optimistic locking
        result = await supabase
          .from('giacenza')
          .update({
            min_stock: newMinStock
          })
          .eq('vino_id', id)
          .eq('version', currentVersion)
          .select('id, vino_id, giacenza, min_stock, version, updated_at');

        // Gestione conflitto (0 righe aggiornate)
        if (result.data && result.data.length === 0) {
          if (import.meta.env.DEV) {
            console.warn(`⚠️ Conflitto concorrenza min_stock per vino ${id} (version ${currentVersion})`);
          }

          // Refetch puntuale per riallineare
          await refetchGiacenzaByVinoId(id);
          
          // Toast non bloccante
          console.warn('🔄 Soglia minima aggiornata da un altro utente, dati ricaricati.');
          
          return false; // Conflitto gestito
        }

        // Successo - merge della riga confermata
        if (result.data && result.data.length > 0) {
          const updatedRecord = result.data[0];
          setWines(prev => prev.map(w => 
            w.id === id 
              ? { 
                  ...w, 
                  inventory: updatedRecord.giacenza,
                  minStock: updatedRecord.min_stock,
                  inventoryVersion: updatedRecord.version,
                  inventoryUpdatedAt: updatedRecord.updated_at
                }
              : w
          ));
        }
      } else {
        // Record non esiste: inserisci con min_stock
        result = await supabase
          .from('giacenza')
          .insert({
            vino_id: id,
            giacenza: currentWine?.inventory ?? 0,
            min_stock: newMinStock,
            version: 1,
            user_id: '00000000-0000-0000-0000-000000000000',
            created_at: new Date().toISOString()
          })
          .select('id, vino_id, giacenza, min_stock, version, updated_at');

        // Merge del nuovo record
        if (result.data && result.data.length > 0) {
          const newRecord = result.data[0];
          setWines(prev => prev.map(w => 
            w.id === id 
              ? { 
                  ...w, 
                  inventory: newRecord.giacenza,
                  minStock: newRecord.min_stock,
                  inventoryVersion: newRecord.version,
                  inventoryUpdatedAt: newRecord.updated_at
                }
              : w
          ));
        }
      }

      if (result.error) throw result.error;
      
      return true;
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('Errore aggiornamento min_stock:', err.message);
      return false;
    }
  };

  const updateWine = async (id: string, updates: Partial<WineType>): Promise<boolean> => {
    try {
      // PATCH 1 - SANITIZZAZIONE HARD: Rimuovi minStock da updates prima di processare metadati
      const sanitizedUpdates = { ...updates };
      let hasMinStock = false;
      let minStockValue: number | undefined;
      
      if (sanitizedUpdates.minStock !== undefined) {
        hasMinStock = true;
        minStockValue = sanitizedUpdates.minStock;
        delete sanitizedUpdates.minStock;
        
        if (import.meta.env.DEV || import.meta.env.VITE_RT_DEBUG === 'true') {
          console.debug('🧹 sanitize(metadata): removed { min_stock }', { vino_id: id, value: minStockValue });
        }
      }

      // PATCH 2 - ROUTING ESPLICITO: minStock sempre → updateWineMinStock (PRIMA di processare metadati)
      if (hasMinStock && minStockValue !== undefined) {
        if (import.meta.env.DEV || import.meta.env.VITE_RT_DEBUG === 'true') {
          console.debug('🟡 route(min_stock) → giacenza:', { vino_id: id, nextValue: minStockValue });
        }
        
        // Usa la pipeline esistente per min_stock su giacenza
        const minStockUpdateSuccess = await updateWineMinStock(id, minStockValue);
        if (!minStockUpdateSuccess) {
          throw new Error('Errore aggiornamento soglia minima');
        }
        
        // Se solo minStock, ritorna successo
        if (Object.keys(sanitizedUpdates).length === 0) {
          return true;
        }
      }

      // ❌ DISABILITATO: App deve essere READ-ONLY su tabella 'vini'
      // I metadati vini devono essere gestiti solo tramite sincronizzazione Google Sheet
      console.warn('🚫 updateWine DISABILITATO: App è read-only su tabella vini');
      console.warn('📋 Update ignorato per vino ID:', id, 'updates:', sanitizedUpdates);
      
      // GUARDRAIL: Blocca operazioni su metadati vini (minStock già rimosso)
      const metadataUpdates = {
        ...(sanitizedUpdates.name !== undefined && { nome_vino: sanitizedUpdates.name }),
        ...(sanitizedUpdates.type !== undefined && { tipologia: sanitizedUpdates.type }),
        ...(sanitizedUpdates.supplier !== undefined && { fornitore: sanitizedUpdates.supplier }),
        ...(sanitizedUpdates.price !== undefined && { vendita: parseFloat(sanitizedUpdates.price) }),
        ...(sanitizedUpdates.cost !== undefined && { costo: sanitizedUpdates.cost }),
        ...(sanitizedUpdates.vintage !== undefined && { anno: sanitizedUpdates.vintage }),
        ...(sanitizedUpdates.region !== undefined && { provenienza: sanitizedUpdates.region }),
        ...(sanitizedUpdates.description !== undefined && { produttore: sanitizedUpdates.description })
      };

      if (Object.keys(metadataUpdates).length > 0) {
        console.warn('🚫 OPERAZIONE BLOCCATA: Tentativo di aggiornare metadati vino');
        console.warn('📋 Metadati bloccati:', metadataUpdates);
        
        // Usa il wrapper guardato che bloccherà l'operazione
        try {
          await supabaseGuarded.from('vini').update(metadataUpdates).eq('id', id);
        } catch (error) {
          console.warn('✅ Guardrail attivo: Operazione bloccata correttamente');
        }
      }

      if (sanitizedUpdates.inventory !== undefined) {
        // Usa la funzione updateWineInventory per evitare problemi di constraint
        const inventoryUpdateSuccess = await updateWineInventory(id, sanitizedUpdates.inventory);
        if (!inventoryUpdateSuccess) {
          throw new Error('Errore aggiornamento giacenza');
        }
        
        // Aggiorna solo la giacenza nello stato locale (metadati bloccati)
        setWines(prev => prev.map(w => (w.id === id ? { ...w, inventory: sanitizedUpdates.inventory } : w)));
        return true;
      }

      // Se solo metadati (bloccati), non aggiornare stato locale
      console.warn('🚫 Aggiornamento stato locale bloccato per metadati vino');
      return false;
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('❌ Errore aggiornamento vino:', err.message);
      return false;
    }
  };

  // Setup realtime subscription
  const { isConnected: realtimeConnected, isSubscribed: realtimeSubscribed, markUpdatePending } = useRealtimeGiacenza({
    onInsert: handleRealtimeInsert,
    onUpdate: handleRealtimeUpdate,
    onDelete: handleRealtimeDelete,
    enabled: realtimeEnabled
  });

  // TASK 2 - Log status realtime al mount
  useEffect(() => {
    if (import.meta.env.DEV || import.meta.env.VITE_RT_DEBUG === 'true') {
      console.debug('🏠 useWines realtime status:', { 
        enabled: realtimeEnabled, 
        connected: realtimeConnected, 
        subscribed: realtimeSubscribed 
      });
    }
  }, [realtimeEnabled, realtimeConnected, realtimeSubscribed]);

  useEffect(() => {
    fetchWines();
  }, []);

  return {
    wines,
    suppliers,
    loading,
    error,
    refreshWines: fetchWines,
    updateWineInventory,
    updateMultipleWineInventories,
    updateWineMinStock,
    updateWine,
    refetchGiacenzaById,
    refetchGiacenzaByVinoId,
    // Realtime status
    realtimeConnected: realtimeEnabled ? realtimeConnected : false,
    realtimeSubscribed: realtimeEnabled ? realtimeSubscribed : false
  };
};

export default useWines;
export { useWines };
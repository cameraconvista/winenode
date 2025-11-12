/**
 * WINES INVENTORY HOOK - WINENODE
 * 
 * Hook per gestione giacenze e operazioni di inventory.
 * Governance: Max 200 righe per file.
 */

import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { WineType } from './useWinesData';

interface UseWinesInventoryProps {
  wines: WineType[];
  setWines: React.Dispatch<React.SetStateAction<WineType[]>>;
  refetchGiacenzaById: (giacenzaId: string) => Promise<any>;
  refetchGiacenzaByVinoId: (vinoId: string) => Promise<any>;
  markUpdatePending?: (id: string) => void;
  realtimeGiacenzeEnabled: boolean;
}

interface UseWinesInventoryReturn {
  updateWineInventory: (id: string, newInventory: number) => Promise<boolean>;
  updateMultipleWineInventories: (updates: Array<{id: string, newInventory: number}>) => Promise<boolean>;
  updateWineMinStock: (wineId: string, minStock: number) => Promise<boolean>;
  updateWine: (wineId: string, updates: Partial<WineType>) => Promise<boolean>;
}

export const useWinesInventory = ({
  wines,
  setWines,
  refetchGiacenzaById,
  refetchGiacenzaByVinoId,
  markUpdatePending,
  realtimeGiacenzeEnabled
}: UseWinesInventoryProps): UseWinesInventoryReturn => {

  const updateWineInventory = useCallback(async (id: string, newInventory: number): Promise<boolean> => {
    try {
      // Marca update come pending per evitare eco realtime
      if (realtimeGiacenzeEnabled && markUpdatePending) {
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
        // Record esiste: aggiorna con optimistic locking (WHERE id + version)
        result = await supabase
          .from('giacenza')
          .update({
            giacenza: newInventory
          })
          .eq('vino_id', id)
          .eq('version', currentVersion)
          .select('id, vino_id, giacenza, min_stock, version, updated_at');

        // Gestione conflitto (0 righe aggiornate)
        if (result.data && result.data.length === 0) {
          if (import.meta.env.DEV) {
            console.warn(`⚠️ Conflitto concorrenza per vino ${id} (version ${currentVersion})`);
          }

          // Refetch puntuale per riallineare
          await refetchGiacenzaByVinoId(id);
          
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
  }, [wines, setWines, refetchGiacenzaById, refetchGiacenzaByVinoId, markUpdatePending, realtimeGiacenzeEnabled]);

  const updateMultipleWineInventories = useCallback(async (updates: Array<{id: string, newInventory: number}>): Promise<boolean> => {
    try {
      let allSuccess = true;
      
      for (const update of updates) {
        const success = await updateWineInventory(update.id, update.newInventory);
        if (!success) allSuccess = false;
      }
      
      return allSuccess;
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('Errore aggiornamento multiplo giacenze:', err.message);
      return false;
    }
  }, [updateWineInventory]);

  const updateWineMinStock = useCallback(async (wineId: string, minStock: number): Promise<boolean> => {
    try {
      const currentWine = wines.find(w => w.id === wineId);
      const giacenzaId = currentWine?.giacenza_id;

      if (!giacenzaId) {
        console.warn('⚠️ Nessun record giacenza trovato per aggiornare min_stock');
        return false;
      }

      const { error } = await supabase
        .from('giacenza')
        .update({ min_stock: minStock })
        .eq('id', giacenzaId);

      if (error) throw error;

      // Aggiorna state locale
      setWines(prev => prev.map(w => 
        w.id === wineId ? { ...w, minStock } : w
      ));

      return true;
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('Errore aggiornamento min stock:', err.message);
      return false;
    }
  }, [wines, setWines]);

  const updateWine = useCallback(async (wineId: string, updates: Partial<WineType>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('vini')
        .update({
          nome_vino: updates.name,
          tipologia: updates.type,
          fornitore: updates.supplier,
          vendita: updates.price,
          costo: updates.cost,
          anno: updates.vintage,
          provenienza: updates.region,
          produttore: updates.description
        })
        .eq('id', wineId);

      if (error) throw error;

      // Aggiorna state locale
      setWines(prev => prev.map(w => 
        w.id === wineId ? { ...w, ...updates } : w
      ));

      return true;
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('Errore aggiornamento vino:', err.message);
      return false;
    }
  }, [setWines]);

  return {
    updateWineInventory,
    updateMultipleWineInventories,
    updateWineMinStock,
    updateWine
  };
};

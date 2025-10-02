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
}

const useWines = () => {
  const [wines, setWines] = useState<WineType[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Feature flag per realtime (da env)
  const realtimeEnabled = import.meta.env.VITE_REALTIME_GIACENZE_ENABLED === 'true';

  const fetchWines = async () => {
    setLoading(true);
    try {
      // Query diretta DB senza filtri user_id (RLS disabilitata)
      const [{ data: viniData, error: viniError }, { data: giacenzeData, error: giacenzeError }] = await Promise.all([
        supabase.from('vini').select('*').order('nome_vino', { ascending: true }),
        supabase.from('giacenza').select('*')
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
          description: wine.produttore || ''
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

  // Handler per eventi realtime giacenza
  const handleRealtimeInsert = useCallback((record: any) => {
    if (import.meta.env.DEV) {
      console.log('🔄 Realtime INSERT giacenza:', record);
    }
    
    setWines(prev => prev.map(wine => 
      wine.id === record.vino_id 
        ? { ...wine, inventory: record.giacenza, minStock: record.min_stock ?? wine.minStock }
        : wine
    ));
  }, []);

  const handleRealtimeUpdate = useCallback((record: any) => {
    if (import.meta.env.DEV) {
      console.log('🔄 Realtime UPDATE giacenza:', record);
    }
    
    setWines(prev => prev.map(wine => 
      wine.id === record.vino_id 
        ? { ...wine, inventory: record.giacenza, minStock: record.min_stock ?? wine.minStock }
        : wine
    ));
  }, []);

  const handleRealtimeDelete = useCallback((record: any) => {
    if (import.meta.env.DEV) {
      console.log('🔄 Realtime DELETE giacenza:', record);
    }
    
    // Reset a valori default quando giacenza viene eliminata
    setWines(prev => prev.map(wine => 
      wine.id === record.vino_id 
        ? { ...wine, inventory: 0, minStock: 2 }
        : wine
    ));
  }, []);

  const updateWineInventory = async (id: string, newInventory: number): Promise<boolean> => {
    try {
      // Marca update come pending per evitare eco realtime
      if (realtimeEnabled) {
        markUpdatePending(id);
      }

      // Prima controlla se esiste già un record per questo vino
      const { data: existingRecord, error: checkError } = await supabase
        .from('giacenza')
        .select('id')
        .eq('vino_id', id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = "The result contains 0 rows" (record non trovato)
        throw checkError;
      }

      let result;
      if (existingRecord) {
        // Record esiste: aggiorna
        result = await supabase
          .from('giacenza')
          .update({
            giacenza: newInventory,
            updated_at: new Date().toISOString()
          })
          .eq('vino_id', id);
      } else {
        // Record non esiste: inserisci
        result = await supabase
          .from('giacenza')
          .insert({
            vino_id: id,
            giacenza: newInventory,
            user_id: '00000000-0000-0000-0000-000000000000', // UUID fisso per app senza autenticazione
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      if (result.error) throw result.error;
      
      // Aggiorna lo stato locale solo se l'operazione DB è riuscita
      setWines(prev => prev.map(w => (w.id === id ? { ...w, inventory: newInventory } : w)));
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

  const updateWine = async (id: string, updates: Partial<WineType>): Promise<boolean> => {
    try {
      // ❌ DISABILITATO: App deve essere READ-ONLY su tabella 'vini'
      // I metadati vini devono essere gestiti solo tramite sincronizzazione Google Sheet
      console.warn('🚫 updateWine DISABILITATO: App è read-only su tabella vini');
      console.warn('📋 Update ignorato per vino ID:', id, 'updates:', updates);
      
      // Blocca operazioni su metadati vini
      const metadataUpdates = {
        ...(updates.name !== undefined && { nome_vino: updates.name }),
        ...(updates.type !== undefined && { tipologia: updates.type }),
        ...(updates.supplier !== undefined && { fornitore: updates.supplier }),
        ...(updates.minStock !== undefined && { min_stock: updates.minStock }),
        ...(updates.price !== undefined && { vendita: parseFloat(updates.price) }),
        ...(updates.cost !== undefined && { costo: updates.cost }),
        ...(updates.vintage !== undefined && { anno: updates.vintage }),
        ...(updates.region !== undefined && { provenienza: updates.region }),
        ...(updates.description !== undefined && { produttore: updates.description })
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

      if (updates.inventory !== undefined) {
        // Usa la funzione updateWineInventory per evitare problemi di constraint
        const inventoryUpdateSuccess = await updateWineInventory(id, updates.inventory);
        if (!inventoryUpdateSuccess) {
          throw new Error('Errore aggiornamento giacenza');
        }
        
        // Aggiorna solo la giacenza nello stato locale (metadati bloccati)
        setWines(prev => prev.map(w => (w.id === id ? { ...w, inventory: updates.inventory } : w)));
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
  const { isConnected: realtimeConnected, markUpdatePending } = useRealtimeGiacenza({
    onInsert: handleRealtimeInsert,
    onUpdate: handleRealtimeUpdate,
    onDelete: handleRealtimeDelete,
    enabled: realtimeEnabled
  });

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
    updateWine,
    // Realtime status
    realtimeConnected: realtimeEnabled ? realtimeConnected : false
  };
};

export default useWines;
export { useWines };
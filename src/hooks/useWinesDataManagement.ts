/**
 * WINES DATA MANAGEMENT - WINENODE
 * 
 * Gestione fetch e auto-creazione record - Refactoring graduale Step 3.
 * Governance: Max 200 righe per file.
 */

import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { WineType } from './useWines';

interface UseWinesDataManagementProps {
  wines: WineType[];
  setWines: React.Dispatch<React.SetStateAction<WineType[]>>;
  setSuppliers: React.Dispatch<React.SetStateAction<string[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

interface UseWinesDataManagementReturn {
  fetchWines: () => Promise<void>;
  ensureGiacenzaRecords: (wines: WineType[]) => Promise<void>;
}

export const useWinesDataManagement = ({
  wines,
  setWines,
  setSuppliers,
  setLoading,
  setError
}: UseWinesDataManagementProps): UseWinesDataManagementReturn => {

  // AUTO-CREAZIONE RECORD GIACENZA: Garantisce che ogni vino abbia un record giacenza
  const ensureGiacenzaRecords = useCallback(async (wines: WineType[]) => {
    try {
      const winesWithoutGiacenza = wines.filter(w => !w.giacenza_id);
      
      if (winesWithoutGiacenza.length > 0) {
        if (import.meta.env.DEV) {
          console.log(`🔧 Creando ${winesWithoutGiacenza.length} record giacenza mancanti`);
        }
        
        const newRecords = winesWithoutGiacenza.map(wine => ({
          vino_id: wine.id,
          giacenza: wine.inventory || 0,  // Preserva valore corrente
          min_stock: 2,
          version: 1,
          user_id: '00000000-0000-0000-0000-000000000001' // Service user ID
        }));
        
        const { error } = await supabase
          .from('giacenza')
          .insert(newRecords);
        
        if (error) {
          console.warn('⚠️ Errore creazione record giacenza:', error);
        } else if (import.meta.env.DEV) {
          console.log(`✅ Creati ${newRecords.length} record giacenza`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Errore in ensureGiacenzaRecords:', error);
    }
  }, []);

  const fetchWines = useCallback(async () => {
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
        // NOTA: Rimosso lookup currentWine per evitare dependency loop
        // Le giacenze vengono ora gestite completamente dal DB
        return {
          id: wine.id,
          name: wine.nome_vino || '',
          type: wine.tipologia || '',
          supplier: (wine.fornitore && 
            !wine.fornitore.toLowerCase().includes('non specif') &&
            wine.fornitore.toLowerCase() !== 'non specificato') 
            ? wine.fornitore : '',
          inventory: g?.giacenza ?? 0, // Default a 0 se non c'è record giacenza
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
      
      // AUTO-CREAZIONE RECORD GIACENZA: Garantisce che ogni vino abbia un record giacenza
      await ensureGiacenzaRecords(mappedWines);
      
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
  }, [setWines, setSuppliers, setLoading, setError, ensureGiacenzaRecords]); // RIMUOVO wines per evitare loop infinito

  return {
    fetchWines,
    ensureGiacenzaRecords
  };
};

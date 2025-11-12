/**
 * WINES DATA HOOK FIXED - WINENODE
 * 
 * Hook per gestione state base e fetch iniziale dei vini.
 * Schema database corretto.
 * Governance: Max 200 righe per file.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

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

interface UseWinesDataReturn {
  wines: WineType[];
  suppliers: string[];
  loading: boolean;
  error: string | null;
  setWines: React.Dispatch<React.SetStateAction<WineType[]>>;
  setSuppliers: React.Dispatch<React.SetStateAction<string[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  refreshWines: () => Promise<void>;
  ensureGiacenzaRecords: (wines: WineType[]) => Promise<void>;
}

export const useWinesData = (): UseWinesDataReturn => {
  const [wines, setWines] = useState<WineType[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Feature flags per realtime (da env) con logging runtime
  const realtimeGiacenzeEnabled = import.meta.env.VITE_REALTIME_GIACENZE_ENABLED === 'true';
  const realtimeViniEnabled = import.meta.env.VITE_REALTIME_VINI_ENABLED === 'true';
  const refreshOnFocusEnabled = import.meta.env.VITE_REFRESH_ON_FOCUS_ENABLED === 'true';
  
  // Log feature flags (solo in dev)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug('🔧 Feature flags:', { realtimeGiacenze: realtimeGiacenzeEnabled, realtimeVini: realtimeViniEnabled, refreshOnFocus: refreshOnFocusEnabled });
    }
  }, []);

  // AUTO-CREAZIONE RECORD GIACENZA: Garantisce che ogni vino abbia un record giacenza
  const ensureGiacenzaRecords = useCallback(async (wines: WineType[]) => {
    try {
      const winesWithoutGiacenza = wines.filter(w => !w.giacenza_id);
      
      if (winesWithoutGiacenza.length === 0) return;

      if (import.meta.env.DEV) {
        console.log(`🔧 Creating giacenza records for ${winesWithoutGiacenza.length} wines`);
      }

      // Batch insert per performance
      const giacenzaRecords = winesWithoutGiacenza.map(wine => ({
        vino_id: wine.id,
        giacenza: wine.inventory || 0,
        min_stock: wine.minStock || 0,
        version: 1,
        user_id: '00000000-0000-0000-0000-000000000000',
        created_at: new Date().toISOString()
      }));

      const { data: insertedRecords, error: insertError } = await supabase
        .from('giacenza')
        .insert(giacenzaRecords)
        .select('id, vino_id, giacenza, min_stock, version, updated_at');

      if (insertError) {
        console.warn('⚠️ Errore creazione record giacenza:', insertError);
        return;
      }

      // Aggiorna wines con i nuovi giacenza_id
      if (insertedRecords && insertedRecords.length > 0) {
        setWines(prevWines => 
          prevWines.map(wine => {
            const matchingRecord = insertedRecords.find(r => r.vino_id === wine.id);
            return matchingRecord 
              ? {
                  ...wine,
                  giacenza_id: matchingRecord.id,
                  inventory: matchingRecord.giacenza,
                  minStock: matchingRecord.min_stock,
                  inventoryVersion: matchingRecord.version,
                  inventoryUpdatedAt: matchingRecord.updated_at
                }
              : wine;
          })
        );

        if (import.meta.env.DEV) {
          console.log(`✅ Created ${insertedRecords.length} giacenza records`);
        }
      }
    } catch (error) {
      console.error('❌ Errore auto-creazione giacenza:', error);
    }
  }, []);

  // Fetch principale dei vini - SCHEMA CORRETTO
  const refreshWines = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Query diretta DB con schema corretto
      const [{ data: viniData, error: viniError }, { data: giacenzeData, error: giacenzeError }] = await Promise.all([
        supabase.from('vini').select('*').order('nome_vino', { ascending: true }),
        supabase.from('giacenza').select('id, vino_id, giacenza, min_stock, version, updated_at, user_id, created_at')
      ]);

      if (viniError) throw viniError;
      if (giacenzeError) throw giacenzeError;

      // Crea mappa giacenze per lookup veloce
      const giacenzeMap = new Map(giacenzeData?.map((g: any) => [g.vino_id, g]));

      if (viniData) {
        // Trasforma i dati nel formato WineType con schema corretto
        const transformedWines: WineType[] = viniData.map((wine: any) => {
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

        setWines(transformedWines);

        // Estrai fornitori unici
        const uniqueSuppliers = [...new Set(transformedWines.map(w => w.supplier))].filter(Boolean) as string[];
        setSuppliers(uniqueSuppliers);

        // Auto-crea record giacenza mancanti
        await ensureGiacenzaRecords(transformedWines);

        if (import.meta.env.DEV) {
          console.log(`✅ Loaded ${transformedWines.length} wines, ${uniqueSuppliers.length} suppliers`);
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Errore nel caricamento dei vini';
      setError(errorMessage);
      console.error('❌ Errore refresh vini:', err);
    } finally {
      setLoading(false);
    }
  }, [ensureGiacenzaRecords]);

  // Caricamento iniziale
  useEffect(() => {
    refreshWines();
  }, [refreshWines]);

  return {
    wines,
    suppliers,
    loading,
    error,
    setWines,
    setSuppliers,
    setLoading,
    setError,
    refreshWines,
    ensureGiacenzaRecords
  };
};

/**
 * WINES OPERATIONS HOOK - WINENODE
 * 
 * Hook per operazioni di refetch e utility.
 * Governance: Max 200 righe per file.
 */

import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { WineType } from './useWinesData';

interface UseWinesOperationsProps {
  wines: WineType[];
  setWines: React.Dispatch<React.SetStateAction<WineType[]>>;
}

interface UseWinesOperationsReturn {
  refetchGiacenzaById: (giacenzaId: string) => Promise<any>;
  refetchGiacenzaByVinoId: (vinoId: string) => Promise<any>;
}

export const useWinesOperations = ({
  wines,
  setWines
}: UseWinesOperationsProps): UseWinesOperationsReturn => {

  // Helper refetch by PK giacenza
  const refetchGiacenzaById = useCallback(async (giacenzaId: string) => {
    try {
      const { data, error } = await supabase
        .from('giacenza')
        .select('id, vino_id, giacenza, min_stock, version, updated_at')
        .eq('id', giacenzaId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Record non trovato - rimuovi giacenza_id dal wine
          setWines(prev => prev.map(wine => 
            wine.giacenza_id === giacenzaId 
              ? {
                  ...wine,
                  giacenza_id: undefined,
                  inventoryVersion: undefined,
                  inventoryUpdatedAt: undefined
                }
              : wine
          ));
          
          if (import.meta.env.DEV) {
            console.warn(`⚠️ Giacenza record ${giacenzaId} not found, cleared from wine`);
          }
          
          return null;
        }
        throw error;
      }

      if (data) {
        // Aggiorna il wine corrispondente
        setWines(prev => prev.map(wine => 
          wine.id === data.vino_id 
            ? {
                ...wine,
                inventory: data.giacenza,
                minStock: data.min_stock ?? wine.minStock,
                giacenza_id: data.id,
                inventoryVersion: data.version,
                inventoryUpdatedAt: data.updated_at
              }
            : wine
        ));

        if (import.meta.env.DEV) {
          console.log(`✅ Refetched giacenza by ID ${giacenzaId}:`, data);
        }

        return data;
      }

      return null;
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('Errore refetch giacenza:', err.message);
      return null;
    }
  }, [setWines]);

  // Helper refetch puntuale per conflitti (fallback by vino_id)
  const refetchGiacenzaByVinoId = useCallback(async (vinoId: string) => {
    try {
      const { data, error } = await supabase
        .from('giacenza')
        .select('id, vino_id, giacenza, min_stock, version, updated_at')
        .eq('vino_id', vinoId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Record non trovato - reset giacenza info
          setWines(prev => prev.map(wine => 
            wine.id === vinoId 
              ? {
                  ...wine,
                  inventory: 0,
                  minStock: 0,
                  giacenza_id: undefined,
                  inventoryVersion: undefined,
                  inventoryUpdatedAt: undefined
                }
              : wine
          ));
          
          if (import.meta.env.DEV) {
            console.warn(`⚠️ No giacenza record found for vino ${vinoId}, reset to 0`);
          }
          
          return null;
        }
        throw error;
      }

      if (data) {
        // Aggiorna il wine corrispondente
        setWines(prev => prev.map(wine => 
          wine.id === vinoId 
            ? {
                ...wine,
                inventory: data.giacenza,
                minStock: data.min_stock ?? wine.minStock,
                giacenza_id: data.id,
                inventoryVersion: data.version,
                inventoryUpdatedAt: data.updated_at
              }
            : wine
        ));

        if (import.meta.env.DEV) {
          console.log(`✅ Refetched giacenza by vino_id ${vinoId}:`, data);
        }

        return data;
      }

      return null;
    } catch (err: any) {
      if (import.meta.env.DEV) console.error('Errore refetch giacenza:', err.message);
      return null;
    }
  }, [setWines]);

  return {
    refetchGiacenzaById,
    refetchGiacenzaByVinoId
  };
};

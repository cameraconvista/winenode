/**
 * WINES REALTIME HOOK - WINENODE
 * 
 * Hook per gestione eventi realtime e handlers.
 * Governance: Max 200 righe per file.
 */

import { useCallback, useRef } from 'react';
import { WineType } from './useWinesData';

interface UseWinesRealtimeProps {
  wines: WineType[];
  setWines: React.Dispatch<React.SetStateAction<WineType[]>>;
  refetchGiacenzaById: (giacenzaId: string) => Promise<any>;
  realtimeGiacenzeEnabled: boolean;
}

interface UseWinesRealtimeReturn {
  handleRealtimeInsert: (record: any) => void;
  handleRealtimeUpdate: (record: any) => void;
  handleRealtimeDelete: (record: any) => void;
  markUpdatePending: (id: string) => void;
  realtimeConnected: boolean;
  realtimeSubscribed: boolean;
}

export const useWinesRealtime = ({
  wines,
  setWines,
  refetchGiacenzaById,
  realtimeGiacenzeEnabled
}: UseWinesRealtimeProps): UseWinesRealtimeReturn => {

  // Ref per tracciare update pending (evita eco realtime)
  const pendingUpdatesRef = useRef<Set<string>>(new Set());

  const markUpdatePending = useCallback((id: string) => {
    pendingUpdatesRef.current.add(id);
    // Auto-rimuovi dopo 5 secondi per sicurezza
    setTimeout(() => {
      pendingUpdatesRef.current.delete(id);
    }, 5000);
  }, []);

  // Handler per eventi realtime giacenza
  const handleRealtimeInsert = useCallback((record: any) => {
    if (import.meta.env.DEV) {
      console.log('🔄 Realtime INSERT giacenza:', record);
    }

    // Aggiorna il wine corrispondente con i nuovi dati giacenza
    setWines(prev => prev.map(wine => 
      wine.id === record.vino_id 
        ? {
            ...wine,
            inventory: record.giacenza,
            minStock: record.min_stock ?? wine.minStock,
            giacenza_id: record.id,
            inventoryVersion: record.version,
            inventoryUpdatedAt: record.updated_at
          }
        : wine
    ));
  }, [setWines]);

  const handleRealtimeUpdate = useCallback((record: any) => {
    if (import.meta.env.DEV) {
      console.log('🔄 Realtime UPDATE giacenza:', record);
    }

    // Verifica se questo update è pending (evita eco)
    if (pendingUpdatesRef.current.has(record.vino_id)) {
      if (import.meta.env.DEV) {
        console.log('⏭️ Skipping realtime update (pending local update):', record.vino_id);
      }
      pendingUpdatesRef.current.delete(record.vino_id);
      return;
    }

    // Trova il wine corrente per confrontare versioni
    const currentWine = wines.find(w => w.id === record.vino_id);
    
    if (currentWine && currentWine.inventoryVersion && record.version <= currentWine.inventoryVersion) {
      if (import.meta.env.DEV) {
        console.log('⏭️ Skipping realtime update (older version):', {
          current: currentWine.inventoryVersion,
          received: record.version
        });
      }
      return;
    }

    // Aggiorna con i nuovi dati
    setWines(prev => prev.map(wine => 
      wine.id === record.vino_id 
        ? {
            ...wine,
            inventory: record.giacenza,
            minStock: record.min_stock ?? wine.minStock,
            inventoryVersion: record.version,
            inventoryUpdatedAt: record.updated_at
          }
        : wine
    ));

    // Se la versione è molto più alta, potrebbe esserci un disallineamento
    if (currentWine && currentWine.inventoryVersion && record.version > currentWine.inventoryVersion + 1) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Version gap detected, refetching:', {
          current: currentWine.inventoryVersion,
          received: record.version,
          giacenza_id: record.id
        });
      }
      
      // Refetch per sicurezza
      setTimeout(() => {
        refetchGiacenzaById(record.id);
      }, 1000);
    }
  }, [wines, setWines, refetchGiacenzaById]);

  const handleRealtimeDelete = useCallback((record: any) => {
    if (import.meta.env.DEV) {
      console.log('🔄 Realtime DELETE giacenza:', record);
    }

    // Reset giacenza info per il wine corrispondente
    setWines(prev => prev.map(wine => 
      wine.id === record.vino_id 
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
  }, [setWines]);

  // Mock status per realtime (da implementare con hook realtime effettivi)
  const realtimeConnected = realtimeGiacenzeEnabled;
  const realtimeSubscribed = realtimeGiacenzeEnabled;

  return {
    handleRealtimeInsert,
    handleRealtimeUpdate,
    handleRealtimeDelete,
    markUpdatePending,
    realtimeConnected,
    realtimeSubscribed
  };
};

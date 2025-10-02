import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface GiacenzaRecord {
  id: string;
  vino_id: string;
  giacenza: number;
  min_stock: number;
  version?: number;
  updated_at: string;
}

interface UseRealtimeGiacenzaProps {
  onInsert?: (record: GiacenzaRecord) => void;
  onUpdate?: (record: GiacenzaRecord) => void;
  onDelete?: (record: GiacenzaRecord) => void;
  enabled?: boolean;
}

/**
 * Hook per subscription realtime su tabella giacenza
 * Gestisce INSERT|UPDATE|DELETE con cleanup automatico
 */
export function useRealtimeGiacenza({
  onInsert,
  onUpdate,
  onDelete,
  enabled = true
}: UseRealtimeGiacenzaProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pendingUpdatesRef = useRef<Set<string>>(new Set());
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingBatchRef = useRef<Array<{ type: 'INSERT' | 'UPDATE' | 'DELETE', record: GiacenzaRecord }>>([]);

  // Debounced batch processor per evitare re-render cascata
  const processBatch = useCallback(() => {
    if (pendingBatchRef.current.length === 0) return;

    const batch = [...pendingBatchRef.current];
    pendingBatchRef.current = [];

    // Processa batch in micro-task per performance
    queueMicrotask(() => {
      batch.forEach(({ type, record }) => {
        switch (type) {
          case 'INSERT':
            onInsert?.(record);
            break;
          case 'UPDATE':
            onUpdate?.(record);
            break;
          case 'DELETE':
            onDelete?.(record);
            break;
        }
      });
    });
  }, [onInsert, onUpdate, onDelete]);

  // Aggiungi evento al batch con debounce
  const addToBatch = useCallback((type: 'INSERT' | 'UPDATE' | 'DELETE', record: GiacenzaRecord) => {
    pendingBatchRef.current.push({ type, record });

    // Debounce batch processing (50ms)
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    batchTimeoutRef.current = setTimeout(processBatch, 50);
  }, [processBatch]);

  // Handler per eventi realtime
  const handleRealtimeEvent = useCallback((payload: RealtimePostgresChangesPayload<GiacenzaRecord>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (import.meta.env.DEV) {
      console.log('🔄 Realtime giacenza event:', eventType, { newRecord, oldRecord });
    }

    switch (eventType) {
      case 'INSERT':
        if (newRecord) {
          // Ignora eco locale se update è in pending
          if (pendingUpdatesRef.current.has(newRecord.vino_id)) {
            pendingUpdatesRef.current.delete(newRecord.vino_id);
            if (import.meta.env.DEV) {
              console.log('🔇 Ignorato eco locale INSERT per vino:', newRecord.vino_id);
            }
            return;
          }
          addToBatch('INSERT', newRecord);
        }
        break;

      case 'UPDATE':
        if (newRecord) {
          // Ignora eco locale se update è in pending
          if (pendingUpdatesRef.current.has(newRecord.vino_id)) {
            pendingUpdatesRef.current.delete(newRecord.vino_id);
            if (import.meta.env.DEV) {
              console.log('🔇 Ignorato eco locale UPDATE per vino:', newRecord.vino_id);
            }
            return;
          }
          addToBatch('UPDATE', newRecord);
        }
        break;

      case 'DELETE':
        if (oldRecord && oldRecord.id) {
          addToBatch('DELETE', oldRecord as GiacenzaRecord);
        }
        break;
    }
  }, [addToBatch]);

  // Setup subscription
  useEffect(() => {
    if (!enabled) {
      if (import.meta.env.DEV) {
        console.log('🔇 Realtime giacenza disabilitato');
      }
      return;
    }

    if (import.meta.env.DEV) {
      console.log('🔄 Avvio subscription realtime giacenza...');
    }

    // Crea canale realtime
    const channel = supabase
      .channel('giacenza-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT | UPDATE | DELETE
          schema: 'public',
          table: 'giacenza'
        },
        handleRealtimeEvent
      )
      .subscribe((status) => {
        if (import.meta.env.DEV) {
          console.log('📡 Realtime giacenza status:', status);
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (import.meta.env.DEV) {
        console.log('🔄 Cleanup subscription realtime giacenza');
      }

      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
        batchTimeoutRef.current = null;
      }

      // Processa batch finale prima del cleanup
      processBatch();

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Clear pending updates
      pendingUpdatesRef.current.clear();
    };
  }, [enabled, handleRealtimeEvent, processBatch]);

  // Funzione per marcare update come pending (evita eco locale)
  const markUpdatePending = useCallback((vinoId: string) => {
    pendingUpdatesRef.current.add(vinoId);
    
    // Auto-cleanup dopo 5 secondi (safety)
    setTimeout(() => {
      pendingUpdatesRef.current.delete(vinoId);
    }, 5000);
  }, []);

  // Status subscription
  const isConnected = channelRef.current?.state === 'joined';

  return {
    isConnected,
    markUpdatePending
  };
}

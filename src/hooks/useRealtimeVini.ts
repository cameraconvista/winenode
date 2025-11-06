import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface VinoRecord {
  id: string;
  nome_vino: string;
  tipologia: string;
  fornitore: string;
  vendita: number;
  costo: number;
  anno: number;
  provenienza: string;
  produttore: string;
}

interface UseRealtimeViniProps {
  onExternalChange?: () => void;
  enabled?: boolean;
}

/**
 * Hook per subscription realtime su tabella vini
 * Gestisce INSERT|UPDATE|DELETE con debounce e cleanup automatico
 * Non muta lo state locale - invoca callback per refresh esterno
 */
export function useRealtimeVini({
  onExternalChange,
  enabled = true
}: UseRealtimeViniProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced callback per evitare refresh multipli
  const triggerExternalChange = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      if (import.meta.env.DEV) {
        console.debug('🍷 vini realtime event (debounced) - triggering external refresh');
      }
      onExternalChange?.();
    }, 150); // Debounce 150ms come richiesto
  }, [onExternalChange]);

  // Handler per eventi realtime
  const handleRealtimeEvent = useCallback((payload: RealtimePostgresChangesPayload<VinoRecord>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    // Log eventi con ID per debugging
    const recordId = (newRecord as VinoRecord)?.id || (oldRecord as VinoRecord)?.id;
    const nomeVino = (newRecord as VinoRecord)?.nome_vino || (oldRecord as VinoRecord)?.nome_vino;
    
    if (import.meta.env.DEV) {
      console.debug('RT vini EVT', { type: eventType, id: recordId, nome: nomeVino });
    }

    // Per tutti gli eventi (INSERT/UPDATE/DELETE) triggera refresh esterno
    switch (eventType) {
      case 'INSERT':
      case 'UPDATE':
      case 'DELETE':
        triggerExternalChange();
        break;
    }
  }, [triggerExternalChange]);

  // Effetto principale per gestire subscription
  useEffect(() => {
    if (!enabled) {
      if (import.meta.env.DEV) {
        console.debug('🔇 Realtime vini disabilitato');
      }
      return;
    }

    // Guardia anti-duplica
    if (channelRef.current && channelRef.current.state !== 'closed') {
      if (import.meta.env.DEV) {
        console.debug('🔒 Vini channel già attivo, skip creazione:', channelRef.current.state);
      }
      return;
    }

    if (import.meta.env.DEV) {
      console.debug('🔄 Avvio subscription realtime vini...');
    }

    // Crea canale realtime per tabella vini
    const channel = supabase
      .channel('vini-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT | UPDATE | DELETE
          schema: 'public',
          table: 'vini'
        },
        handleRealtimeEvent
      )
      .subscribe((status) => {
        if (import.meta.env.DEV) {
          console.debug('RT vini subscription status:', status);
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (import.meta.env.DEV) {
        console.debug('🔄 Cleanup subscription realtime vini');
      }

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, handleRealtimeEvent]);

  return {
    // Nessun state esposto - solo cleanup gestito internamente
  };
}

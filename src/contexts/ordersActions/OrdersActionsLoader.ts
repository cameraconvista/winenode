import { useCallback } from 'react';
import { useSupabaseOrdini } from '../../hooks/useSupabaseOrdini';
import { useOrdersData } from '../orders/OrdersDataContext';
import { useOrdersActionsAudit } from './OrdersActionsAudit';

export function useOrdersActionsLoader() {
  const { setOrdiniInviati, setOrdiniStorico } = useOrdersData();
  const { logAuditEvent } = useOrdersActionsAudit();
  const supabaseOrdini = useSupabaseOrdini();

  const loadOrdiniFromSupabase = useCallback(async () => {
    try {
      logAuditEvent('LOAD_ORDINI', 'system', { source: 'supabase' });
      
      const result = await supabaseOrdini.loadOrdini();
      
      // Il servizio restituisce { inviati: Ordine[], storico: Ordine[] }
      const ordiniInviati = result.inviati || [];
      const ordiniStorico = result.storico || [];
      
      setOrdiniInviati(ordiniInviati);
      setOrdiniStorico(ordiniStorico);
      
      logAuditEvent('LOAD_ORDINI_SUCCESS', 'system', { 
        inviati: ordiniInviati.length, 
        storico: ordiniStorico.length 
      });
    } catch (error) {
      console.error('❌ Errore caricamento ordini:', error);
      logAuditEvent('LOAD_ORDINI_ERROR', 'system', { error: error.message });
    }
  }, [supabaseOrdini, setOrdiniInviati, setOrdiniStorico, logAuditEvent]);

  return {
    loadOrdiniFromSupabase
  };
}

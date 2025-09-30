import { useCallback } from 'react';
import { Ordine, OrdineDettaglio } from '../../services/ordiniService';
import { useSupabaseOrdini } from '../../hooks/useSupabaseOrdini';
import { useOrdersData } from '../orders/OrdersDataContext';
import { useOrdersActionsAudit } from './OrdersActionsAudit';

export function useOrdersActionsHandlers() {
  const { setOrdiniInviati, setOrdiniStorico } = useOrdersData();
  const { logAuditEvent } = useOrdersActionsAudit();
  const supabaseOrdini = useSupabaseOrdini();

  const aggiungiOrdine = useCallback(async (ordine: Omit<Ordine, 'id'>) => {
    console.log('💾 Salvando ordine in Supabase:', ordine);

    const ordineId = await supabaseOrdini.salvaOrdine(ordine);
    
    if (ordineId) {
      const nuovoOrdine: Ordine = {
        ...ordine,
        id: ordineId
      };

      // Verifica che l'ordine non esista già prima di aggiungerlo
      if (['sospeso', 'inviato'].includes(ordine.stato)) {
        setOrdiniInviati(prev => {
          const exists = prev.some(o => o.id === ordineId);
          if (exists) {
            console.log('⚠️ Ordine già presente, evito duplicazione:', ordineId);
            return prev;
          }
          return [nuovoOrdine, ...prev];
        });
      }
      
      console.log('✅ Ordine salvato e aggiunto al context:', ordineId);
      logAuditEvent('AGGIUNGI_ORDINE', ordineId, { fornitore: ordine.fornitore, totale: ordine.totale });
    } else {
      console.error('❌ Errore salvataggio ordine');
      logAuditEvent('AGGIUNGI_ORDINE_ERROR', 'unknown', { ordine });
    }
  }, [supabaseOrdini, setOrdiniInviati, logAuditEvent]);

  const aggiornaStatoOrdine = useCallback(async (ordineId: string, nuovoStato: Ordine['stato']) => {
    console.log('🔄 Aggiornando stato ordine in Supabase:', ordineId, '→', nuovoStato);
    
    const success = await supabaseOrdini.aggiornaStatoOrdine(ordineId, nuovoStato);
    
    if (success) {
      const aggiorna = (ordini: Ordine[]) =>
        ordini.map(ordine =>
          ordine.id === ordineId ? { ...ordine, stato: nuovoStato } : ordine
        );

      setOrdiniInviati(aggiorna);
      setOrdiniStorico(aggiorna);
      
      console.log('✅ Stato ordine aggiornato nel context');
      logAuditEvent('AGGIORNA_STATO_ORDINE', ordineId, { nuovoStato });
    } else {
      logAuditEvent('AGGIORNA_STATO_ORDINE_ERROR', ordineId, { nuovoStato });
    }
  }, [supabaseOrdini, setOrdiniInviati, setOrdiniStorico, logAuditEvent]);

  const aggiornaQuantitaOrdine = useCallback((ordineId: string, dettagli: OrdineDettaglio[]) => {
    console.log('📝 Aggiornando quantità ordine:', ordineId, dettagli);
    
    const nuoveTotali = dettagli.reduce((acc, item) => ({
      bottiglie: acc.bottiglie + (item.quantity * (item.unit === 'cartoni' ? 6 : 1)),
      totale: acc.totale + item.totalPrice
    }), { bottiglie: 0, totale: 0 });

    // Aggiorna ordiniInviati (per Gestione Ordini)
    setOrdiniInviati(prev =>
      prev.map(ordine =>
        ordine.id === ordineId
          ? {
              ...ordine,
              dettagli,
              bottiglie: nuoveTotali.bottiglie,
              totale: nuoveTotali.totale
            }
          : ordine
      )
    );

    logAuditEvent('AGGIORNA_QUANTITA_ORDINE', ordineId, { 
      dettagli: dettagli.length, 
      nuoveTotali 
    });
  }, [setOrdiniInviati, logAuditEvent]);

  const eliminaOrdineInviato = useCallback(async (ordineId: string) => {
    console.log('🗑️ Eliminando ordine inviato da Supabase:', ordineId);
    
    const success = await supabaseOrdini.eliminaOrdine(ordineId);
    
    if (success) {
      setOrdiniInviati(prev => {
        const ordine = prev.find(o => o.id === ordineId);
        if (ordine) {
          console.log('📋 Ordine inviato eliminato:', ordine.fornitore, '- €' + ordine.totale.toFixed(2));
          logAuditEvent('ELIMINA_ORDINE_INVIATO', ordineId, { 
            fornitore: ordine.fornitore, 
            totale: ordine.totale 
          });
        }
        return prev.filter(o => o.id !== ordineId);
      });
    } else {
      logAuditEvent('ELIMINA_ORDINE_INVIATO_ERROR', ordineId, {});
    }
  }, [supabaseOrdini, setOrdiniInviati, logAuditEvent]);

  const eliminaOrdineStorico = useCallback(async (ordineId: string) => {
    console.log('🗑️ Eliminando ordine storico da Supabase:', ordineId);
    
    const success = await supabaseOrdini.eliminaOrdine(ordineId);
    
    if (success) {
      setOrdiniStorico(prev => {
        const ordine = prev.find(o => o.id === ordineId);
        if (ordine) {
          console.log('📋 Ordine storico eliminato:', ordine.fornitore, '- €' + ordine.totale.toFixed(2));
          logAuditEvent('ELIMINA_ORDINE_STORICO', ordineId, { 
            fornitore: ordine.fornitore, 
            totale: ordine.totale 
          });
        }
        return prev.filter(o => o.id !== ordineId);
      });
    } else {
      logAuditEvent('ELIMINA_ORDINE_STORICO_ERROR', ordineId, {});
    }
  }, [supabaseOrdini, setOrdiniStorico, logAuditEvent]);

  return {
    aggiungiOrdine,
    aggiornaStatoOrdine,
    aggiornaQuantitaOrdine,
    eliminaOrdineInviato,
    eliminaOrdineStorico
  };
}

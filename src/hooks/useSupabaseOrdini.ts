import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Ordine, OrdineDettaglio } from '../contexts/OrdiniContext';

export function useSupabaseOrdini() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carica tutti gli ordini dal database
  const loadOrdini = async (): Promise<{
    inviati: Ordine[];
    ricevuti: Ordine[];
    storico: Ordine[];
  }> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Caricando ordini da Supabase...');

      const { data: ordiniData, error: ordiniError } = await supabase
        .from('ordini')
        .select(`
          id,
          fornitore,
          totale,
          bottiglie,
          data_ordine,
          stato,
          tipo,
          created_at,
          ordini_dettaglio (
            id,
            vino_id,
            nome_vino,
            quantita,
            unita,
            prezzo_unitario,
            prezzo_totale
          )
        `)
        .order('created_at', { ascending: false });

      if (ordiniError) {
        console.error('❌ Errore caricamento ordini:', ordiniError);
        throw ordiniError;
      }

      console.log('✅ Ordini caricati da Supabase:', ordiniData?.length || 0);

      // Mappa i dati dal database al formato dell'app
      const ordiniMappati: Ordine[] = (ordiniData || []).map(ordine => ({
        id: ordine.id,
        fornitore: ordine.fornitore || '',
        totale: ordine.totale || 0,
        bottiglie: ordine.bottiglie || 0,
        data: ordine.data_ordine || new Date().toLocaleDateString('it-IT'),
        stato: ordine.stato || 'in_corso',
        tipo: ordine.tipo || 'inviato',
        dettagli: (ordine.ordini_dettaglio || []).map((dettaglio: any) => ({
          wineId: dettaglio.vino_id?.toString() || '',
          wineName: dettaglio.nome_vino || '',
          quantity: dettaglio.quantita || 0,
          unit: dettaglio.unita || 'bottiglie',
          unitPrice: dettaglio.prezzo_unitario || 0,
          totalPrice: dettaglio.prezzo_totale || 0
        }))
      }));

      // Separa per tipo
      const inviati = ordiniMappati.filter(o => o.tipo === 'inviato' && o.stato !== 'completato');
      const ricevuti = ordiniMappati.filter(o => o.tipo === 'ricevuto' && o.stato !== 'completato');
      const storico = ordiniMappati.filter(o => o.stato === 'completato');

      return { inviati, ricevuti, storico };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      console.error('❌ Errore caricamento ordini:', errorMessage);
      setError(errorMessage);
      return { inviati: [], ricevuti: [], storico: [] };
    } finally {
      setLoading(false);
    }
  };

  // Salva un nuovo ordine
  const salvaOrdine = async (ordine: Omit<Ordine, 'id'>): Promise<string | null> => {
    try {
      console.log('💾 Salvando ordine:', ordine.fornitore);

      const { data, error } = await supabase
        .from('ordini')
        .insert({
          fornitore: ordine.fornitore,
          totale: ordine.totale,
          bottiglie: ordine.bottiglie,
          data_ordine: ordine.data,
          stato: ordine.stato,
          tipo: ordine.tipo
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Errore salvataggio ordine:', error);
        throw error;
      }

      console.log('✅ Ordine salvato:', data.id);

      // Salva i dettagli se presenti
      if (ordine.dettagli && ordine.dettagli.length > 0) {
        const dettagliData = ordine.dettagli.map(dettaglio => ({
          ordine_id: data.id,
          vino_id: parseInt(dettaglio.wineId) || null,
          nome_vino: dettaglio.wineName,
          quantita: dettaglio.quantity,
          unita: dettaglio.unit,
          prezzo_unitario: dettaglio.unitPrice,
          prezzo_totale: dettaglio.totalPrice
        }));

        const { error: dettagliError } = await supabase
          .from('ordini_dettaglio')
          .insert(dettagliData);

        if (dettagliError) {
          console.error('❌ Errore salvataggio dettagli:', dettagliError);
          // Non blocchiamo per errori dettagli
        } else {
          console.log('✅ Dettagli ordine salvati');
        }
      }

      return data.id;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore salvataggio';
      console.error('❌ Errore salvataggio ordine:', errorMessage);
      setError(errorMessage);
      return null;
    }
  };

  // Aggiorna stato ordine
  const aggiornaStatoOrdine = async (ordineId: string, nuovoStato: Ordine['stato']): Promise<boolean> => {
    try {
      console.log('🔄 Aggiornando stato ordine:', ordineId, '→', nuovoStato);

      const { error } = await supabase
        .from('ordini')
        .update({ stato: nuovoStato })
        .eq('id', ordineId);

      if (error) {
        console.error('❌ Errore aggiornamento stato:', error);
        throw error;
      }

      console.log('✅ Stato ordine aggiornato');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore aggiornamento';
      console.error('❌ Errore aggiornamento stato:', errorMessage);
      setError(errorMessage);
      return false;
    }
  };

  // Elimina ordine
  const eliminaOrdine = async (ordineId: string): Promise<boolean> => {
    try {
      console.log('🗑️ Eliminando ordine:', ordineId);

      // Prima elimina i dettagli (CASCADE dovrebbe farlo automaticamente)
      const { error: dettagliError } = await supabase
        .from('ordini_dettaglio')
        .delete()
        .eq('ordine_id', ordineId);

      if (dettagliError) {
        console.warn('⚠️ Errore eliminazione dettagli:', dettagliError);
      }

      // Poi elimina l'ordine
      const { error } = await supabase
        .from('ordini')
        .delete()
        .eq('id', ordineId);

      if (error) {
        console.error('❌ Errore eliminazione ordine:', error);
        throw error;
      }

      console.log('✅ Ordine eliminato');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore eliminazione';
      console.error('❌ Errore eliminazione ordine:', errorMessage);
      setError(errorMessage);
      return false;
    }
  };

  return {
    loading,
    error,
    loadOrdini,
    salvaOrdine,
    aggiornaStatoOrdine,
    eliminaOrdine
  };
}

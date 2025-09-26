import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Ordine, OrdineDettaglio } from '../contexts/OrdiniContext';

export function useSupabaseOrdini() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carica tutti gli ordini dal database
  const loadOrdini = async (): Promise<{
    inviati: Ordine[];
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
          contenuto,
          stato,
          data,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (ordiniError) {
        console.error('❌ Errore caricamento ordini:', ordiniError);
        throw ordiniError;
      }

      console.log('✅ Ordini caricati da Supabase:', ordiniData?.length || 0);

      // Mappa i dati dal database al formato dell'app
      const ordiniMappati: Ordine[] = (ordiniData || []).map(ordine => {
        const contenuto = ordine.contenuto || {};
        
        // Gestisce sia il formato nuovo (oggetto con fornitore_nome e dettagli) che quello vecchio (array)
        const dettagliArray = contenuto.dettagli || (Array.isArray(contenuto) ? contenuto : []);
        const fornitoreNome = contenuto.fornitore_nome || 'Fornitore sconosciuto';
        
        const bottiglie = Array.isArray(dettagliArray) ? dettagliArray.reduce((sum: number, item: any) => {
          const qty = item.quantita || item.quantity || 0;
          const multiplier = (item.unit || item.unita) === 'cartoni' ? 6 : 1;
          return sum + (qty * multiplier);
        }, 0) : 0;

        const dettagli = Array.isArray(dettagliArray) ? dettagliArray.map((item: any) => ({
          wineId: item.wineId || item.vino_id?.toString() || '',
          wineName: item.nome || item.wineName || item.nome_vino || '',
          quantity: item.quantita || item.quantity || 0,
          unit: (item.unit || item.unita || 'bottiglie') as 'bottiglie' | 'cartoni',
          unitPrice: item.prezzo_unitario || item.unitPrice || 0,
          totalPrice: item.prezzo_totale || item.totalPrice || 0
        })) : [];

        // Converti timestamp database in formato italiano per visualizzazione
        const dataVisualizzazione = (() => {
          if (ordine.data) {
            const dataObj = new Date(ordine.data);
            return dataObj.toLocaleDateString('it-IT');
          }
          return new Date().toLocaleDateString('it-IT');
        })();

        return {
          id: ordine.id,
          fornitore: fornitoreNome,
          totale: ordine.totale || 0,
          bottiglie,
          data: dataVisualizzazione,
          stato: ordine.stato || 'sospeso',
          tipo: 'inviato', // Default per compatibilità
          dettagli
        };
      });

      // Separa per stato - solo inviati e archiviati
      const inviati = ordiniMappati.filter(o => o.stato === 'sospeso' || o.stato === 'inviato');
      const storico = ordiniMappati.filter(o => o.stato === 'archiviato');

      return { inviati, storico };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      console.error('❌ Errore caricamento ordini:', errorMessage);
      setError(errorMessage);
      return { inviati: [], storico: [] };
    } finally {
      setLoading(false);
    }
  };

  // Salva un nuovo ordine
  const salvaOrdine = async (ordine: Omit<Ordine, 'id'>): Promise<string | null> => {
    try {
      console.log('💾 Salvando ordine:', ordine.fornitore);

      // Prepara il contenuto JSONB con i dettagli dell'ordine e info fornitore
      const contenutoOrdine = {
        fornitore_nome: ordine.fornitore, // Salviamo il nome del fornitore
        dettagli: ordine.dettagli?.map(dettaglio => ({
          wineId: dettaglio.wineId,
          nome: dettaglio.wineName,
          quantita: dettaglio.quantity,
          unit: dettaglio.unit,
          prezzo_unitario: dettaglio.unitPrice,
          prezzo_totale: dettaglio.totalPrice
        })) || []
      };

      // Genera un UUID fittizio per il fornitore (compatibilità con schema database)
      const fornitoreUuid = '00000000-0000-0000-0000-000000000001';

      // Converti la data dal formato italiano (DD/MM/YYYY) al formato timestamp ISO per Supabase
      const dataTimestamp = (() => {
        if (ordine.data.includes('/')) {
          const [giorno, mese, anno] = ordine.data.split('/');
          const dataObj = new Date(parseInt(anno), parseInt(mese) - 1, parseInt(giorno));
          return dataObj.toISOString();
        }
        // Se è già una data, convertila in timestamp
        const dataObj = new Date(ordine.data);
        return dataObj.toISOString();
      })();

      console.log('📅 Convertendo data:', ordine.data, '→', dataTimestamp);

      const { data, error } = await supabase
        .from('ordini')
        .insert({
          fornitore: fornitoreUuid,
          totale: ordine.totale,
          contenuto: contenutoOrdine,
          data: dataTimestamp,
          stato: ordine.stato,
          user_id: '00000000-0000-0000-0000-000000000001'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Errore salvataggio ordine:', error);
        throw error;
      }

      console.log('✅ Ordine salvato:', data.id);

      // I dettagli sono già salvati nel campo contenuto JSONB
      console.log('✅ Ordine e dettagli salvati nel campo contenuto JSONB');

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

      // Elimina l'ordine (i dettagli sono nel campo contenuto JSONB)
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

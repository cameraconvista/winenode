
import { useState, useEffect } from 'react';
import { supabase, authManager } from '../lib/supabase';

export interface OrdineDettaglio {
  id: string;
  vino_id: number;
  quantita_ordinata: number;
  quantita_ricevuta?: number;
  prezzo_unitario: number;
  subtotale: number;
  // Dati del vino (join)
  nome_vino?: string;
  produttore?: string;
  anno?: string;
}

export interface Ordine {
  id: string;
  user_id: string;
  fornitore: string;
  stato: 'sospeso' | 'inviato' | 'ricevuto' | 'archiviato';
  data_ordine: string;
  data_invio_whatsapp?: string;
  data_ricevimento?: string;
  totale_euro: number;
  note?: string;
  created_at: string;
  updated_at: string;
  dettagli?: OrdineDettaglio[];
}

export function useOrdini() {
  const [ordini, setOrdini] = useState<Ordine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = authManager.getUserId();

  // Carica tutti gli ordini dell'utente
  const loadOrdini = async (stato?: string) => {
    if (!supabase || !userId) return;

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('ordini')
        .select(`
          *
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (stato) {
        query = query.eq('stato', stato);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Trasforma i dati per il frontend
      const ordiniConDettagli = data?.map(ordine => ({
        ...ordine,
        dettagli: [] // Temporaneamente vuoto fino a fix database
      })) || [];

      setOrdini(ordiniConDettagli);
    } catch (err) {
      console.error('Errore caricamento ordini:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsLoading(false);
    }
  };

  // Salva nuovo ordine
  const salvaOrdine = async (ordineData: {
    fornitore: string;
    vini: Array<{
      id: number;
      nome: string;
      quantita: number;
      giacenza_attuale: number;
      prezzo_unitario: number;
    }>;
    totale: number;
  }) => {
    if (!supabase || !userId) return null;

    try {
      // 1. Inserisci ordine principale
      const { data: ordine, error: ordineError } = await supabase
        .from('ordini')
        .insert({
          user_id: userId,
          fornitore: ordineData.fornitore,
          stato: 'sospeso',
          totale_euro: ordineData.totale,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (ordineError) throw ordineError;

      // 2. Inserisci dettagli ordine
      const dettagli = ordineData.vini.map(vino => ({
        ordine_id: ordine.id,
        vino_id: vino.id,
        quantita_ordinata: vino.quantita,
        prezzo_unitario: vino.prezzo_unitario
      }));

      const { error: dettagliError } = await supabase
        .from('ordini_dettaglio')
        .insert(dettagli);

      if (dettagliError) throw dettagliError;

      console.log('✅ Ordine salvato con successo:', ordine.id);
      
      // Ricarica gli ordini
      await loadOrdini();
      
      return ordine.id;
    } catch (err) {
      console.error('❌ Errore salvataggio ordine:', err);
      setError(err instanceof Error ? err.message : 'Errore salvataggio ordine');
      return null;
    }
  };

  // Aggiorna stato ordine
  const aggiornaStatoOrdine = async (ordineId: string, nuovoStato: string, datiAggiuntivi?: any) => {
    if (!supabase) return false;

    try {
      const updateData: any = { 
        stato: nuovoStato,
        updated_at: new Date().toISOString()
      };

      if (nuovoStato === 'inviato') {
        updateData.data_invio_whatsapp = new Date().toISOString();
      } else if (nuovoStato === 'ricevuto') {
        updateData.data_ricevimento = new Date().toISOString();
      }

      if (datiAggiuntivi) {
        Object.assign(updateData, datiAggiuntivi);
      }

      const { error } = await supabase
        .from('ordini')
        .update(updateData)
        .eq('id', ordineId);

      if (error) throw error;

      console.log('✅ Stato ordine aggiornato:', ordineId, nuovoStato);
      await loadOrdini();
      return true;
    } catch (err) {
      console.error('❌ Errore aggiornamento stato ordine:', err);
      setError(err instanceof Error ? err.message : 'Errore aggiornamento ordine');
      return false;
    }
  };

  // Conferma ricevimento ordine e aggiorna giacenze
  const confermaRicevimento = async (ordineId: string, quantitaRicevute: Record<string, number>) => {
    if (!supabase) return false;

    try {
      // 1. Aggiorna quantità ricevute nei dettagli
      for (const [dettaglioId, quantita] of Object.entries(quantitaRicevute)) {
        const { error: dettaglioError } = await supabase
          .from('ordini_dettaglio')
          .update({ 
            quantita_ricevuta: quantita,
            updated_at: new Date().toISOString()
          })
          .eq('id', dettaglioId);

        if (dettaglioError) throw dettaglioError;
      }

      // 2. Ottieni i dettagli completi per aggiornare le giacenze
      const { data: dettagli, error: dettagliError } = await supabase
        .from('ordini_dettaglio')
        .select('vino_id, quantita_ricevuta')
        .eq('ordine_id', ordineId)
        .not('quantita_ricevuta', 'is', null);

      if (dettagliError) throw dettagliError;

      // 3. Aggiorna giacenze vini
      for (const dettaglio of dettagli || []) {
        const { error: vinoError } = await supabase.rpc('incrementa_giacenza', {
          p_vino_id: dettaglio.vino_id,
          p_quantita: dettaglio.quantita_ricevuta
        });

        if (vinoError) {
          // Fallback se la funzione RPC non esiste
          const { data: vino } = await supabase
            .from('vini')
            .select('giacenza')
            .eq('id', dettaglio.vino_id)
            .single();

          if (vino) {
            await supabase
              .from('vini')
              .update({ 
                giacenza: (vino.giacenza || 0) + dettaglio.quantita_ricevuta 
              })
              .eq('id', dettaglio.vino_id);
          }
        }
      }

      // 4. Aggiorna stato ordine a ricevuto
      await aggiornaStatoOrdine(ordineId, 'ricevuto');

      console.log('✅ Ricevimento confermato e giacenze aggiornate');
      return true;
    } catch (err) {
      console.error('❌ Errore conferma ricevimento:', err);
      setError(err instanceof Error ? err.message : 'Errore conferma ricevimento');
      return false;
    }
  };

  // Carica ordini all'avvio
  useEffect(() => {
    if (userId) {
      loadOrdini();
    }
  }, [userId]);

  return {
    ordini,
    isLoading,
    error,
    loadOrdini,
    salvaOrdine,
    aggiornaStatoOrdine,
    confermaRicevimento,
    refreshOrdini: () => loadOrdini()
  };
}

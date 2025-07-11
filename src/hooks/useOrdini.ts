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
  fornitore_nome?: string; // Nome del fornitore per il display
  stato: 'sospeso' | 'inviato' | 'ricevuto' | 'archiviato';
  data: string;
  data_invio_whatsapp?: string;
  data_ricevimento?: string;
  totale: number;
  contenuto: string;
  created_at?: string;
  updated_at?: string;
  dettagli?: OrdineDettaglio[];
  fornitori?: { fornitore: string }; // Join data
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
          id,
          fornitore,
          contenuto,
          totale,
          data,
          stato,
          user_id,
          data_invio_whatsapp,
          data_ricevimento,
          created_at,
          updated_at,
          fornitori!inner(fornitore)
        `)
        .eq('user_id', userId)
        .order('data', { ascending: false });

      if (stato) {
        query = query.eq('stato', stato);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Trasforma i dati per il frontend
      const ordiniConDettagli = data?.map(ordine => ({
        ...ordine,
        fornitore_nome: ordine.fornitori?.fornitore || 'Fornitore sconosciuto',
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

  // Assicurati che il fornitore esista nella tabella fornitori
  const assicuraFornitoreEsiste = async (nomeFornitore: string) => {
    if (!supabase || !userId) return null;

    try {
      // Prima controlla se esiste già
      const { data: esistente, error: checkError } = await supabase
        .from('fornitori')
        .select('id')
        .eq('fornitore', nomeFornitore)
        .eq('user_id', userId)
        .single();

      if (esistente) {
        return esistente.id;
      }

      // Se non esiste, crealo
      const { data: nuovoFornitore, error: createError } = await supabase
        .from('fornitori')
        .insert({
          user_id: userId,
          fornitore: nomeFornitore
        })
        .select('id')
        .single();

      if (createError) throw createError;

      console.log('✅ Nuovo fornitore creato:', nomeFornitore, nuovoFornitore.id);
      return nuovoFornitore.id;
    } catch (err) {
      console.error('❌ Errore gestione fornitore:', err);
      throw err;
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
      // 1. Assicurati che il fornitore esista e ottieni il suo ID
      const fornitoreId = await assicuraFornitoreEsiste(ordineData.fornitore);
      if (!fornitoreId) {
        throw new Error(`Impossibile creare/trovare fornitore "${ordineData.fornitore}"`);
      }

      // 2. Inserisci ordine principale con l'ID del fornitore
      const { data: ordine, error: ordineError } = await supabase
        .from('ordini')
        .insert({
          user_id: userId,
          fornitore: fornitoreId, // Usa l'ID UUID del fornitore
          stato: 'sospeso',
          totale: ordineData.totale,
          data: new Date().toISOString().split('T')[0], // Solo data YYYY-MM-DD
          contenuto: ordineData.vini.map(v => `${v.nome} (${v.quantita})`).join(', ')
        })
        .select()
        .single();

      if (ordineError) throw ordineError;

      // 3. Inserisci dettagli ordine
      const dettagli = ordineData.vini.map(vino => ({
        ordine_id: ordine.id,
        vino_id: parseInt(vino.id.toString()) || 0, // Assicurati che sia un numero intero
        quantita_ordinata: vino.quantita,
        prezzo_unitario: vino.prezzo_unitario,
        subtotale: vino.quantita * vino.prezzo_unitario
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
        stato: nuovoStato
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
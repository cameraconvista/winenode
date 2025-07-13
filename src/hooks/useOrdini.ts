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
  fornitore: string; // UUID del fornitore (FK verso tabella fornitori)
  fornitore_nome?: string; // Nome del fornitore per il display (da JOIN)
  stato: 'sospeso' | 'inviato' | 'ricevuto' | 'archiviato';
  data: string; // TIMESTAMP - campo corretto della tabella
  data_invio_whatsapp?: string;
  data_ricevimento?: string;
  totale: number; // NUMERIC(10,2) - campo corretto della tabella
  contenuto: any; // JSONB - può essere oggetto o array, non stringa
  created_at?: string;
  updated_at?: string;
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
          updated_at
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
        fornitore_nome: ordine.fornitore || 'Fornitore sconosciuto', // Il campo 'fornitore' contiene già il nome
        dettagli: [] // Temporaneamente vuoto
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
    fornitore_id?: string;
    vini: Array<{
      id: number;
      nome: string;
      quantita: number;
      giacenza_attuale: number;
      prezzo_unitario: number;
    }>;
    totale: number;
  }) => {
    try {
      setIsLoading(true);
      console.log('✅ Conferma ordine diretta - salvataggio:', ordineData);

      const user = supabase.auth.getUser();
      if (!user) {
        throw new Error('Utente non autenticato');
      }

      // Se abbiamo fornitore_id, usalo; altrimenti cerca l'ID dal nome
      let fornitoreId = ordineData.fornitore_id;
      
      if (!fornitoreId) {
        console.log('🔍 Ricerca ID fornitore per nome:', ordineData.fornitore);
        const { data: fornitoreData, error: fornitoreError } = await supabase
          .from('fornitori')
          .select('id')
          .eq('nome', ordineData.fornitore)
          .eq('user_id', (await user).data.user?.id)
          .single();
        
        if (fornitoreError || !fornitoreData) {
          console.error('❌ Fornitore non trovato:', ordineData.fornitore);
          throw new Error(`Fornitore "${ordineData.fornitore}" non trovato`);
        }
        
        fornitoreId = fornitoreData.id;
        console.log('✅ ID fornitore trovato:', fornitoreId);
      }

      // Prepara il contenuto JSON nel formato corretto
      const contenutoJSON = ordineData.vini.map(vino => ({
        nome: vino.nome,
        quantita: vino.quantita,
        prezzo_unitario: vino.prezzo_unitario,
        giacenza_attuale: vino.giacenza_attuale
      }));

      // Prepara i dati dell'ordine con la struttura corretta
      const ordine = {
        user_id: (await user).data.user?.id,
        fornitore: fornitoreId, // Usa sempre l'ID UUID
        data: new Date().toISOString(), // Campo 'data' invece di 'data_ordine'
        totale: ordineData.totale,      // Campo 'totale' invece di 'totale_euro'
        stato: 'sospeso',
        contenuto: contenutoJSON        // JSON diretto, non stringificato
      };

      console.log('📝 Dati ordine preparati:', ordine);

      const { data: nuovoOrdine, error: ordineError } = await supabase
        .from('ordini')
        .insert([ordine])
        .select()
        .single();

      if (ordineError) {
        console.error('❌ Errore nel salvare l\'ordine:', ordineError);
        throw ordineError;
      }

      console.log('✅ Ordine salvato con successo:', nuovoOrdine);
      await loadOrdini();
      return nuovoOrdine;

    } catch (error) {
      console.error('❌ Errore nel salvataggio ordine:', error);
      setError(error instanceof Error ? error.message : 'Errore sconosciuto');
      return null;
    } finally {
      setIsLoading(false);
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
    refreshOrdini: () => loadOrdini()
  };
}
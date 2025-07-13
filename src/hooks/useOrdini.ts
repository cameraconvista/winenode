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
  fornitore: string; // UUID del fornitore
  fornitore_nome?: string; // Nome del fornitore per il display (da JOIN)
  stato: 'sospeso' | 'inviato' | 'ricevuto' | 'archiviato';
  data: string; // CORREZIONE: era data_ordine ma nella tabella è solo 'data'
  data_invio_whatsapp?: string;
  data_ricevimento?: string;
  totale: number;
  contenuto: string; // JSONB contenuto
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
          updated_at,
          fornitori:fornitore (
            nome
          )
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
        fornitore_nome: ordine.fornitori?.nome || 'Fornitore sconosciuto',
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
      // Inserisci ordine principale
      const { data: ordine, error: ordineError } = await supabase
        .from('ordini')
        .insert({
          user_id: userId,
          fornitore: ordineData.fornitore, // UUID del fornitore
          stato: 'sospeso',
          totale: ordineData.totale,
          data: new Date().toISOString(), // CORREZIONE: timestamp completo
          contenuto: JSON.stringify(ordineData.vini.map(v => ({
            nome: v.nome,
            quantita: v.quantita,
            prezzo_unitario: v.prezzo_unitario
          }))) // CORREZIONE: salva come JSON strutturato
        })
        .select()
        .single();

      if (ordineError) throw ordineError;

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
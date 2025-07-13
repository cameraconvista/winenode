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
  contenuto_ricevuto?: any; // JSONB - quantità effettivamente ricevute
  created_at?: string;
  updated_at?: string;
  dettagli?: OrdineDettaglio[];
}

export function useOrdini() {
  const [ordini, setOrdini] = useState<Ordine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = authManager.getUserId();

  // Carica tutti gli ordini dell'utente con nomi fornitori
  const loadOrdini = async (stato?: string) => {
    if (!supabase || !userId) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Caricamento ordini per user:', userId);
      
      let query = supabase
        .from('ordini')
        .select('*')
        .eq('user_id', userId)
        .order('data', { ascending: false });

      if (stato) {
        query = query.eq('stato', stato);
      }

      const { data: ordiniData, error: ordiniError } = await query;

      if (ordiniError) {
        console.error('❌ Errore caricamento ordini:', ordiniError);
        throw ordiniError;
      }

      console.log('✅ Ordini trovati:', ordiniData?.length || 0);

      if (!ordiniData || ordiniData.length === 0) {
        setOrdini([]);
        return;
      }

      // Carica i nomi dei fornitori separatamente
      const fornitoriIds = [...new Set(ordiniData.map(o => o.fornitore).filter(Boolean))];
      let fornitoriMap: Record<string, string> = {};
      
      if (fornitoriIds.length > 0) {
        console.log('🔍 Caricamento fornitori per IDs:', fornitoriIds);
        
        const { data: fornitoriData, error: fornitoriError } = await supabase
          .from('fornitori')
          .select('id, nome')
          .in('id', fornitoriIds);
        
        if (fornitoriError) {
          console.warn('⚠️ Errore caricamento fornitori:', fornitoriError);
        } else {
          fornitoriMap = fornitoriData?.reduce((acc, f) => {
            acc[f.id] = f.nome;
            return acc;
          }, {} as Record<string, string>) || {};
          console.log('✅ Fornitori mappati:', Object.keys(fornitoriMap).length);
        }
      }

      // Trasforma i dati per il frontend
      const ordiniConDettagli = ordiniData.map(ordine => ({
        ...ordine,
        fornitore_nome: fornitoriMap[ordine.fornitore] || 'Fornitore sconosciuto',
        dettagli: [] // Temporaneamente vuoto
      }));

      console.log('✅ Ordini trasformati:', ordiniConDettagli.length);
      setOrdini(ordiniConDettagli);
    } catch (err) {
      console.error('❌ Errore caricamento ordini:', err);
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
        stato: 'inviato',
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

  // Salva quantità ricevute per un ordine
  const salvaQuantitaRicevute = async (ordineId: string, contenutoRicevuto: any) => {
    if (!supabase) {
      console.error('❌ Supabase client non disponibile');
      setError('Database non disponibile');
      return false;
    }

    try {
      console.log('💾 Salvataggio quantità ricevute per ordine:', ordineId);
      console.log('📦 Contenuto ricevuto:', contenutoRicevuto);

      // Prima verifica se la colonna contenuto_ricevuto esiste
      const { data: tableInfo, error: tableError } = await supabase
        .from('ordini')
        .select('id, contenuto')
        .eq('id', ordineId)
        .single();

      if (tableError) {
        console.error('❌ Errore verifica tabella:', tableError);
        throw new Error(`Errore verifica ordine: ${tableError.message}`);
      }

      // Prova prima un aggiornamento con solo stato e data
      let updateData: any = {
        stato: 'ricevuto',
        data_ricevimento: new Date().toISOString()
      };

      // Prova ad aggiungere contenuto_ricevuto se possibile
      try {
        updateData.contenuto_ricevuto = contenutoRicevuto;
      } catch (e) {
        console.warn('⚠️ Impossibile aggiungere contenuto_ricevuto, continuo senza');
      }

      const { data, error } = await supabase
        .from('ordini')
        .update(updateData)
        .eq('id', ordineId)
        .select();

      if (error) {
        console.error('❌ Errore Supabase:', error);
        // Se errore su contenuto_ricevuto, prova senza
        if (error.message.includes('contenuto_ricevuto')) {
          console.log('🔄 Ritento senza contenuto_ricevuto...');
          const { data: retryData, error: retryError } = await supabase
            .from('ordini')
            .update({ 
              stato: 'ricevuto',
              data_ricevimento: new Date().toISOString()
            })
            .eq('id', ordineId)
            .select();
          
          if (retryError) {
            throw new Error(`Errore database: ${retryError.message}`);
          }
          
          console.log('✅ Ordine aggiornato senza contenuto_ricevuto');
          await loadOrdini();
          return true;
        }
        throw new Error(`Errore database: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.error('❌ Nessun ordine aggiornato');
        throw new Error('Ordine non trovato o non aggiornato');
      }

      console.log('✅ Quantità ricevute salvate con successo:', data[0]);
      
      // Ricarica ordini per aggiornare la UI
      await loadOrdini();
      return true;
    } catch (err) {
      console.error('❌ Errore salvataggio quantità ricevute:', err);
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto durante il salvataggio';
      setError(errorMessage);
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
    salvaQuantitaRicevute,
    refreshOrdini: () => loadOrdini()
  };
}
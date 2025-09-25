import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Ordine, OrdineDettaglio } from '../contexts/OrdiniContext';

// Mapping stati tra interfaccia UI e database
const mapStatoUIToDatabase = (statoUI: string): string => {
  const mapping: Record<string, string> = {
    'in_corso': 'sospeso',
    'completato': 'archiviato',
    'annullato': 'archiviato'
  };
  return mapping[statoUI] || 'sospeso';
};

const mapStatoDatabaseToUI = (statoDB: string): 'in_corso' | 'completato' | 'annullato' => {
  const mapping: Record<string, 'in_corso' | 'completato' | 'annullato'> = {
    'sospeso': 'in_corso',
    'inviato': 'in_corso',
    'ricevuto': 'completato',
    'archiviato': 'completato'
  };
  return mapping[statoDB] || 'in_corso';
};

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

      // Query semplificata senza JOIN problematico
      const { data: ordiniData, error: ordiniError } = await supabase
        .from('ordini')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordiniError) {
        console.error('❌ Errore caricamento ordini:', ordiniError);
        throw ordiniError;
      }

      console.log('✅ Ordini caricati da Supabase:', ordiniData?.length || 0);
      console.log('📋 Schema ordini effettivo:', ordiniData?.[0] ? Object.keys(ordiniData[0]) : 'Nessun ordine');
      console.log('📋 Dati ordini completi:', ordiniData);

      // Prima ottieni tutti i fornitori per il mapping
      const { data: fornitoriData } = await supabase
        .from('fornitori')
        .select('id, nome');

      const fornitoriMap = new Map();
      (fornitoriData || []).forEach(f => fornitoriMap.set(f.id, f.nome));

      // Mappa i dati dal database al formato dell'app
      const ordiniMappati: Ordine[] = (ordiniData || []).map(ordine => {
        // Usa contenuto JSONB o fallback vuoto
        const dettagli = Array.isArray(ordine.contenuto) ? ordine.contenuto : [];

        // Calcola bottiglie totali dai dettagli
        const bottiglie = dettagli.reduce((sum, det) => {
          const multiplier = det.unit === 'cartoni' ? 6 : 1;
          return sum + (det.quantity * multiplier);
        }, 0);

        // Deriva tipo dallo stato (per compatibilità)
        const tipo = ordine.stato === 'completato' ? 'ricevuto' : 'inviato';

        return {
          id: ordine.id,
          fornitore: fornitoriMap.get(ordine.fornitore) || 'Fornitore sconosciuto',
          // Usa il nome corretto per il totale
          totale: ordine.totale || 0,
          // Usa il nome corretto per la data
          data: ordine.data ? new Date(ordine.data).toLocaleDateString('it-IT') : 
                new Date().toLocaleDateString('it-IT'),
          stato: mapStatoDatabaseToUI(ordine.stato || 'sospeso'),
          dettagli,
          bottiglie,
          tipo
        };
      });

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

      // Prima trova l'UUID del fornitore dal nome
      console.log('🔍 Cercando fornitore:', ordine.fornitore);
      let { data: fornitoreData, error: fornitoreError } = await supabase
        .from('fornitori')
        .select('id, nome')
        .eq('nome', ordine.fornitore)
        .single();

      console.log('📋 Risultato ricerca fornitore:', { fornitoreData, fornitoreError });

      if (fornitoreError || !fornitoreData) {
        console.error('❌ Fornitore non trovato:', ordine.fornitore);
        
        // Mostra tutti i fornitori disponibili per debug
        const { data: allFornitori } = await supabase
          .from('fornitori')
          .select('id, nome');
        console.log('📋 Fornitori disponibili:', allFornitori);
        
        // Crea automaticamente il fornitore se non esiste
        console.log('🔧 Creando fornitore automaticamente:', ordine.fornitore);
        const { SERVICE_USER_ID } = await import('../config/constants');
        
        const { data: nuovoFornitore, error: creazioneError } = await supabase
          .from('fornitori')
          .insert({
            user_id: SERVICE_USER_ID,
            nome: ordine.fornitore
          })
          .select('id, nome')
          .single();
          
        if (creazioneError || !nuovoFornitore) {
          console.error('❌ Errore creazione fornitore:', creazioneError);
          throw new Error(`Impossibile creare fornitore "${ordine.fornitore}"`);
        }
        
        console.log('✅ Fornitore creato automaticamente:', nuovoFornitore);
        // Usa il fornitore appena creato
        fornitoreData = nuovoFornitore;
      }

      console.log('✅ Fornitore trovato:', fornitoreData.id);

      // Usa SERVICE_USER_ID fisso (modalità tenant unico)
      const { SERVICE_USER_ID } = await import('../config/constants');
      console.log('🔧 Usando SERVICE_USER_ID:', SERVICE_USER_ID);

      const { data, error } = await supabase
        .from('ordini')
        .insert({
          user_id: SERVICE_USER_ID,
          fornitore: fornitoreData.id,
          totale: ordine.totale,
          data: new Date().toISOString(),
          stato: mapStatoUIToDatabase(ordine.stato), // Mappa stato UI a database
          contenuto: ordine.dettagli || []
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Errore salvataggio ordine - Dettagli completi:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.error('❌ Payload inviato:', {
          user_id: SERVICE_USER_ID,
          fornitore: fornitoreData.id,
          totale: ordine.totale,
          data: new Date().toISOString(),
          stato: ordine.stato,
          contenuto: ordine.dettagli || []
        });
        throw error;
      }

      console.log('✅ Ordine salvato:', data.id);
      console.log('✅ Dettagli ordine salvati in contenuto JSONB');
      console.log('📋 Dati ordine salvato completi:', data);

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

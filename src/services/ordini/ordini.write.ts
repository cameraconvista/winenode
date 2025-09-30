import { supabase } from '../../lib/supabase';
import { cache } from '../shared/cache';
import { Ordine, OrdineDettaglio } from './types';
import { ensureFornitoreIdResolved, normalizeOrdineDate } from './ordini.validation';
import { calculateTotals } from './ordini.transforms';
import { FORNITORE_UUID_COL, DATA_COL, DATA_COLUMN_TYPE } from './ordini.constants';

// Crea nuovo ordine
export async function createOrdine(ordine: Omit<Ordine, 'id'>): Promise<string> {
  console.log('📝 Creando nuovo ordine:', ordine);

  try {
    // 1. Normalizza la data per Postgres
    const ordineNormalized = normalizeOrdineDate(ordine);
    
    // 2. Risolvi UUID fornitore se necessario
    const ordineWithFornitoreId = await ensureFornitoreIdResolved(ordineNormalized);

    // 3. Sanifica valori numerici
    const totale = Number(ordineWithFornitoreId.totale);

    if (isNaN(totale)) {
      throw new Error('Valore totale non valido');
    }

    // 4. Costruisci payload per DB
    const dbDateValue = DATA_COLUMN_TYPE === 'timestamp' 
      ? new Date(ordineWithFornitoreId.data + 'T00:00:00.000Z').toISOString()
      : ordineWithFornitoreId.data;

    const payloadSanitized = {
      [FORNITORE_UUID_COL]: ordineWithFornitoreId.fornitoreId, // UUID fornitore
      totale: totale,
      [DATA_COL]: dbDateValue,
      stato: ordineWithFornitoreId.stato || 'sospeso',
      contenuto: JSON.stringify(ordineWithFornitoreId.dettagli || [])
    };

    const { data, error } = await supabase
      .from('ordini')
      .insert(payloadSanitized)
      .select('id')
      .single();

    if (error) {
      console.error('❌ Errore nella creazione ordine:', error);
      throw new Error(`Errore nella creazione ordine: ${error.message}`);
    }

    console.log('✅ Ordine creato con ID:', data.id);
    
    // Invalida cache ordini dopo creazione
    cache.invalidate('ordini');
    
    return data.id;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('INVALID_DATE')) {
        console.error('❌ Data ordine non valida (atteso DD/MM/YYYY o YYYY-MM-DD)');
        throw new Error('Data ordine non valida. Formato atteso: DD/MM/YYYY');
      }
      if (error.message.includes('FORNITORE_ID_INVALID')) {
        console.error('❌ ID fornitore non valido (atteso UUID)');
        throw new Error('ID fornitore non valido');
      }
    }
    throw error;
  }
}

// Aggiorna stato ordine
export async function updateStatoOrdine(ordineId: string, nuovoStato: Ordine['stato']): Promise<boolean> {
  console.log(`🔄 Aggiornando stato ordine ${ordineId} → ${nuovoStato}`);

  const { error } = await supabase
    .from('ordini')
    .update({ 
      stato: nuovoStato,
      updated_at: new Date().toISOString()
    })
    .eq('id', ordineId);

  if (error) {
    console.error('❌ Errore nell\'aggiornamento stato:', error);
    throw new Error(`Errore nell'aggiornamento stato: ${error.message}`);
  }

  console.log('✅ Stato ordine aggiornato');
  
  // Invalida cache ordini
  cache.invalidate('ordini');
  
  return true;
}

// Aggiorna dettagli ordine con ricalcolo totali
export async function updateDettagliOrdine(ordineId: string, dettagli: OrdineDettaglio[]): Promise<boolean> {
  console.log(`📝 Aggiornando dettagli ordine ${ordineId}`);

  // Ricalcola totali
  const { totale } = calculateTotals(dettagli);

  const { error } = await supabase
    .from('ordini')
    .update({ 
      contenuto: JSON.stringify(dettagli),
      totale: totale,
      updated_at: new Date().toISOString()
    })
    .eq('id', ordineId);

  if (error) {
    console.error('❌ Errore nell\'aggiornamento dettagli:', error);
    throw new Error(`Errore nell'aggiornamento dettagli: ${error.message}`);
  }

  console.log('✅ Dettagli ordine aggiornati');
  
  // Invalida cache ordini
  cache.invalidate('ordini');
  
  return true;
}

// Elimina ordine
export async function deleteOrdine(ordineId: string): Promise<void> {
  console.log(`🗑️ Eliminando ordine ${ordineId}`);

  const { error } = await supabase
    .from('ordini')
    .delete()
    .eq('id', ordineId);

  if (error) {
    console.error('❌ Errore nell\'eliminazione ordine:', error);
    throw new Error(`Errore nell'eliminazione ordine: ${error.message}`);
  }

  console.log('✅ Ordine eliminato');
  
  // Invalida cache ordini dopo eliminazione
  cache.invalidate('ordini');
}

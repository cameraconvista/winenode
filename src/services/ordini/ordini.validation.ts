import { supabase } from '../../lib/supabase';
import { normalizeToPgDate, isValidUuid } from '../../utils/dateForPg';
import { Ordine } from './types';

// Bridge per validazione UUID
export { isValidUuid };

// Risolve fornitoreId da nome se necessario
export async function ensureFornitoreIdResolved(ordine: Omit<Ordine, 'id'>): Promise<Omit<Ordine, 'id'> & { fornitoreId: string }> {
  let fornitoreId = ordine.fornitoreId;
  
  // Se non abbiamo fornitoreId, risolviamo dal nome
  if (!fornitoreId || !isValidUuid(fornitoreId)) {
    console.log(`🔍 Risolvendo fornitoreId per: ${ordine.fornitore}`);
    
    const { data: fornitori, error } = await supabase
      .from('fornitori')
      .select('id')
      .eq('nome', ordine.fornitore)
      .limit(1);

    if (error) {
      console.error('❌ Errore nella risoluzione fornitore:', error);
      throw new Error(`Errore nella risoluzione fornitore: ${error.message}`);
    }

    if (!fornitori || fornitori.length === 0) {
      throw new Error(`Fornitore "${ordine.fornitore}" non trovato`);
    }

    fornitoreId = fornitori[0].id;
    console.log(`✅ FornitoreId risolto: ${fornitoreId}`);
  }

  return {
    ...ordine,
    fornitoreId
  };
}

// Normalizza data ordine per PostgreSQL
export function normalizeOrdineDate(ordine: Omit<Ordine, 'id'>): Omit<Ordine, 'id'> {
  return {
    ...ordine,
    data: normalizeToPgDate(ordine.data)
  };
}

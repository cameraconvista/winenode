import { supabase } from '../../lib/supabase';
import { cache } from '../shared/cache';
import { Ordine } from './types';
import { mapRawToOrdine } from './ordini.transforms';
import { FORNITORE_UUID_COL, DATA_COL } from './ordini.constants';

// Carica tutti gli ordini dal database con strategia robusta (join + fallback)
export async function loadOrdini(signal?: AbortSignal): Promise<{
  inviati: Ordine[];
  storico: Ordine[];
}> {
  const cacheKey = 'ordini:all';
  const cached = cache.get<{ inviati: Ordine[]; storico: Ordine[] }>(cacheKey);
  
  if (cached) {
    console.log('✅ Cache hit for ordini');
    return cached;
  }

  console.log('📊 Caricamento ordini da Supabase...');

  // Verifica se richiesta è stata cancellata prima di iniziare
  if (signal?.aborted) {
    throw new Error('Request aborted');
  }

  let ordiniData: any[] = [];
  let fornitoriMap: Map<string, string> | undefined = undefined;

  // TENTATIVO A: Join esplicito (se FK esiste)
  try {
    const { data, error } = await supabase
      .from('ordini')
      .select(`
        id,
        ${FORNITORE_UUID_COL},
        ${DATA_COL},
        totale,
        contenuto,
        stato,
        created_at,
        updated_at,
        fornitori ( id, nome )
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Join con fornitori riuscito
      ordiniData = data;
    } else {
      throw new Error('Join fallito, uso fallback');
    }
  } catch (joinError) {
    // Join fallito, uso strategia fallback two-step
    
    // TENTATIVO B: Fallback automatico (nessun FK richiesto)
    // 1) Fetch ordini "flat" (senza join)
    const { data: ordiniRaw, error: e1 } = await supabase
      .from('ordini')
      .select(`
        id,
        ${FORNITORE_UUID_COL},
        ${DATA_COL},
        totale,
        contenuto,
        stato,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (e1) {
      console.error('❌ Errore nel caricamento ordini:', e1);
      throw new Error(`Errore nel caricamento ordini: ${e1.message}`);
    }

    // 2) Risolvi nomi fornitori con un'unica query
    const fornitoreIds = [...new Set(ordiniRaw?.map(o => o[FORNITORE_UUID_COL]).filter(Boolean))] as string[];
    fornitoriMap = new Map<string, string>();

    if (fornitoreIds.length > 0) {
      const { data: fornitori, error: e2 } = await supabase
        .from('fornitori')
        .select('id, nome')
        .in('id', fornitoreIds);

      if (!e2 && fornitori) {
        fornitoriMap = new Map(fornitori.map(f => [f.id, f.nome]));
      }
    }

    // 3) Usa ordini raw (sarà passata la mappa al transform)
    ordiniData = ordiniRaw || [];
  }

  // Verifica di nuovo se richiesta è stata cancellata dopo query
  if (signal?.aborted) {
    throw new Error('Request aborted');
  }

  // Mappa verso Ordine UI (passa fornitoriMap se disponibile dal fallback)
  const ordiniProcessati: Ordine[] = ordiniData.map(raw => {
    // Se abbiamo usato il fallback, passa la mappa fornitori
    const fornitoriMapToUse = fornitoriMap && fornitoriMap.size > 0 ? fornitoriMap : undefined;
    return mapRawToOrdine(raw, fornitoriMapToUse);
  });

  // Separa per stato
  const inviati = ordiniProcessati.filter(o => ['sospeso', 'inviato'].includes(o.stato));
  const storico = ordiniProcessati.filter(o => o.stato === 'archiviato');

  const result = { inviati, storico };
  
  // Cache per 1 minuto
  cache.set(cacheKey, result, 60000);
  
  console.log(`✅ Ordini caricati: ${inviati.length} inviati, ${storico.length} archiviati`);
  
  return result;
}

// Service layer neutro per operazioni ordini - risolve circular dependency
import { supabase } from '../lib/supabase';
import { normalizeToPgDate, isValidUuid } from '../utils/dateForPg';

// Cache in-memory con TTL per ottimizzazione performance
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  
  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Verifica TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    // Invalida chiavi che matchano il pattern
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
  
  size(): number {
    return this.cache.size;
  }
}

// Cache globale per il service
const cache = new CacheManager();

// Schema ordini (da DOCS/04-SUPABASE_SCHEMA.md)
const FORNITORE_UUID_COL = 'fornitore';
const DATA_COL = 'data';
const DATA_COLUMN_TYPE = 'timestamp';

// Tipi locali per evitare dipendenze circolari
export interface OrdineDettaglio {
  wineId: string;
  wineName: string;
  quantity: number;
  unit: 'bottiglie' | 'cartoni';
  unitPrice: number;
  totalPrice: number;
}

export interface Ordine {
  id: string;
  fornitore: string; // Nome fornitore per UI (backward compatibility)
  fornitoreId?: string; // UUID fornitore per DB
  totale: number;
  bottiglie: number;
  data: string;
  stato: 'sospeso' | 'inviato' | 'ricevuto' | 'archiviato';
  dettagli?: OrdineDettaglio[];
}

// Funzioni pure per operazioni database
export const ordiniService = {
  // Carica tutti gli ordini dal database con strategia robusta (join + fallback)
  async loadOrdini(signal?: AbortSignal): Promise<{
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
          fornitori:${FORNITORE_UUID_COL} ( id, nome )
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Join con fornitori riuscito
        ordiniData = data.map(ordine => ({
          ...ordine,
          fornitoreNome: (ordine as any).fornitori?.nome || 'Fornitore sconosciuto'
        }));
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
          created_at
        `)
        .order('created_at', { ascending: false });

      if (e1) {
        console.error('❌ Errore nel caricamento ordini:', e1);
        throw new Error(`Errore nel caricamento ordini: ${e1.message}`);
      }

      // 2) Risolvi nomi fornitori con un'unica query
      const fornitoreIds = [...new Set(ordiniRaw?.map(o => o[FORNITORE_UUID_COL]).filter(Boolean))] as string[];
      let fornitoriMap = new Map<string, string>();

      if (fornitoreIds.length > 0) {
        const { data: fornitori, error: e2 } = await supabase
          .from('fornitori')
          .select('id, nome')
          .in('id', fornitoreIds);

        if (!e2 && fornitori) {
          fornitoriMap = new Map(fornitori.map(f => [f.id, f.nome]));
        }
      }

      // 3) Mappa DTO finale
      ordiniData = (ordiniRaw || []).map(o => ({
        ...o,
        fornitoreNome: fornitoriMap.get(o[FORNITORE_UUID_COL]) || 'Fornitore sconosciuto'
      }));

      // Fallback two-step completato
    }

    // Verifica di nuovo se richiesta è stata cancellata dopo query
    if (signal?.aborted) {
      throw new Error('Request aborted');
    }

    const ordiniProcessati: Ordine[] = (ordiniData || []).map(ordine => {
      let dettagli: OrdineDettaglio[] = [];
      
      try {
        if (ordine.contenuto) {
          const contenutoData = typeof ordine.contenuto === 'string' 
            ? JSON.parse(ordine.contenuto) 
            : ordine.contenuto;
          
          if (Array.isArray(contenutoData)) {
            dettagli = contenutoData;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Errore parsing contenuto ordine ${ordine.id}:`, error);
      }

      const bottiglie = dettagli.reduce((sum, item) => {
        return sum + (item.unit === 'bottiglie' ? item.quantity : item.quantity * 6);
      }, 0);

      return {
        id: ordine.id,
        fornitore: ordine.fornitoreNome || 'Fornitore sconosciuto', // Nome risolto (join o fallback)
        fornitoreId: ordine[FORNITORE_UUID_COL], // UUID per compatibilità
        totale: ordine.totale,
        bottiglie,
        data: ordine[DATA_COL],
        stato: ordine.stato,
        dettagli
      };
    });

    const inviati = ordiniProcessati.filter(ordine => 
      ['sospeso', 'inviato'].includes(ordine.stato)
    );
    
    const storico = ordiniProcessati.filter(ordine => 
      ['ricevuto', 'archiviato'].includes(ordine.stato)
    );

    console.log(`✅ Caricati ${inviati.length} ordini inviati e ${storico.length} ordini storico`);
    
    const result = { inviati, storico };
    
    // Cache risultato per 60 secondi
    cache.set(cacheKey, result, 60000);
    
    return result;
  },

  // Crea nuovo ordine
  async createOrdine(ordine: Omit<Ordine, 'id'>): Promise<string> {
    console.log('📝 Creando nuovo ordine:', ordine);

    try {
      // 1. Normalizza la data per Postgres
      let normalizedDate: string;
      try {
        normalizedDate = normalizeToPgDate(ordine.data);
        // Data normalizzata per Postgres
      } catch (dateError) {
        console.error('❌ Data ordine non valida (atteso DD/MM/YYYY o YYYY-MM-DD):', ordine.data);
        throw new Error(`Data ordine non valida: ${ordine.data}`);
      }

      // 2. Risolvi UUID fornitore
      let fornitoreId = ordine.fornitoreId;
      
      if (!fornitoreId || !isValidUuid(fornitoreId)) {
        console.log('🔍 Risoluzione fornitore da nome:', ordine.fornitore);
        
        // Cerca fornitore per nome per ottenere UUID
        const { data: fornitoreData, error: fornitoreError } = await supabase
          .from('fornitori')
          .select('id')
          .eq('nome', ordine.fornitore)
          .limit(1)
          .single();

        if (fornitoreError || !fornitoreData) {
          console.error('❌ Fornitore non trovato:', ordine.fornitore);
          throw new Error(`Fornitore non trovato: ${ordine.fornitore}`);
        }

        fornitoreId = fornitoreData.id;
        // Fornitore risolto da nome a UUID
      }

      // 3. Valida UUID fornitore
      if (!isValidUuid(fornitoreId)) {
        throw new Error(`FORNITORE_ID_INVALID: ${fornitoreId}`);
      }

      // 3. Sanifica valori numerici
      const totale = Number(ordine.totale);

      if (isNaN(totale)) {
        throw new Error('Valore totale non valido');
      }

      // 4. Costruisci payload per DB (schema reale da DOCS/04-SUPABASE_SCHEMA.md)
      const dbDateValue = DATA_COLUMN_TYPE === 'timestamp' 
        ? new Date(normalizedDate + 'T00:00:00.000Z').toISOString()
        : normalizedDate;

      const payloadSanitized = {
        [FORNITORE_UUID_COL]: fornitoreId, // UUID fornitore (non nome)
        totale: totale,
        [DATA_COL]: dbDateValue, // TIMESTAMP WITH TIME ZONE
        stato: ordine.stato || 'sospeso',
        contenuto: ordine.dettagli || [] // JSONB per dettagli
      };

      // Payload pronto per insert

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
      
      // 6. Invalida cache ordini dopo creazione
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
  },

  // Aggiorna stato ordine
  async updateStatoOrdine(ordineId: string, nuovoStato: Ordine['stato']): Promise<void> {
    console.log(`🔄 Aggiornando stato ordine ${ordineId} a ${nuovoStato}`);

    const { error } = await supabase
      .from('ordini')
      .update({ stato: nuovoStato })
      .eq('id', ordineId);

    if (error) {
      console.error('❌ Errore nell\'aggiornamento stato:', error);
      throw new Error(`Errore nell'aggiornamento stato: ${error.message}`);
    }

    console.log('✅ Stato ordine aggiornato');
    
    // Invalida cache ordini dopo aggiornamento
    cache.invalidate('ordini');
  },

  // Aggiorna dettagli ordine
  async updateDettagliOrdine(ordineId: string, dettagli: OrdineDettaglio[]): Promise<void> {
    const nuovoTotale = dettagli.reduce((sum, item) => sum + item.totalPrice, 0);

    console.log(`🔄 Aggiornando dettagli ordine ${ordineId}`);

    const { error } = await supabase
      .from('ordini')
      .update({ 
        contenuto: JSON.stringify(dettagli),
        totale: nuovoTotale
      })
      .eq('id', ordineId);

    if (error) {
      console.error('❌ Errore nell\'aggiornamento dettagli:', error);
      throw new Error(`Errore nell'aggiornamento dettagli: ${error.message}`);
    }

    console.log('✅ Dettagli ordine aggiornati');
    
    // Invalida cache ordini dopo aggiornamento dettagli
    cache.invalidate('ordini');
  },

  // Funzione atomica: applica quantità confermate e archivia
  async archiveOrdineWithAppliedQuantities(params: {
    ordineId: string;
    quantitaConfermate: Record<string, number>;
    contenutoCorrente: OrdineDettaglio[];
  }): Promise<void> {
    const { ordineId, quantitaConfermate, contenutoCorrente } = params;
    
    console.log('🔒 Inizio operazione atomica apply + archive per ordine:', ordineId);
    console.log('📊 Quantità confermate:', quantitaConfermate);

    try {
      // Costruisci nuovo contenuto con quantità confermate
      const nuovoContenuto: OrdineDettaglio[] = contenutoCorrente.map(item => {
        const qtyConfermata = quantitaConfermate[item.wineId] ?? item.quantity;
        const rowTotal = qtyConfermata * item.unitPrice;
        
        return {
          ...item,
          quantity: qtyConfermata, // Quantità confermata
          totalPrice: rowTotal     // Totale ricalcolato
        };
      });

      // Ricalcola aggregati
      const totBottiglie = nuovoContenuto.reduce((sum, item) => {
        return sum + (item.quantity * (item.unit === 'cartoni' ? 6 : 1));
      }, 0);
      
      const totale = nuovoContenuto.reduce((sum, item) => sum + item.totalPrice, 0);

      console.log('📦 Nuovo contenuto calcolato:', {
        items: nuovoContenuto.length,
        totBottiglie,
        totale: totale.toFixed(2)
      });

      // Esegui update atomico dell'ordine
      const { error } = await supabase
        .from('ordini')
        .update({
          contenuto: nuovoContenuto, // JSONB con quantità confermate
          totale: totale,            // Totale ricalcolato
          stato: 'archiviato',       // Stato finale
          updated_at: new Date().toISOString()
        })
        .eq('id', ordineId)
        .select('id')
        .single();

      if (error) {
        console.error('❌ Errore nell\'operazione atomica apply + archive:', error);
        throw new Error(`Errore nell'archiviazione con quantità applicate: ${error.message}`);
      }

      console.log('✅ Operazione atomica apply + archive completata');
      
      // Invalida cache ordini
      cache.invalidate('ordini');
      
    } catch (error) {
      console.error('❌ Errore nell\'operazione atomica:', error);
      throw error;
    }
  },

  // Elimina ordine
  async deleteOrdine(ordineId: string): Promise<void> {
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
};

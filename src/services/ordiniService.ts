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

// Configurazione tipo colonna data in DB
const DATA_COLUMN_TYPE: 'date' | 'timestamp' = 'date';

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
  tipo: 'inviato' | 'ricevuto';
  dettagli?: OrdineDettaglio[];
}

// Funzioni pure per operazioni database
export const ordiniService = {
  // Carica tutti gli ordini dal database con cache e AbortController
  async loadOrdini(signal?: AbortSignal): Promise<{
    inviati: Ordine[];
    storico: Ordine[];
  }> {
    const cacheKey = 'ordini:all';
    
    // Verifica cache prima di fare query
    const cached = cache.get<{ inviati: Ordine[]; storico: Ordine[] }>(cacheKey);
    if (cached) {
      console.log('✅ Cache hit for ordini');
      return cached;
    }
    console.log('🔄 Caricando ordini da Supabase...');

    // Verifica se richiesta è stata cancellata
    if (signal?.aborted) {
      throw new Error('Request aborted');
    }

    const { data: ordiniData, error: ordiniError } = await supabase
      .from('ordini')
      .select(`
        id,
        fornitore,
        totale,
        contenuto,
        stato,
        data,
        created_at
      `)
      .order('created_at', { ascending: false });

    // Verifica di nuovo se richiesta è stata cancellata dopo query
    if (signal?.aborted) {
      throw new Error('Request aborted');
    }

    if (ordiniError) {
      console.error('❌ Errore nel caricamento ordini:', ordiniError);
      throw new Error(`Errore nel caricamento ordini: ${ordiniError.message}`);
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
        fornitore: ordine.fornitore,
        totale: ordine.totale,
        bottiglie,
        data: ordine.data,
        stato: ordine.stato,
        tipo: ['ricevuto', 'archiviato'].includes(ordine.stato) ? 'ricevuto' : 'inviato',
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
        console.log('📅 Data normalizzata:', ordine.data, '→', normalizedDate);
      } catch (dateError) {
        console.error('❌ Data ordine non valida (atteso DD/MM/YYYY o YYYY-MM-DD):', ordine.data);
        throw new Error(`Data ordine non valida: ${ordine.data}`);
      }

      // 2. Risolvi fornitore ID se necessario
      let fornitoreId = ordine.fornitoreId;
      
      if (!fornitoreId || !isValidUuid(fornitoreId)) {
        console.log('🔍 Risoluzione fornitore da nome:', ordine.fornitore);
        
        // Cerca fornitore per nome
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
        console.log('✅ Fornitore risolto:', ordine.fornitore, '→', fornitoreId);
      }

      // 3. Valida UUID fornitore
      if (!isValidUuid(fornitoreId)) {
        throw new Error(`FORNITORE_ID_INVALID: ${fornitoreId}`);
      }

      // 4. Sanifica valori numerici
      const totale = Number(ordine.totale);
      const bottiglie = Number(ordine.bottiglie || 0);

      if (isNaN(totale) || isNaN(bottiglie)) {
        throw new Error('Valori numerici non validi per totale o bottiglie');
      }

      // 5. Costruisci payload per DB
      const payloadSanitized = {
        fornitore_id: fornitoreId, // UUID per DB
        totale: totale,
        bottiglie: bottiglie,
        data: normalizedDate, // YYYY-MM-DD
        stato: ordine.stato,
        items: JSON.stringify(ordine.dettagli || []) // JSONB per dettagli
      };

      console.log('🧾 Payload insert:', payloadSanitized);

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

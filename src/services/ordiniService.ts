// Service layer neutro per operazioni ordini - risolve circular dependency
import { supabase } from '../lib/supabase';

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
  fornitore: string;
  totale: number;
  bottiglie: number;
  data: string;
  stato: 'sospeso' | 'inviato' | 'ricevuto' | 'archiviato';
  tipo: 'inviato' | 'ricevuto';
  dettagli?: OrdineDettaglio[];
}

// Funzioni pure per operazioni database
export const ordiniService = {
  // Carica tutti gli ordini dal database
  async loadOrdini(): Promise<{
    inviati: Ordine[];
    storico: Ordine[];
  }> {
    console.log('🔄 Caricando ordini da Supabase...');

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
    
    return { inviati, storico };
  },

  // Crea nuovo ordine
  async createOrdine(ordine: Omit<Ordine, 'id'>): Promise<string> {
    console.log('📝 Creando nuovo ordine:', ordine);

    const { data, error } = await supabase
      .from('ordini')
      .insert({
        fornitore: ordine.fornitore,
        totale: ordine.totale,
        contenuto: JSON.stringify(ordine.dettagli || []),
        stato: ordine.stato,
        data: ordine.data
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ Errore nella creazione ordine:', error);
      throw new Error(`Errore nella creazione ordine: ${error.message}`);
    }

    console.log('✅ Ordine creato con ID:', data.id);
    return data.id;
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
  }
};

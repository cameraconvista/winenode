import { supabase } from '../../lib/supabase';
import { cache } from '../shared/cache';
import { OrdineDettaglio } from './types';

// Funzione atomica: applica quantità confermate e archivia
export async function archiveOrdineWithAppliedQuantities(params: {
  ordineId: string;
  quantitaConfermate: Record<string, number>;
  contenutoCorrente: OrdineDettaglio[];
}): Promise<boolean> {
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
        contenuto: JSON.stringify(nuovoContenuto), // JSONB con quantità confermate
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
    
    return true;
  } catch (error) {
    console.error('❌ Errore nell\'operazione atomica:', error);
    throw error;
  }
}

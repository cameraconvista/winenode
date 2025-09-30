// Facade compatibile per ordiniService - API invariata
import { loadOrdini } from './ordini.read';
import { createOrdine, updateStatoOrdine, updateDettagliOrdine, deleteOrdine } from './ordini.write';
import { archiveOrdineWithAppliedQuantities } from './ordini.atomic';

// Re-export tipi per compatibilità
export type { Ordine, OrdineDettaglio } from './types';

// Oggetto ordiniService con API identica al monolite originale
export const ordiniService = {
  // Carica tutti gli ordini dal database con strategia robusta (join + fallback)
  loadOrdini,
  
  // Crea nuovo ordine
  createOrdine,
  
  // Aggiorna stato ordine
  updateStatoOrdine,
  
  // Aggiorna dettagli ordine con ricalcolo totali
  updateDettagliOrdine,
  
  // Funzione atomica: applica quantità confermate e archivia
  archiveOrdineWithAppliedQuantities,
  
  // Elimina ordine
  deleteOrdine
};

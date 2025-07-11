
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const user_id = '02c85ceb-8026-4bd9-9dc5-c03a74f56346';

async function cleanNonSpecificato() {
  try {
    console.log('🧹 Pulizia "Non specificato" dalla tabella vini...');

    // 1. Sostituisci "Non specificato" con null nella tabella vini
    const { data: updatedVini, error: updateError } = await supabase
      .from('vini')
      .update({ fornitore: null })
      .eq('user_id', user_id)
      .or('fornitore.eq.Non specificato,fornitore.eq.NON SPECIFICATO,fornitore.ilike.%non specif%')
      .select('id, nome_vino, fornitore');

    if (updateError) {
      console.error('❌ Errore aggiornamento vini:', updateError);
      return;
    }

    console.log(`✅ Aggiornati ${updatedVini?.length || 0} vini`);

    // 2. Rimuovi "Non specificato" dalla tabella fornitori
    const { data: deletedFornitori, error: deleteError } = await supabase
      .from('fornitori')
      .delete()
      .eq('user_id', user_id)
      .or('nome.eq.Non specificato,nome.eq.NON SPECIFICATO,nome.ilike.%non specif%')
      .select('id, nome');

    if (deleteError) {
      console.error('❌ Errore eliminazione fornitori:', deleteError);
      return;
    }

    console.log(`✅ Eliminati ${deletedFornitori?.length || 0} fornitori "Non specificato"`);

    // 3. Verifica risultato finale
    const { data: viniCheck, error: checkError } = await supabase
      .from('vini')
      .select('fornitore')
      .eq('user_id', user_id)
      .or('fornitore.eq.Non specificato,fornitore.eq.NON SPECIFICATO,fornitore.ilike.%non specif%');

    if (checkError) {
      console.error('❌ Errore verifica:', checkError);
      return;
    }

    console.log(`🔍 Controllo finale: ${viniCheck?.length || 0} vini ancora con "Non specificato"`);

    // 4. Statistiche finali
    const { data: allVini, error: allError } = await supabase
      .from('vini')
      .select('fornitore')
      .eq('user_id', user_id);

    if (!allError) {
      const conFornitore = allVini.filter(v => v.fornitore && v.fornitore.trim()).length;
      const senzaFornitore = allVini.filter(v => !v.fornitore || !v.fornitore.trim()).length;
      
      console.log(`📊 Statistiche finali:`);
      console.log(`  - Vini con fornitore: ${conFornitore}`);
      console.log(`  - Vini senza fornitore: ${senzaFornitore}`);
      console.log(`  - Totale vini: ${allVini.length}`);
    }

    console.log('🏁 Pulizia completata!');

  } catch (error) {
    console.error('❌ Errore durante la pulizia:', error);
  }
}

cleanNonSpecificato();

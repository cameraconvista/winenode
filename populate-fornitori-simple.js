
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rtmohyjquscdkbtibdsu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0bW9oeWpxdXNjZGtidGliZHN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ1NjY4MCwiZXhwIjoyMDY3MDMyNjgwfQ.vdU1ICEONshwgtd636O92_qamM9ohXe2dwljYwjf5hk';
const DEFAULT_USER_ID = '02c85ceb-8026-4bd9-9dc5-c03a74f56346';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function populateFornitori() {
  try {
    console.log('🚀 Avvio popolamento tabella fornitori...');
    console.log('👤 User ID:', DEFAULT_USER_ID);

    // 1. Verifica fornitori esistenti
    const { data: esistenti, error: checkError } = await supabase
      .from('fornitori')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID);

    if (checkError) {
      console.error('❌ Errore nel controllo fornitori:', checkError);
      return;
    }

    console.log(`📊 Fornitori esistenti: ${esistenti.length}`);

    // 2. Ottieni fornitori dai vini
    const { data: vini, error: viniError } = await supabase
      .from('vini')
      .select('fornitore')
      .eq('user_id', DEFAULT_USER_ID)
      .not('fornitore', 'is', null)
      .not('fornitore', 'eq', '');

    if (viniError) {
      console.error('❌ Errore caricamento vini:', viniError);
      return;
    }

    console.log(`🍷 Vini trovati: ${vini.length}`);

    // 3. Estrai fornitori unici
    const fornitoriUnici = [...new Set(vini.map(v => v.fornitore?.trim()).filter(Boolean))];
    console.log(`📋 Fornitori unici: ${fornitoriUnici.length}`, fornitoriUnici);

    if (fornitoriUnici.length === 0) {
      console.log('⚠️ Nessun fornitore trovato nei vini');
      return;
    }

    // 4. Filtra fornitori da inserire
    const fornitoriEsistenti = new Set(esistenti.map(f => f.nome?.toUpperCase()));
    const fornitoriDaInserire = fornitoriUnici.filter(f => !fornitoriEsistenti.has(f.toUpperCase()));

    console.log(`➕ Fornitori da inserire: ${fornitoriDaInserire.length}`, fornitoriDaInserire);

    if (fornitoriDaInserire.length === 0) {
      console.log('✅ Tutti i fornitori sono già presenti');
      return;
    }

    // 5. Inserisci i nuovi fornitori
    const nuoviFornitori = fornitoriDaInserire.map(fornitore => ({
      user_id: DEFAULT_USER_ID,
      nome: fornitore.toUpperCase()
    }));

    console.log('📦 Inserimento fornitori:', nuoviFornitori);

    const { data: inseriti, error: insertError } = await supabase
      .from('fornitori')
      .insert(nuoviFornitori)
      .select();

    if (insertError) {
      console.error('❌ Errore inserimento:', insertError);
      return;
    }

    console.log(`✅ Inseriti ${inseriti.length} fornitori`);

    // 6. Verifica finale
    const { data: totali, error: totaliError } = await supabase
      .from('fornitori')
      .select('*')
      .eq('user_id', DEFAULT_USER_ID);

    if (!totaliError) {
      console.log(`🎉 Totale fornitori: ${totali.length}`);
      totali.forEach(f => console.log(`  - ${f.nome}`));
    }

    console.log('🏁 Popolamento completato!');

  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

populateFornitori().then(() => process.exit(0));

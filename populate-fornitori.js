
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_USER_ID = '02c85ceb-8026-4bd9-9dc5-c03a74f56346'; // Dal log console

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variabili ambiente mancanti');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function populateFornitori() {
  try {
    console.log('🚀 Avvio popolamento tabella fornitori...');

    // 1. Ottieni tutti i fornitori unici dalla tabella vini
    const { data: vini, error: viniError } = await supabase
      .from('vini')
      .select('fornitore')
      .eq('user_id', DEFAULT_USER_ID)
      .not('fornitore', 'is', null);

    if (viniError) throw viniError;

    // 2. Estrai fornitori unici
    const fornitoriUnici = [...new Set(vini.map(v => v.fornitore?.trim()).filter(Boolean))];
    console.log(`📋 Fornitori trovati nei vini: ${fornitoriUnici.length}`, fornitoriUnici);

    if (fornitoriUnici.length === 0) {
      console.log('⚠️ Nessun fornitore trovato nella tabella vini');
      return;
    }

    // 3. Verifica quali fornitori esistono già
    const { data: esistenti, error: esistentiError } = await supabase
      .from('fornitori')
      .select('fornitore')
      .eq('user_id', DEFAULT_USER_ID);

    if (esistentiError) throw esistentiError;

    const fornitoriEsistenti = new Set(esistenti.map(f => f.fornitore));
    const fornitoriDaInserire = fornitoriUnici.filter(f => !fornitoriEsistenti.has(f));

    console.log(`✅ Fornitori già esistenti: ${fornitoriEsistenti.size}`);
    console.log(`➕ Fornitori da inserire: ${fornitoriDaInserire.length}`, fornitoriDaInserire);

    if (fornitoriDaInserire.length === 0) {
      console.log('✅ Tutti i fornitori sono già presenti nella tabella');
      return;
    }

    // 4. Inserisci i nuovi fornitori
    const nuoviFornitori = fornitoriDaInserire.map(fornitore => ({
      user_id: DEFAULT_USER_ID,
      fornitore: fornitore,
      telefono: '',
      contatto_email: '',
      min_ordine_importo: 0,
      note: `Fornitore estratto automaticamente dalla lista vini`
    }));

    const { data: inseriti, error: insertError } = await supabase
      .from('fornitori')
      .insert(nuoviFornitori)
      .select();

    if (insertError) throw insertError;

    console.log(`✅ Inseriti ${inseriti.length} nuovi fornitori nella tabella`);

    // 5. Verifica finale
    const { data: totali, error: totaliError } = await supabase
      .from('fornitori')
      .select('*', { count: 'exact' })
      .eq('user_id', DEFAULT_USER_ID);

    if (totaliError) throw totaliError;

    console.log(`📊 Totale fornitori nella tabella: ${totali.length}`);
    console.log('🏁 Popolamento tabella fornitori completato con successo!');

  } catch (error) {
    console.error('❌ Errore durante il popolamento:', error);
    process.exit(1);
  }
}

populateFornitori();

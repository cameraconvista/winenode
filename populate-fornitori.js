import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_USER_ID = '02c85ceb-8026-4bd9-9dc5-c03a74f56346'; // Dal log console

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variabili ambiente mancanti');
  console.log('SUPABASE_URL presente:', !!SUPABASE_URL);
  console.log('SUPABASE_SERVICE_ROLE_KEY presente:', !!SUPABASE_SERVICE_ROLE_KEY);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function populateFornitori() {
  try {
    console.log('🚀 Avvio popolamento tabella fornitori...');
    console.log('👤 User ID:', DEFAULT_USER_ID);

    // 1. Verifica se la tabella fornitori esiste ed è vuota
    const { data: esistenti, error: checkError } = await supabase
      .from('fornitori')
      .select('id, nome')
      .eq('user_id', DEFAULT_USER_ID);

    if (checkError) {
      console.error('❌ Errore nel controllo tabella fornitori:', checkError);
      throw checkError;
    }

    console.log(`📊 Fornitori già esistenti nella tabella: ${esistenti.length}`);
    if (esistenti.length > 0) {
      console.log('📋 Fornitori esistenti:', esistenti.map(f => f.nome));
    }

    // 2. Ottieni tutti i fornitori unici dalla tabella vini
    const { data: vini, error: viniError } = await supabase
      .from('vini')
      .select('fornitore')
      .eq('user_id', DEFAULT_USER_ID)
      .not('fornitore', 'is', null)
      .not('fornitore', 'eq', '');

    if (viniError) {
      console.error('❌ Errore nel caricamento vini:', viniError);
      throw viniError;
    }

    console.log(`🍷 Vini trovati: ${vini.length}`);

    // 3. Estrai fornitori unici dai vini
    const fornitoriUnici = [...new Set(vini.map(v => v.fornitore?.trim()).filter(Boolean))];
    console.log(`📋 Fornitori unici estratti dai vini: ${fornitoriUnici.length}`, fornitoriUnici);

    if (fornitoriUnici.length === 0) {
      console.log('⚠️ Nessun fornitore trovato nella tabella vini');
      return;
    }

    // 4. Filtra i fornitori da inserire (esclude quelli già esistenti)
    const fornitoriEsistenti = new Set(esistenti.map(f => f.nome));
    const fornitoriDaInserire = fornitoriUnici.filter(f => !fornitoriEsistenti.has(f));

    console.log(`✅ Fornitori già esistenti: ${fornitoriEsistenti.size}`);
    console.log(`➕ Fornitori da inserire: ${fornitoriDaInserire.length}`, fornitoriDaInserire);

    if (fornitoriDaInserire.length === 0) {
      console.log('✅ Tutti i fornitori sono già presenti nella tabella');
      return;
    }

    // 5. Prepara i dati per l'inserimento con struttura corretta
    const nuoviFornitori = fornitoriDaInserire.map(fornitore => ({
      user_id: DEFAULT_USER_ID,
      nome: fornitore,
    }));

    console.log('📦 Dati da inserire:', nuoviFornitori);

    // 6. Inserisci i nuovi fornitori
    const { data: inseriti, error: insertError } = await supabase
      .from('fornitori')
      .insert(nuoviFornitori)
      .select();

    if (insertError) {
      console.error('❌ Errore nell\'inserimento:', insertError);
      throw insertError;
    }

    console.log(`✅ Inseriti ${inseriti.length} nuovi fornitori nella tabella`);
    console.log('📋 Fornitori inseriti:', inseriti.map(f => f.nome));

    // 7. Verifica finale con conteggio totale
    const { data: totali, error: totaliError } = await supabase
      .from('fornitori')
      .select('*', { count: 'exact' })
      .eq('user_id', DEFAULT_USER_ID);

    if (totaliError) {
      console.error('❌ Errore nella verifica finale:', totaliError);
      throw totaliError;
    }

    console.log(`📊 Totale fornitori nella tabella: ${totali.length}`);
    console.log('📋 Lista completa fornitori:');
    totali.forEach(f => {
      console.log(`  - ${f.nome} (ID: ${f.id})`);
    });

    console.log('🏁 Popolamento tabella fornitori completato con successo!');

  } catch (error) {
    console.error('❌ Errore durante il popolamento:', error);
    process.exit(1);
  }
}

// Esegui lo script
populateFornitori();
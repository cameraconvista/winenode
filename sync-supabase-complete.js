import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import Papa from 'papaparse';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

// Usa il tuo user_id dai log della console
const user_id = '02c85ceb-8026-4bd9-9dc5-c03a74f56346';

const CATEGORIES = {
  'BOLLICINE ITALIANE': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=294419425&single=true&output=csv',
  'BOLLICINE FRANCESI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=700257433&single=true&output=csv',
  'BIANCHI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=2127910877&single=true&output=csv',
  'ROSSI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=254687727&single=true&output=csv',
  'ROSATI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=498630601&single=true&output=csv',
  'VINI DOLCI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=1582691495&single=true&output=csv',
};

function parseEuro(value) {
  if (!value || value === '' || value === null || value === undefined) return null;

  // Rimuovi tutto tranne numeri, punti e virgole
  const cleaned = value.toString().replace(/[^\d.,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

async function checkDatabaseConnection() {
  try {
    console.log('🔍 Verifica connessione Supabase...');
    const { data, error } = await supabase.from('vini').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Connessione Supabase OK');
    return true;
  } catch (err) {
    console.error('❌ Errore connessione Supabase:', err.message);
    return false;
  }
}

async function syncCategory(tipo, url) {
  try {
    console.log(`\n🔄 Sincronizzando ${tipo}...`);

    // Download CSV
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} per ${tipo}`);
    }
    const csvText = await response.text();
    console.log(`📥 CSV scaricato per ${tipo}, dimensione: ${csvText.length} caratteri`);

    // Parse CSV
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toUpperCase(),
    });

    console.log(`📊 Righe trovate nel CSV: ${parsed.data.length}`);

    // Debug: mostra le prime righe del CSV
    console.log(`🔍 Prime 3 righe del CSV per ${tipo}:`);
    parsed.data.slice(0, 3).forEach((row, idx) => {
      console.log(`  Riga ${idx + 1}:`, Object.keys(row).slice(0, 5), '...');
      console.log(`    Esempio dati:`, row);
    });

    // Filtra e mappa i dati
    const validRows = parsed.data
      .filter(row => {
        const nome = row['NOME VINO']?.trim();
        const isValid = nome && 
               nome.toUpperCase() !== 'NOME VINO' && 
               nome.toUpperCase() !== tipo.toUpperCase() &&
               nome.length > 0;
        
        if (!isValid && nome) {
          console.log(`    ❌ Scartata riga con nome: "${nome}" (motivo: ${!nome ? 'vuoto' : nome.toUpperCase() === 'NOME VINO' ? 'header' : 'categoria'})`);
        }
        
        return isValid;
      })
      .map(row => {
        const nomeVino = row['NOME VINO']?.trim();
        const anno = row['ANNO']?.trim();
        const produttore = row['PRODUTTORE']?.trim();
        const provenienza = row['PROVENIENZA']?.trim();
        const fornitore = row['FORNITORE']?.trim();
        const costo = parseEuro(row['COSTO '] ?? row['COSTO']);
        const vendita = parseEuro(row['VENDITA']);
        const margine = parseEuro(row['MARGINE']);

        return {
          nome_vino: nomeVino || null,
          anno: anno || null,
          produttore: produttore || null,
          provenienza: provenienza || null,
          fornitore: fornitore || 'Non specificato',
          costo: costo,
          vendita: vendita,
          margine: margine,
          tipologia: tipo,
          user_id: user_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

    console.log(`🍷 Vini validi trovati per ${tipo}: ${validRows.length}`);

    if (validRows.length === 0) {
      console.log(`⚠️ Nessun vino valido trovato per ${tipo}`);
      return 0;
    }

    // Elimina i vini esistenti per questa categoria
    console.log(`🗑️ Eliminazione vini esistenti per ${tipo}...`);
    const { error: deleteError } = await supabase
      .from('vini')
      .delete()
      .eq('tipologia', tipo)
      .eq('user_id', user_id);

    if (deleteError) {
      console.error(`❌ Errore eliminazione per ${tipo}:`, deleteError);
      throw deleteError;
    }

    // Inserisci i nuovi vini
    console.log(`📝 Inserimento ${validRows.length} vini per ${tipo}...`);
    const { data: insertedData, error: insertError } = await supabase
      .from('vini')
      .insert(validRows)
      .select('id');

    if (insertError) {
      console.error(`❌ Errore inserimento per ${tipo}:`, insertError);
      throw insertError;
    }

    // Crea giacenze per i vini inseriti
    if (insertedData && insertedData.length > 0) {
      console.log(`📦 Creazione giacenze per ${insertedData.length} vini...`);
      const giacenze = insertedData.map(wine => ({
        vino_id: wine.id,
        giacenza: 0,
        min_stock: 2,
        user_id: user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: giacenzaError } = await supabase
        .from('giacenza')
        .insert(giacenze);

      if (giacenzaError) {
        console.error(`❌ Errore creazione giacenze per ${tipo}:`, giacenzaError);
      } else {
        console.log(`✅ Giacenze create per ${tipo}`);
      }
    }

    console.log(`✅ ${tipo} sincronizzato con successo: ${validRows.length} vini`);
    return validRows.length;

  } catch (err) {
    console.error(`❌ Errore sincronizzazione ${tipo}:`, err.message);
    return 0;
  }
}

async function cleanDatabase() {
  try {
    console.log('\n🗑️ Pulizia database utente...');

    // Prima elimina giacenze
    const { error: giacenzaError } = await supabase
      .from('giacenza')
      .delete()
      .eq('user_id', user_id);

    if (giacenzaError) {
      console.error('Errore eliminazione giacenze:', giacenzaError);
    } else {
      console.log('✅ Giacenze eliminate');
    }

    // Poi elimina vini
    const { error: viniError } = await supabase
      .from('vini')
      .delete()
      .eq('user_id', user_id);

    if (viniError) {
      console.error('Errore eliminazione vini:', viniError);
    } else {
      console.log('✅ Vini eliminati');
    }

  } catch (err) {
    console.error('❌ Errore pulizia database:', err.message);
  }
}

async function main() {
  console.log('🚀 AVVIO SINCRONIZZAZIONE COMPLETA SUPABASE');
  console.log('👤 User ID:', user_id);

  // Verifica connessione
  if (!(await checkDatabaseConnection())) {
    console.error('❌ Impossibile connettersi a Supabase');
    process.exit(1);
  }

  // Pulisci database
  await cleanDatabase();

  let totalWines = 0;
  let totalCategories = 0;

  // Sincronizza tutte le categorie
  for (const [tipo, url] of Object.entries(CATEGORIES)) {
    const winesInserted = await syncCategory(tipo, url);
    if (winesInserted > 0) {
      totalWines += winesInserted;
      totalCategories++;
    }

    // Pausa tra le categorie per evitare rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Report finale
  console.log('\n🏁 SINCRONIZZAZIONE COMPLETATA');
  console.log(`📊 Categorie sincronizzate: ${totalCategories}/${Object.keys(CATEGORIES).length}`);
  console.log(`🍷 Totale vini importati: ${totalWines}`);

  // Verifica finale
  try {
    const { count } = await supabase
      .from('vini')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id);

    console.log(`✅ Verifica finale: ${count} vini nel database`);

    // Mostra conteggio per categoria
    const { data: categoryData } = await supabase
      .from('vini')
      .select('tipologia', { count: 'exact' })
      .eq('user_id', user_id);

    if (categoryData) {
      console.log('\n📋 Vini per categoria:');
      for (const [tipo] of Object.entries(CATEGORIES)) {
        const { count } = await supabase
          .from('vini')
          .select('*', { count: 'exact', head: true })
          .eq('tipologia', tipo)
          .eq('user_id', user_id);
        console.log(`  ${tipo}: ${count} vini`);
      }
    }

  } catch (err) {
    console.error('❌ Errore verifica finale:', err.message);
  }
}

main().catch(console.error);
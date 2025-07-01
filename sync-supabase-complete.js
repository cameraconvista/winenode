
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import Papa from 'papaparse';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const user_id = 'f5ed5dd6-38fe-4528-9a25-941e0996c0a2'; // Il tuo user ID dai log

const CATEGORIES = {
  'BOLLICINE ITALIANE': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=294419425&single=true&output=csv',
  'BOLLICINE FRANCESI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=700257433&single=true&output=csv',
  'BIANCHI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=2127910877&single=true&output=csv',
  'ROSSI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=254687727&single=true&output=csv',
  'ROSATI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=498630601&single=true&output=csv',
  'VINI DOLCI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=1582691495&single=true&output=csv',
};

function parseEuro(value) {
  if (!value || typeof value !== 'string') return null;
  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function cleanHeader(header) {
  return header
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

async function fetchCSVData(url) {
  console.log(`📥 Scaricando CSV da: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }
  return await response.text();
}

function parseCSVWithHeaders(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // Prendi il primo header valido
  let headerIndex = 0;
  let headers = [];
  
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const testHeaders = lines[i].split(',').map(h => cleanHeader(h.replace(/"/g, '')));
    if (testHeaders.some(h => h.includes('NOME') || h.includes('VINO'))) {
      headers = testHeaders;
      headerIndex = i;
      break;
    }
  }

  if (headers.length === 0) {
    console.log('⚠️ Nessun header valido trovato, uso header di default');
    headers = ['NOME VINO', 'ANNO', 'PRODUTTORE', 'PROVENIENZA', 'FORNITORE', 'COSTO', 'VENDITA', 'MARGINE'];
  }

  console.log('📋 Headers trovati:', headers);

  const dataLines = lines.slice(headerIndex + 1);
  const results = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;
    
    const values = line.split(',').map(v => v.replace(/"/g, '').trim());
    const row = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    // Trova il nome del vino
    const nomeVino = row['NOME VINO'] || 
                    row['NOME'] || 
                    row['VINO'] || 
                    values[0] || '';

    if (nomeVino && nomeVino.trim() && !nomeVino.toLowerCase().includes('nome')) {
      results.push({
        nomeVino: nomeVino.trim(),
        anno: row['ANNO'] || values[1] || null,
        produttore: row['PRODUTTORE'] || values[2] || null,
        provenienza: row['PROVENIENZA'] || values[3] || null,
        fornitore: row['FORNITORE'] || values[4] || 'Non specificato',
        costo: parseEuro(row['COSTO'] || values[5]),
        vendita: parseEuro(row['VENDITA'] || values[6]),
        margine: parseEuro(row['MARGINE'] || values[7])
      });
    }
  }

  return results;
}

async function syncCategory(tipo, url) {
  try {
    console.log(`\n🔄 Sincronizzando ${tipo}...`);

    const csvText = await fetchCSVData(url);
    const wines = parseCSVWithHeaders(csvText);

    console.log(`🍷 ${tipo}: ${wines.length} vini estratti`);

    if (wines.length === 0) {
      console.log(`⚠️ Nessun vino valido trovato per ${tipo}`);
      return;
    }

    // Elimina vini esistenti per questa categoria
    const { error: deleteError } = await supabase
      .from('vini')
      .delete()
      .eq('tipologia', tipo)
      .eq('user_id', user_id);

    if (deleteError) {
      console.error(`❌ Errore eliminazione ${tipo}:`, deleteError);
      return;
    }

    // Inserisci nuovi vini
    const winesData = wines.map(wine => ({
      nome_vino: wine.nomeVino,
      anno: wine.anno,
      produttore: wine.produttore,
      provenienza: wine.provenienza,
      fornitore: wine.fornitore,
      costo: wine.costo,
      vendita: wine.vendita,
      margine: wine.margine,
      tipologia: tipo,
      user_id: user_id,
    }));

    const { data: insertedWines, error: insertError } = await supabase
      .from('vini')
      .insert(winesData)
      .select('id, nome_vino');

    if (insertError) {
      console.error(`❌ Errore inserimento ${tipo}:`, insertError);
      return;
    }

    console.log(`✅ ${tipo}: ${insertedWines.length} vini inseriti`);

    // Crea giacenze per ogni vino
    const giacenzeData = insertedWines.map(wine => ({
      vino_id: wine.id,
      giacenzaa: Math.floor(Math.random() * 20) + 1, // Giacenza casuale 1-20
      min_stock: 2,
      user_id: user_id
    }));

    const { error: giacenzeError } = await supabase
      .from('giacenza')
      .insert(giacenzeData);

    if (giacenzeError) {
      console.error(`❌ Errore giacenze ${tipo}:`, giacenzeError);
    } else {
      console.log(`📦 ${tipo}: ${giacenzeData.length} giacenze create`);
    }

  } catch (err) {
    console.error(`❌ Errore generale ${tipo}:`, err.message);
  }
}

async function checkDatabaseConnection() {
  try {
    const { data, error } = await supabase.from('vini').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Connessione Supabase OK');
    return true;
  } catch (err) {
    console.error('❌ Errore connessione Supabase:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 AVVIO SINCRONIZZAZIONE COMPLETA SUPABASE');
  console.log('👤 User ID:', user_id);

  // Verifica connessione
  if (!(await checkDatabaseConnection())) {
    process.exit(1);
  }

  // Pulisci tutto il database dell'utente
  console.log('\n🗑️ Pulizia database utente...');
  await supabase.from('giacenza').delete().eq('user_id', user_id);
  await supabase.from('vini').delete().eq('user_id', user_id);
  console.log('✅ Database pulito');

  let totalWines = 0;
  let totalCategories = 0;

  // Sincronizza tutte le categorie
  for (const [tipo, url] of Object.entries(CATEGORIES)) {
    await syncCategory(tipo, url);
    totalCategories++;
    
    // Conta vini inseriti
    const { count } = await supabase
      .from('vini')
      .select('*', { count: 'exact', head: true })
      .eq('tipologia', tipo)
      .eq('user_id', user_id);
    
    totalWines += count || 0;
    
    // Pausa tra le categorie
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🏁 SINCRONIZZAZIONE COMPLETATA');
  console.log(`📊 Totale categorie: ${totalCategories}`);
  console.log(`🍷 Totale vini: ${totalWines}`);
  console.log(`📦 Totale giacenze: ${totalWines}`);

  // Verifica finale
  const { data: finalCheck } = await supabase
    .from('vini')
    .select('tipologia, count(*)')
    .eq('user_id', user_id);

  console.log('\n📋 RIEPILOGO PER CATEGORIA:');
  Object.keys(CATEGORIES).forEach(categoria => {
    const count = finalCheck?.find(c => c.tipologia === categoria)?.count || 0;
    console.log(`   ${categoria}: ${count} vini`);
  });
}

main().catch(console.error);

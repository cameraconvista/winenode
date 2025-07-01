
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import Papa from 'papaparse';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_USER_ID = 'f5ed5dd6-38fe-4528-9a25-941e0996c0a2'; // Dal log

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variabili ambiente mancanti');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CATEGORIES = {
  'BOLLICINE ITALIANE': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=294419425&single=true&output=csv',
  'BOLLICINE FRANCESI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=700257433&single=true&output=csv',
  'BIANCHI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=2127910877&single=true&output=csv',
  'ROSSI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=254687727&single=true&output=csv',
  'ROSATI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=498630601&single=true&output=csv',
  'VINI DOLCI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=1582691495&single=true&output=csv'
};

function parseEuro(value) {
  if (!value) return null;
  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

async function syncCategory(tipo, url) {
  try {
    console.log(`\n🔄 Sincronizzando ${tipo}...`);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const csvText = await response.text();

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toUpperCase(),
    });

    const rows = parsed.data
      .filter(row => {
        const nome = row['NOME VINO']?.trim();
        return nome && nome.toUpperCase() !== 'NOME VINO' && nome.toUpperCase() !== tipo.toUpperCase();
      })
      .map(row => ({
        nome_vino: row['NOME VINO']?.trim() || null,
        anno: row['ANNO']?.trim() || null,
        produttore: row['PRODUTTORE']?.trim() || null,
        provenienza: row['PROVENIENZA']?.trim() || null,
        fornitore: row['FORNITORE']?.trim() || null,
        costo: parseEuro(row['COSTO '] ?? row['COSTO']),
        vendita: parseEuro(row['VENDITA']),
        margine: parseEuro(row['MARGINE']),
        tipologia: tipo,
        user_id: DEFAULT_USER_ID,
      }));

    console.log(`🍷 ${tipo}: ${rows.length} vini validi.`);

    // Elimina i vini esistenti per questa categoria
    const { error: deleteError } = await supabase
      .from('vini')
      .delete()
      .eq('tipologia', tipo)
      .eq('user_id', DEFAULT_USER_ID);
    
    if (deleteError) throw deleteError;

    // Inserisci i nuovi vini
    if (rows.length > 0) {
      const { data: insertedWines, error: insertError } = await supabase
        .from('vini')
        .insert(rows)
        .select('id, nome_vino');
      
      if (insertError) throw insertError;

      // Crea le giacenze per ogni vino
      const giacenzeData = insertedWines.map(wine => ({
        vino_id: wine.id,
        giacenzaa: 0,
        user_id: DEFAULT_USER_ID,
        min_stock: 2
      }));

      const { error: giacenzeError } = await supabase
        .from('giacenza')
        .insert(giacenzeData);
      
      if (giacenzeError) throw giacenzeError;
    }

    console.log(`✅ ${tipo} sincronizzato con successo.`);
  } catch (err) {
    console.error(`❌ Errore sincronizzazione ${tipo}:`, err);
  }
}

async function main() {
  console.log('🚀 Avvio sincronizzazione completa...');
  
  for (const [tipo, url] of Object.entries(CATEGORIES)) {
    await syncCategory(tipo, url);
    await new Promise(res => setTimeout(res, 1000)); // Pausa tra le categorie
  }
  
  console.log('🏁 Sincronizzazione terminata.');
  
  // Verifica i risultati
  const { data: totalWines, error } = await supabase
    .from('vini')
    .select('tipologia', { count: 'exact' })
    .eq('user_id', DEFAULT_USER_ID);
    
  if (!error) {
    console.log(`📊 Totale vini importati: ${totalWines.length}`);
  }
}

main().catch(console.error);

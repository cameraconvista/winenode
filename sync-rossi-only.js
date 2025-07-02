
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import Papa from 'papaparse';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const user_id = '02c85ceb-8026-4bd9-9dc5-c03a74f56346';

const ROSSI_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=254687727&single=true&output=csv';

function parseEuro(value) {
  if (!value) return null;
  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

async function syncRossi() {
  try {
    console.log('🍷 Sincronizzando vini ROSSI...');

    // Test URL with redirect following
    const response = await fetch(ROSSI_URL, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();
    console.log('📄 CSV ricevuto:', csvText.substring(0, 200) + '...');

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toUpperCase(),
    });

    console.log('🔍 Headers trovati:', parsed.meta?.fields || 'Nessun header');
    console.log('📊 Righe totali nel CSV:', parsed.data.length);

    const rows = (parsed.data || [])
      .filter(row => {
        const nome = row['NOME VINO']?.trim();
        return nome && nome.toUpperCase() !== 'NOME VINO' && nome.toUpperCase() !== 'ROSSI';
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
        tipologia: 'ROSSI',
        user_id: user_id,
      }));

    console.log(`🍷 Vini ROSSI validi trovati: ${rows.length}`);

    if (rows.length > 0) {
      // Prima elimina i vini ROSSI esistenti
      const { error: deleteError } = await supabase
        .from('vini')
        .delete()
        .eq('tipologia', 'ROSSI')
        .eq('user_id', user_id);

      if (deleteError) throw deleteError;
      console.log('🗑️ Vini ROSSI esistenti eliminati');

      // Inserisci i nuovi vini ROSSI
      const { error: insertError } = await supabase
        .from('vini')
        .insert(rows);

      if (insertError) throw insertError;
      console.log(`✅ ${rows.length} vini ROSSI inseriti con successo!`);
    } else {
      console.log('⚠️ Nessun vino ROSSI valido trovato nel CSV');
    }

  } catch (err) {
    console.error('❌ Errore sincronizzazione ROSSI:', err.message);
    console.error('Stack trace:', err.stack);
  }
}

syncRossi().catch(console.error);

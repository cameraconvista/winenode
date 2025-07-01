import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const user_id = process.env.DEFAULT_USER_ID!;

const CATEGORIES: Record<string, string> = {
  'BOLLICINE ITALIANE': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=294419425&single=true&output=csv',
  'BOLLICINE FRANCESI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=700257433&single=true&output=csv',
  'BIANCHI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=2127910877&single=true&output=csv',
  'ROSSI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=254687727&single=true&output=csv',
  'ROSATI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=498630601&single=true&output=csv',
  'VINI DOLCI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=1582691495&single=true&output=csv',
};

function parseEuro(value: string | undefined | null): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

async function syncCategory(tipo: string, url: string) {
  try {
    console.log(`\n🔄 Sincronizzando ${tipo}...`);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const csvText = await response.text();

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim().toUpperCase(),
    });

    const rows = (parsed.data as any[])
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
        user_id: user_id,
      }));

    console.log(`🍷 ${tipo}: ${rows.length} vini validi.`);

    const { error: deleteError } = await supabase
      .from('vini')
      .delete()
      .eq('tipologia', tipo)
      .eq('user_id', user_id);
    if (deleteError) throw deleteError;

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from('vini').insert(rows);
      if (insertError) throw insertError;
    }

    console.log(`✅ ${tipo} sincronizzato con successo.`);
  } catch (err) {
    console.error(`❌ Errore sincronizzazione ${tipo}:`, err);
  }
}

export async function syncAllCategories() {
  console.log('🚀 Avvio sincronizzazione completa...');
  for (const [tipo, url] of Object.entries(CATEGORIES)) {
    await syncCategory(tipo, url);
    await new Promise(res => setTimeout(res, 1000));
  }
  console.log('🏁 Sincronizzazione terminata.');
}

if (process.env.MODE === 'development') {
  syncAllCategories();
}

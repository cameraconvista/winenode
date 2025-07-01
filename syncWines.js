
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import csvParse from 'csv-parse/lib/sync';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !DEFAULT_USER_ID) {
  console.error('Errore: variabili d\'ambiente mancanti.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function upsertWinesInBatches(wines, batchSize = 50) {
  for (let i = 0; i < wines.length; i += batchSize) {
    const batch = wines.slice(i, i + batchSize);
    const { error } = await supabase.from('vini').upsert(batch, {
      onConflict: ['nome_vino', 'user_id'],
    });
    if (error) {
      console.error('Errore upsert batch:', error);
      return false;
    }
    console.log(`Batch ${i / batchSize + 1} inserito con successo (${batch.length} record)`);
    await delay(200); // piccolo delay per evitare rate limit
  }
  return true;
}

function parseCsvFile(path) {
  const fileContent = fs.readFileSync(path, 'utf-8');
  const records = csvParse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records;
}

function cleanAndMapRecords(records) {
  return records
    .filter(r => r['nome_vino'] && r['nome_vino'].trim() !== '')
    .map(r => ({
      nome_vino: r['nome_vino'].trim(),
      anno: r['anno'] ? parseInt(r['anno'], 10) || null : null,
      produttore: r['produttore']?.trim() || null,
      provenienza: r['provenienza']?.trim() || null,
      fornitore: r['fornitore']?.trim() || null,
      costo: r['costo'] ? parseFloat(r['costo']) || 0 : 0,
      vendita: r['vendita'] ? parseFloat(r['vendita']) || 0 : 0,
      margine: r['margine'] ? parseFloat(r['margine']) || 0 : 0,
      tipologia: r['tipologia']?.trim() || null,
      user_id: DEFAULT_USER_ID,
    }));
}

async function main() {
  try {
    const rawRecords = parseCsvFile('./wines.csv');
    const wines = cleanAndMapRecords(rawRecords);
    console.log(`Totale vini da sincronizzare: ${wines.length}`);

    const success = await upsertWinesInBatches(wines);
    if (success) {
      console.log('Sincronizzazione completata con successo.');
    } else {
      console.error('Sincronizzazione terminata con errori.');
    }
  } catch (error) {
    console.error('Errore durante la sincronizzazione:', error);
  }
}

main();

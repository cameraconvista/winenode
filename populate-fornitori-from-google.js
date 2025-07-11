import { createClient } from '@supabase/supabase-js';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const user_id = '02c85ceb-8026-4bd9-9dc5-c03a74f56346';

// Configurazione Google Sheets
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.VITE_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const SPREADSHEET_ID = '1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZA'; // Dal Google Sheet URL

async function connectToGoogleSheet() {
  const serviceAccountAuth = new JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  return doc;
}

async function extractFornitoriFromAllSheets(doc) {
  const fornitoriSet = new Set();
  const sheetNames = ['ROSSI', 'BIANCHI', 'BOLLICINE ITALIANE', 'BOLLICINE FRANCESI', 'ROSATI', 'VINI DOLCI'];

  console.log('📋 Fogli disponibili:', doc.sheetsByIndex.map(s => s.title));

  for (const sheetName of sheetNames) {
    try {
      // Cerca il foglio con nome simile
      const sheet = doc.sheetsByTitle[sheetName] || 
                   doc.sheetsByIndex.find(s => s.title.toUpperCase().includes(sheetName.split(' ')[0]));

      if (!sheet) {
        console.log(`⚠️ Foglio ${sheetName} non trovato`);
        continue;
      }

      console.log(`🔍 Analizzando foglio: ${sheet.title}`);
      await sheet.loadHeaderRow();
      const rows = await sheet.getRows();

      rows.forEach(row => {
        const fornitore = row.get('FORNITORE') || row.get('SUPPLIER');
        if (fornitore && fornitore.trim()) {
          fornitoriSet.add(fornitore.trim().toUpperCase());
        }
      });

      console.log(`✅ ${sheet.title}: ${rows.length} righe analizzate`);

    } catch (error) {
      console.error(`❌ Errore nel foglio ${sheetName}:`, error.message);
    }
  }

  return Array.from(fornitoriSet);
}

async function syncFornitori() {
  try {
    console.log('🚀 Inizio sincronizzazione fornitori dal Google Sheet...');
    console.log('👤 User ID:', user_id);

    // Connetti al Google Sheet
    const doc = await connectToGoogleSheet();
    console.log(`📊 Connesso al Google Sheet: ${doc.title}`);

    // Estrai tutti i fornitori unici
    const fornitoriFromSheet = await extractFornitoriFromAllSheets(doc);
    console.log(`🏪 Fornitori trovati nel Google Sheet: ${fornitoriFromSheet.length}`);
    console.log('📋 Lista fornitori:', fornitoriFromSheet);

    // Controlla fornitori esistenti
    const { data: existingFornitori, error: fetchError } = await supabase
      .from('fornitori')
      .select('nome')
      .eq('user_id', user_id);

    if (fetchError) throw fetchError;

    const existingNames = existingFornitori.map(f => f.nome.toUpperCase());
    console.log(`📦 Fornitori esistenti in DB: ${existingNames.length}`);

    // Trova fornitori da inserire (solo quelli non vuoti e non "Non specificato")
    const fornitoriToInsert = fornitoriFromSheet.filter(nome => {
      const isValidName = nome && 
        nome.length > 0 && 
        !nome.toLowerCase().includes('non specif') &&
        nome.toLowerCase() !== 'non specificato' &&
        nome.toLowerCase() !== 'nonspecificato';
      
      const notExists = !existingNames.some(f => f.nome.toUpperCase() === nome.toUpperCase());
      
      return isValidName && notExists;
    });

    console.log(`➕ Fornitori da inserire: ${fornitoriToInsert.length}`);

    if (fornitoriToInsert.length > 0) {
      const fornitoriData = fornitoriToInsert.map(nome => ({
        user_id,
        nome,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('fornitori')
        .insert(fornitoriData);

      if (insertError) throw insertError;

      console.log(`✅ Inseriti ${fornitoriToInsert.length} nuovi fornitori`);
    } else {
      console.log('ℹ️ Nessun nuovo fornitore da inserire');
    }

    // Verifica finale
    const { data: finalFornitori, error: finalError } = await supabase
      .from('fornitori')
      .select('nome')
      .eq('user_id', user_id);

    if (finalError) throw finalError;

    console.log(`🎉 Totale fornitori nel database: ${finalFornitori.length}`);
    finalFornitori.forEach(f => console.log(`  - ${f.nome}`));

  } catch (error) {
    console.error('❌ Errore sincronizzazione fornitori:', error);
  }
}

syncFornitori();
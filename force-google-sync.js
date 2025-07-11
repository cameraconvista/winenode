
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
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.VITE_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const SPREADSHEET_ID = '1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZA';

const CATEGORY_MAPPINGS = {
  'ROSSI': 'ROSSI',
  'BIANCHI': 'BIANCHI',
  'BOLLICINE ITALIANE': 'BOLLICINE ITALIANE',
  'BOLLICINE FRANCESI': 'BOLLICINE FRANCESI',
  'ROSATI': 'ROSATI',
  'VINI DOLCI': 'VINI DOLCI'
};

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

function parseNumericValue(value) {
  if (!value || value.trim() === '') return null;
  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
  if (cleaned === '') return null;
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

function getTextValue(value) {
  if (!value || value.trim() === '') return null;
  return value.trim();
}

async function syncCategoryFromSheet(doc, sheetName, categoryName) {
  try {
    console.log(`\n🔄 Sincronizzando ${sheetName} → ${categoryName}`);
    
    const sheet = doc.sheetsByTitle[sheetName] || 
                 doc.sheetsByIndex.find(s => s.title.toUpperCase().includes(sheetName.split(' ')[0]));
    
    if (!sheet) {
      console.log(`❌ Foglio ${sheetName} non trovato`);
      return 0;
    }
    
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    
    console.log(`📊 ${sheet.title}: ${rows.length} righe dal Google Sheet`);
    
    // Prepara i dati
    const validWines = rows
      .filter(row => {
        const nome = row.get('NOME VINO') || row.get('NAME');
        return nome && nome.trim();
      })
      .map(row => ({
        nome_vino: (row.get('NOME VINO') || row.get('NAME')).trim(),
        anno: getTextValue(row.get('ANNO')) || getTextValue(row.get('YEAR')),
        produttore: getTextValue(row.get('PRODUTTORE')) || getTextValue(row.get('PRODUCER')),
        provenienza: getTextValue(row.get('PROVENIENZA')) || getTextValue(row.get('ORIGIN')),
        fornitore: getTextValue(row.get('FORNITORE')) || getTextValue(row.get('SUPPLIER')),
        costo: parseNumericValue(row.get('COSTO')),
        vendita: parseNumericValue(row.get('VENDITA')),
        margine: parseNumericValue(row.get('MARGINE')),
        tipologia: categoryName,
        user_id: user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    
    console.log(`✅ Vini validi preparati: ${validWines.length}`);
    
    // Rimuovi vini esistenti per questa categoria
    const { error: deleteError } = await supabase
      .from('vini')
      .delete()
      .eq('tipologia', categoryName)
      .eq('user_id', user_id);
      
    if (deleteError) throw deleteError;
    console.log(`🗑️ Vini esistenti rimossi per categoria ${categoryName}`);
    
    // Inserisci nuovi vini
    if (validWines.length > 0) {
      const { error: insertError } = await supabase
        .from('vini')
        .insert(validWines);
        
      if (insertError) throw insertError;
      console.log(`✅ Inseriti ${validWines.length} vini per ${categoryName}`);
    }
    
    return validWines.length;
    
  } catch (error) {
    console.error(`❌ Errore sincronizzazione ${sheetName}:`, error);
    return 0;
  }
}

async function forceSync() {
  try {
    console.log('🚀 FORZATURA SINCRONIZZAZIONE COMPLETA GOOGLE SHEET');
    console.log('👤 User ID:', user_id);
    
    const doc = await connectToGoogleSheet();
    console.log(`📊 Connesso al Google Sheet: ${doc.title}`);
    console.log('📅 Ultimo aggiornamento:', doc.lastUpdatedTime);
    
    const availableSheets = doc.sheetsByIndex.map(sheet => sheet.title);
    console.log('📋 Fogli disponibili:', availableSheets);
    
    let totalWines = 0;
    
    // Sincronizza ogni categoria
    for (const [sheetName, categoryName] of Object.entries(CATEGORY_MAPPINGS)) {
      const winesCount = await syncCategoryFromSheet(doc, sheetName, categoryName);
      totalWines += winesCount;
      
      // Pausa tra le categorie
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n🎉 SINCRONIZZAZIONE COMPLETATA`);
    console.log(`📊 Totale vini sincronizzati: ${totalWines}`);
    
    // Verifica finale
    const { data: finalCount, error } = await supabase
      .from('vini')
      .select('tipologia', { count: 'exact' })
      .eq('user_id', user_id);
      
    if (!error) {
      console.log(`🔍 Verifica finale: ${finalCount.length} vini nel database`);
      
      // Conta per tipologia
      const { data: byCategory } = await supabase
        .from('vini')
        .select('tipologia')
        .eq('user_id', user_id);
        
      if (byCategory) {
        const counts = {};
        byCategory.forEach(v => {
          counts[v.tipologia] = (counts[v.tipologia] || 0) + 1;
        });
        
        console.log('\n📋 VINI PER CATEGORIA:');
        Object.entries(counts).forEach(([cat, count]) => {
          console.log(`  ${cat}: ${count} vini`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Errore sincronizzazione forzata:', error);
  }
}

forceSync();

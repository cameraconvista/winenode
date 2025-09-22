
// ============================================
// GOOGLE APPS SCRIPT - SINCRONIZZAZIONE SUPABASE
// ============================================

// 🔧 CONFIGURAZIONE - Sostituisci con i tuoi valori
const SUPABASE_URL = "https://rtmohyjquscdkbtibdsu.supabase.co";
const SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0bW9oeWpxdXNjZGtidGliZHN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ1NjY4MCwiZXhwIjoyMDY3MDMyNjgwfQ.vdU1ICEONshwgtd636O92_qamM9ohXe2dwljYwjf5hk";
const DEFAULT_USER_ID = "02c85ceb-8026-4bd9-9dc5-c03a74f56346";

// 📊 CONFIGURAZIONE GOOGLE SHEET
const GOOGLE_SHEET_ID = "1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy";

// 🍷 MAPPATURA FOGLI → TIPOLOGIE
const TIPOLOGIE_MAPPING = {
  'BOLLICINE ITALIANE': 'BOLLICINE ITALIANE',
  'BOLLICINE FRANCESI': 'BOLLICINE FRANCESI', 
  'BIANCHI': 'BIANCHI',
  'ROSSI': 'ROSSI',
  'ROSATI': 'ROSATI',
  'VINI DOLCI': 'VINI DOLCI'
};

// 💰 FUNZIONE PER CONVERTIRE VALORI EURO
function parseEuro(value) {
  if (!value || value === '' || value === null || value === undefined) return null;
  const cleaned = value.toString().replace(/[€$\s]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// 🔍 FUNZIONE PER MAPPARE INTESTAZIONI
function mappaIntestazioni(headers) {
  const mapping = {};
  
  headers.forEach((header, index) => {
    const cleanHeader = header.toString().toLowerCase().trim();
    
    // Mapping più flessibile per le colonne
    if (cleanHeader.includes('nome') || cleanHeader.includes('vino') || cleanHeader.includes('wine')) {
      mapping.nome_vino = index;
    } else if (cleanHeader.includes('anno') || cleanHeader.includes('year') || cleanHeader.includes('vintage')) {
      mapping.anno = index;
    } else if (cleanHeader.includes('produttore') || cleanHeader.includes('producer') || cleanHeader.includes('azienda')) {
      mapping.produttore = index;
    } else if (cleanHeader.includes('provenienza') || cleanHeader.includes('origine') || cleanHeader.includes('region')) {
      mapping.provenienza = index;
    } else if (cleanHeader.includes('fornitore') || cleanHeader.includes('supplier')) {
      mapping.fornitore = index;
    } else if (cleanHeader.includes('costo') || cleanHeader.includes('cost') || cleanHeader.includes('prezzo acquisto')) {
      mapping.costo = index;
    } else if (cleanHeader.includes('vendita') || cleanHeader.includes('prezzo vendita') || cleanHeader.includes('selling')) {
      mapping.vendita = index;
    } else if (cleanHeader.includes('margine') || cleanHeader.includes('margin')) {
      mapping.margine = index;
    }
  });
  
  // Se non troviamo nome_vino, proviamo con la prima colonna non vuota
  if (mapping.nome_vino === undefined) {
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] && headers[i].toString().trim() !== '') {
        mapping.nome_vino = i;
        break;
      }
    }
  }
  
  return mapping;
}

// 🍷 FUNZIONE PER SINCRONIZZARE UN FOGLIO
function sincronizzaFoglio(nomeSpreadsheet, nomeFoglio, tipologia) {
  try {
    console.log(`🔄 Elaborazione foglio: ${nomeFoglio}`);
    
    // 1. LEGGI DATI DAL FOGLIO
    const spreadsheet = SpreadsheetApp.openById(GOOGLE_SHEET_ID);
    const foglio = spreadsheet.getSheetByName(nomeFoglio);
    
    if (!foglio) {
      console.log(`❌ Foglio '${nomeFoglio}' non trovato`);
      return { success: false, wines: 0 };
    }
    
    // 2. OTTIENI TUTTI I DATI
    const dataRange = foglio.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length < 2) {
      console.log(`⚠️ ${nomeFoglio}: Nessun dato disponibile`);
      return { success: true, wines: 0 };
    }
    
    // 3. PROCESSA INTESTAZIONI
    const headers = values[0].map(h => h ? h.toString().trim() : '');
    console.log(`📋 Intestazioni trovate:`, headers);
    
    const columnMapping = mappaIntestazioni(headers);
    console.log(`🔍 Mappatura colonne:`, columnMapping);
    
    // 4. ELIMINA VINI ESISTENTI
    const deleteResponse = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/vini?tipologia=eq.${tipologia}&user_id=eq.${DEFAULT_USER_ID}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_API_KEY,
        'Authorization': `Bearer ${SUPABASE_API_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    });
    
    if (deleteResponse.getResponseCode() !== 204) {
      console.log(`⚠️ Impossibile eliminare vini esistenti per ${tipologia}`);
    }
    
    // 5. PROCESSA RIGHE DATI
    const viniDaInserire = [];
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      
      // Estrai nome vino
      let nomeVino = '';
      if (columnMapping.nome_vino !== undefined && columnMapping.nome_vino >= 0) {
        nomeVino = row[columnMapping.nome_vino] ? row[columnMapping.nome_vino].toString().trim() : '';
      }
      
      // Salta righe vuote o senza nome vino
      if (!nomeVino || nomeVino === '' || nomeVino.toUpperCase() === tipologia.toUpperCase()) {
        continue;
      }
      
      // Estrai altri dati
      const anno = columnMapping.anno >= 0 && row[columnMapping.anno] ? row[columnMapping.anno].toString() : null;
      const produttore = columnMapping.produttore >= 0 && row[columnMapping.produttore] ? row[columnMapping.produttore].toString() : null;
      const provenienza = columnMapping.provenienza >= 0 && row[columnMapping.provenienza] ? row[columnMapping.provenienza].toString() : null;
      const fornitore = columnMapping.fornitore >= 0 && row[columnMapping.fornitore] ? row[columnMapping.fornitore].toString() : null;
      const costo = columnMapping.costo >= 0 ? parseEuro(row[columnMapping.costo]) : null;
      const vendita = columnMapping.vendita >= 0 ? parseEuro(row[columnMapping.vendita]) : null;
      const margine = columnMapping.margine >= 0 ? parseEuro(row[columnMapping.margine]) : null;
      
      // Prepara dati per inserimento
      const vinoData = {
        nome_vino: nomeVino,
        anno: anno,
        produttore: produttore,
        provenienza: provenienza,
        fornitore: fornitore,
        costo: costo,
        vendita: vendita,
        margine: margine,
        tipologia: tipologia,
        user_id: DEFAULT_USER_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      viniDaInserire.push(vinoData);
    }
    
    console.log(`📊 ${tipologia}: ${viniDaInserire.length} vini validi da sincronizzare`);
    
    // 6. INSERISCI VINI IN BATCH
    let totalInseriti = 0;
    const batchSize = 50;
    
    for (let i = 0; i < viniDaInserire.length; i += batchSize) {
      const batch = viniDaInserire.slice(i, i + batchSize);
      
      try {
        const insertResponse = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/vini`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_API_KEY,
            'Authorization': `Bearer ${SUPABASE_API_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          payload: JSON.stringify(batch)
        });
        
        if (insertResponse.getResponseCode() === 201) {
          totalInseriti += batch.length;
          console.log(`✅ ${tipologia}: Batch ${Math.floor(i/batchSize) + 1} inserito (${batch.length} vini)`);
        } else {
          console.error(`❌ Errore inserimento batch ${tipologia}:`, insertResponse.getContentText());
        }
        
        // Pausa tra batch
        if (i + batchSize < viniDaInserire.length) {
          Utilities.sleep(1000);
        }
        
      } catch (batchError) {
        console.error(`❌ Errore batch ${tipologia}:`, batchError);
      }
    }
    
    console.log(`✅ ${tipologia}: ${totalInseriti} vini sincronizzati`);
    
    return { success: true, wines: totalInseriti };
    
  } catch (error) {
    console.error(`❌ Errore sincronizzazione ${tipologia}:`, error);
    return { success: false, wines: 0 };
  }
}

// 🚀 FUNZIONE PRINCIPALE
function sincronizzaAutomatica() {
  console.log('🚀 Avvio sincronizzazione automatica Google Sheets → Supabase');
  
  try {
    const spreadsheet = SpreadsheetApp.openById(GOOGLE_SHEET_ID);
    const fogli = spreadsheet.getSheets();
    
    console.log(`📋 Trovati ${fogli.length} fogli nel Google Sheet`);
    
    let totalVini = 0;
    let categorieOK = 0;
    
    for (const foglio of fogli) {
      const nomeFoglio = foglio.getName();
      console.log(`🔍 Controllo foglio: ${nomeFoglio}`);
      
      const tipologia = TIPOLOGIE_MAPPING[nomeFoglio];
      
      if (tipologia) {
        console.log(`📊 Sincronizzazione: ${nomeFoglio} → ${tipologia}`);
        const risultato = sincronizzaFoglio(spreadsheet.getName(), nomeFoglio, tipologia);
        
        if (risultato.success) {
          totalVini += risultato.wines;
          categorieOK++;
        }
        
        // Pausa tra fogli
        Utilities.sleep(2000);
      } else {
        console.log(`⏭️ Foglio ${nomeFoglio} ignorato (non corrisponde a nessuna categoria)`);
      }
    }
    
    console.log(`🏁 Sincronizzazione completata: ${totalVini} vini totali`);
    
    return {
      totalWines: totalVini,
      successfulCategories: categorieOK,
      totalCategories: Object.keys(TIPOLOGIE_MAPPING).length
    };
    
  } catch (error) {
    console.error('❌ Errore sincronizzazione automatica:', error);
    return { totalWines: 0, successfulCategories: 0, totalCategories: 0 };
  }
}

// 🔄 FUNZIONE PER TRIGGER AUTOMATICO
function onTimeBasedTrigger() {
  console.log('⏰ Trigger automatico avviato:', new Date());
  sincronizzaAutomatica();
}

// 🛠️ FUNZIONE PER CONFIGURARE IL TRIGGER
function configuraTriggersAutomatici() {
  // Elimina trigger esistenti
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });
  
  // Crea nuovo trigger ogni 5 minuti
  ScriptApp.newTrigger('onTimeBasedTrigger')
    .timeBased()
    .everyMinutes(5)
    .create();
  
  console.log('✅ Trigger automatico configurato (ogni 5 minuti)');
}

// 🧪 FUNZIONE DI TEST
function testSincronizzazione() {
  console.log('🧪 Test sincronizzazione...');
  const risultato = sincronizzaAutomatica();
  console.log('📊 Risultato test:', risultato);
  return risultato;
}

// 📋 FUNZIONE PER VERIFICARE STATO DATABASE
function verificaStatoDatabase() {
  try {
    const response = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/vini?user_id=eq.${DEFAULT_USER_ID}`, {
      headers: {
        'apikey': SUPABASE_API_KEY,
        'Authorization': `Bearer ${SUPABASE_API_KEY}`
      }
    });
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      console.log('📊 Stato database vini:', data.length, 'record trovati');
      
      // Raggruppa per tipologia
      const perTipologia = {};
      data.forEach(vino => {
        if (!perTipologia[vino.tipologia]) {
          perTipologia[vino.tipologia] = 0;
        }
        perTipologia[vino.tipologia]++;
      });
      
      console.log('📊 Vini per tipologia:', perTipologia);
      return data;
    } else {
      console.error('❌ Errore verifica database:', response.getContentText());
      return null;
    }
  } catch (error) {
    console.error('❌ Errore connessione database:', error);
    return null;
  }
}

// ============================================
// ISTRUZIONI PER L'USO:
// ============================================
//
// 1. Copia questo codice in Google Apps Script
// 2. Sostituisci GOOGLE_SHEET_ID con l'ID del tuo Google Sheet
// 3. Salva il progetto
// 4. Esegui 'testSincronizzazione()' per testare
// 5. Esegui 'configuraTriggersAutomatici()' per attivare sync automatica
// 6. Usa 'verificaStatoDatabase()' per controllare i dati
//
// ============================================

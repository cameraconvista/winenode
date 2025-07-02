
// ============================================
// GOOGLE APPS SCRIPT - SINCRONIZZAZIONE SUPABASE
// ============================================

// 🔧 CONFIGURAZIONE - Sostituisci con i tuoi valori
const SUPABASE_URL = "https://rtmohyjquscdkbtibdsu.supabase.co";
const SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0bW9oeWpxdXNjZGtidGliZHN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ1NjY4MCwiZXhwIjoyMDY3MDMyNjgwfQ.vdU1ICEONshwgtd636O92_qamM9ohXe2dwljYwjf5hk";
const DEFAULT_USER_ID = "02c85ceb-8026-4bd9-9dc5-c03a74f56346";

// 📊 CONFIGURAZIONE GOOGLE SHEET
const GOOGLE_SHEET_ID = "1slvYCYuQ78Yf9fsRL1yR5xkW2kshOcQVe8E2HsvGZ8Y";

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

// 🔍 FUNZIONE PER TROVARE LE INTESTAZIONI NELLA PRIMA RIGA NON VUOTA
function trovaIntestazioni(values) {
  console.log(`🔎 Analisi righe per trovare intestazioni...`);
  
  // Cerca nelle prime 5 righe quella con più dati
  for (let i = 0; i < Math.min(5, values.length); i++) {
    const row = values[i];
    const nonEmptyCells = row.filter(cell => cell && cell.toString().trim() !== '').length;
    
    console.log(`📝 Riga ${i + 1}: ${nonEmptyCells} celle non vuote`);
    console.log(`📝 Contenuto riga ${i + 1}:`, row);
    
    if (nonEmptyCells >= 3) { // Almeno 3 celle non vuote
      console.log(`✅ Usando riga ${i + 1} come intestazioni`);
      return { headers: row, startRow: i + 1 };
    }
  }
  
  // Se non trova nulla, usa la prima riga
  console.log(`⚠️ Nessuna riga con intestazioni valide trovata, uso riga 1`);
  return { headers: values[0] || [], startRow: 1 };
}

// 🔍 FUNZIONE PER MAPPARE INTESTAZIONI CON MIGLIORI CONTROLLI
function mappaIntestazioni(headers) {
  console.log(`🔍 Mappatura intestazioni:`, headers);
  
  const mapping = {
    nome_vino: -1,
    anno: -1,
    produttore: -1,
    provenienza: -1,
    fornitore: -1,
    costo: -1,
    vendita: -1,
    margine: -1
  };
  
  headers.forEach((header, index) => {
    if (!header) return;
    
    const cleanHeader = header.toString().toLowerCase().trim();
    console.log(`🔤 Colonna ${index}: "${cleanHeader}"`);
    
    // Mappatura più precisa
    if (cleanHeader.match(/nome|vino|wine|name|denominazione/i)) {
      mapping.nome_vino = index;
    } else if (cleanHeader.match(/anno|year|vintage|annata/i)) {
      mapping.anno = index;
    } else if (cleanHeader.match(/produttore|producer|azienda|cantina/i)) {
      mapping.produttore = index;
    } else if (cleanHeader.match(/provenienza|origine|region|zona|territorio/i)) {
      mapping.provenienza = index;
    } else if (cleanHeader.match(/fornitore|supplier|distributore/i)) {
      mapping.fornitore = index;
    } else if (cleanHeader.match(/costo|cost|prezzo.*acquisto|acquisto/i)) {
      mapping.costo = index;
    } else if (cleanHeader.match(/vendita|prezzo.*vendita|selling|prezzo$/i)) {
      mapping.vendita = index;
    } else if (cleanHeader.match(/margine|margin|guadagno/i)) {
      mapping.margine = index;
    }
  });
  
  // Se non trova nome_vino, prova per posizione (spesso è la prima colonna)
  if (mapping.nome_vino === -1) {
    for (let i = 0; i < Math.min(3, headers.length); i++) {
      if (headers[i] && headers[i].toString().trim() !== '') {
        console.log(`📍 Assegno colonna ${i} come nome_vino per posizione`);
        mapping.nome_vino = i;
        break;
      }
    }
  }
  
  console.log(`🗺️ Mappatura finale:`, mapping);
  return mapping;
}

// 🍷 FUNZIONE PER SINCRONIZZARE UN FOGLIO
function sincronizzaFoglio(nomeSpreadsheet, nomeFoglio, tipologia) {
  try {
    console.log(`🔄 Elaborazione foglio: ${nomeFoglio}`);
    
    // 1. APRI IL GOOGLE SHEET
    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(GOOGLE_SHEET_ID);
      console.log(`✅ Google Sheet aperto: ${spreadsheet.getName()}`);
    } catch (error) {
      console.error(`❌ Errore apertura Google Sheet:`, error.toString());
      return { success: false, wines: 0 };
    }
    
    // 2. TROVA IL FOGLIO
    const foglio = spreadsheet.getSheetByName(nomeFoglio);
    if (!foglio) {
      console.log(`❌ Foglio '${nomeFoglio}' non trovato`);
      const foglioDisponibili = spreadsheet.getSheets().map(s => s.getName());
      console.log(`📋 Fogli disponibili:`, foglioDisponibili);
      return { success: false, wines: 0 };
    }
    
    // 3. OTTIENI TUTTI I DATI
    const lastRow = foglio.getLastRow();
    const lastCol = foglio.getLastColumn();
    
    if (lastRow < 2 || lastCol < 1) {
      console.log(`⚠️ ${nomeFoglio}: Foglio vuoto o insufficiente (righe: ${lastRow}, colonne: ${lastCol})`);
      return { success: true, wines: 0 };
    }
    
    console.log(`📊 ${nomeFoglio}: ${lastRow} righe, ${lastCol} colonne`);
    
    const values = foglio.getRange(1, 1, lastRow, lastCol).getValues();
    
    if (values.length < 2) {
      console.log(`⚠️ ${nomeFoglio}: Non ci sono abbastanza dati`);
      return { success: true, wines: 0 };
    }
    
    // 4. TROVA LE INTESTAZIONI
    const { headers, startRow } = trovaIntestazioni(values);
    console.log(`📋 Intestazioni trovate:`, headers);
    console.log(`🏁 Dati partono dalla riga:`, startRow + 1);
    
    const columnMapping = mappaIntestazioni(headers);
    console.log(`🔍 Mappatura colonne:`, columnMapping);
    
    // 5. VERIFICA CHE ABBIAMO ALMENO IL NOME VINO
    if (columnMapping.nome_vino === -1) {
      console.log(`❌ ${nomeFoglio}: Impossibile identificare la colonna del nome vino`);
      console.log(`📋 Intestazioni disponibili:`, headers);
      return { success: false, wines: 0 };
    }
    
    // 6. ELIMINA VINI ESISTENTI
    try {
      const deleteResponse = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/vini?tipologia=eq.${tipologia}&user_id=eq.${DEFAULT_USER_ID}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_API_KEY,
          'Authorization': `Bearer ${SUPABASE_API_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        }
      });
      
      if (deleteResponse.getResponseCode() === 204) {
        console.log(`✅ Vini esistenti eliminati per ${tipologia}`);
      }
    } catch (deleteError) {
      console.error(`❌ Errore eliminazione vini esistenti:`, deleteError);
    }
    
    // 7. PROCESSA RIGHE DATI
    const viniDaInserire = [];
    
    for (let i = startRow; i < values.length; i++) {
      const row = values[i];
      
      // Estrai nome vino
      let nomeVino = '';
      if (columnMapping.nome_vino >= 0 && row[columnMapping.nome_vino]) {
        nomeVino = row[columnMapping.nome_vino].toString().trim();
      }
      
      // Debug riga
      console.log(`📝 Riga ${i + 1}: Nome="${nomeVino}"`);
      
      // Salta righe vuote o con nomi non validi
      if (!nomeVino || 
          nomeVino === '' || 
          nomeVino.length < 2 ||
          nomeVino.toUpperCase() === tipologia.toUpperCase() ||
          nomeVino.toLowerCase().includes('nome') ||
          nomeVino.toLowerCase().includes('vino')) {
        console.log(`⏭️ Riga ${i + 1} saltata: nome non valido`);
        continue;
      }
      
      // Estrai altri dati
      const anno = columnMapping.anno >= 0 && row[columnMapping.anno] ? 
        row[columnMapping.anno].toString().trim() : null;
      const produttore = columnMapping.produttore >= 0 && row[columnMapping.produttore] ? 
        row[columnMapping.produttore].toString().trim() : null;
      const provenienza = columnMapping.provenienza >= 0 && row[columnMapping.provenienza] ? 
        row[columnMapping.provenienza].toString().trim() : null;
      const fornitore = columnMapping.fornitore >= 0 && row[columnMapping.fornitore] ? 
        row[columnMapping.fornitore].toString().trim() : null;
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
      console.log(`✅ Vino preparato: ${nomeVino}`);
    }
    
    console.log(`📊 ${tipologia}: ${viniDaInserire.length} vini validi da sincronizzare`);
    
    // 8. INSERISCI VINI IN BATCH
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
    console.error(`❌ Errore sincronizzazione ${tipologia}:`, error.toString());
    return { success: false, wines: 0 };
  }
}

// 🚀 FUNZIONE PRINCIPALE
function sincronizzaAutomatica() {
  console.log('🚀 Avvio sincronizzazione automatica Google Sheets → Supabase');
  
  try {
    // 1. APRI IL GOOGLE SHEET
    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(GOOGLE_SHEET_ID);
      console.log(`✅ Connesso al Google Sheet: ${spreadsheet.getName()}`);
    } catch (error) {
      console.error('❌ Impossibile aprire il Google Sheet:', error.toString());
      return { totalWines: 0, successfulCategories: 0, totalCategories: 0 };
    }
    
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
    
    console.log(`🏁 Sincronizzazione completata: ${totalVini} vini totali da ${categorieOK} categorie`);
    
    return {
      totalWines: totalVini,
      successfulCategories: categorieOK,
      totalCategories: Object.keys(TIPOLOGIE_MAPPING).length
    };
    
  } catch (error) {
    console.error('❌ Errore sincronizzazione automatica:', error.toString());
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

// 🔧 FUNZIONE PER TESTARE CONNESSIONE GOOGLE SHEET
function testConnessioneGoogleSheet() {
  console.log('🔧 Test connessione Google Sheet...');
  console.log(`📋 ID utilizzato: ${GOOGLE_SHEET_ID}`);
  
  try {
    const spreadsheet = SpreadsheetApp.openById(GOOGLE_SHEET_ID);
    console.log(`✅ Connessione riuscita!`);
    console.log(`📋 Nome: ${spreadsheet.getName()}`);
    console.log(`📋 URL: ${spreadsheet.getUrl()}`);
    
    const fogli = spreadsheet.getSheets();
    console.log(`📋 Fogli disponibili (${fogli.length}):`);
    fogli.forEach((foglio, index) => {
      const lastRow = foglio.getLastRow();
      const lastCol = foglio.getLastColumn();
      console.log(`   ${index + 1}. ${foglio.getName()} (${lastRow} righe x ${lastCol} colonne)`);
      
      // Mostra un sample dei dati dalle prime righe
      if (lastRow > 0 && lastCol > 0) {
        try {
          const sampleData = foglio.getRange(1, 1, Math.min(3, lastRow), lastCol).getValues();
          console.log(`      Sample dati:`, sampleData);
        } catch (e) {
          console.log(`      Errore lettura sample: ${e}`);
        }
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Errore connessione Google Sheet:', error.toString());
    return false;
  }
}

// 🔍 FUNZIONE PER ANALIZZARE UN SINGOLO FOGLIO
function analizzaFoglio(nomeFoglio) {
  console.log(`🔍 Analisi dettagliata foglio: ${nomeFoglio}`);
  
  try {
    const spreadsheet = SpreadsheetApp.openById(GOOGLE_SHEET_ID);
    const foglio = spreadsheet.getSheetByName(nomeFoglio);
    
    if (!foglio) {
      console.log(`❌ Foglio '${nomeFoglio}' non trovato`);
      return false;
    }
    
    const lastRow = foglio.getLastRow();
    const lastCol = foglio.getLastColumn();
    
    console.log(`📊 Dimensioni: ${lastRow} righe x ${lastCol} colonne`);
    
    if (lastRow > 0 && lastCol > 0) {
      // Analizza le prime 5 righe
      const analyzeRows = Math.min(5, lastRow);
      const data = foglio.getRange(1, 1, analyzeRows, lastCol).getValues();
      
      for (let i = 0; i < analyzeRows; i++) {
        console.log(`📝 Riga ${i + 1}:`, data[i]);
        const nonEmpty = data[i].filter(cell => cell && cell.toString().trim() !== '').length;
        console.log(`   -> ${nonEmpty} celle non vuote`);
      }
      
      // Trova e mappa intestazioni
      const { headers, startRow } = trovaIntestazioni(data);
      console.log(`📋 Intestazioni identificate:`, headers);
      console.log(`🏁 Dati iniziano dalla riga: ${startRow + 1}`);
      
      const mapping = mappaIntestazioni(headers);
      console.log(`🗺️ Mappatura colonne:`, mapping);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Errore analisi foglio:`, error);
    return false;
  }
}

// ============================================
// ISTRUZIONI PER L'USO:
// ============================================
//
// 1. Esegui 'testConnessioneGoogleSheet()' per verificare la connessione
// 2. Esegui 'analizzaFoglio("NOME_FOGLIO")' per analizzare un foglio specifico
// 3. Esegui 'testSincronizzazione()' per testare la sincronizzazione
// 4. Esegui 'configuraTriggersAutomatici()' per attivare sync automatica
// 5. Usa 'verificaStatoDatabase()' per controllare i dati
//
// ============================================

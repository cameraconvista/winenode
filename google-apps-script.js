
// ============================================
// GOOGLE APPS SCRIPT - SINCRONIZZAZIONE SUPABASE
// ============================================

// 🔧 CONFIGURAZIONE - Sostituisci con i tuoi valori
const SUPABASE_URL = "https://rtmohyjquscdkbtibdsu.supabase.co";
const SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0bW9oeWpxdXNjZGtidGliZHN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ1NjY4MCwiZXhwIjoyMDY3MDMyNjgwfQ.vdU1ICEONshwgtd636O92_qamM9ohXe2dwljYwjf5hk";
const DEFAULT_USER_ID = "02c85ceb-8026-4bd9-9dc5-c03a74f56346";

// 📊 MAPPATURA CATEGORIE CON URL CSV
const MAPPATURA_SUPABASE = [
  { 
    title: 'BOLLICINE ITALIANE', 
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=294419425&single=true&output=csv' 
  },
  { 
    title: 'BOLLICINE FRANCESI', 
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=700257433&single=true&output=csv' 
  },
  { 
    title: 'BIANCHI', 
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=2127910877&single=true&output=csv' 
  },
  { 
    title: 'ROSSI', 
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=254687727&single=true&output=csv' 
  },
  { 
    title: 'ROSATI', 
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=498630601&single=true&output=csv' 
  },
  { 
    title: 'VINI DOLCI', 
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=1582691495&single=true&output=csv' 
  }
];

// 💰 FUNZIONE PER CONVERTIRE VALORI EURO
function parseEuro(value) {
  if (!value || value === '') return null;
  const cleaned = value.toString().replace(/[^\d.,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// 🍷 FUNZIONE PER SINCRONIZZARE UNA CATEGORIA
function sincronizzaCategoria(categoria) {
  try {
    console.log(`🔄 Sincronizzando ${categoria.title}...`);
    
    // 1. SCARICA DATI CSV
    const response = UrlFetchApp.fetch(categoria.csvUrl);
    if (response.getResponseCode() !== 200) {
      throw new Error(`Errore HTTP ${response.getResponseCode()}`);
    }
    
    const csvData = response.getContentText();
    const lines = csvData.split('\n');
    
    if (lines.length < 2) {
      console.log(`⚠️ ${categoria.title}: Nessun dato disponibile`);
      return { success: true, wines: 0, errors: [] };
    }
    
    // 2. PARSE HEADER
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toUpperCase());
    console.log(`📋 ${categoria.title} Headers:`, headers);
    
    // 3. ELIMINA VINI ESISTENTI
    const deleteResponse = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/vini?tipologia=eq.${categoria.title}&user_id=eq.${DEFAULT_USER_ID}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_API_KEY,
        'Authorization': `Bearer ${SUPABASE_API_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    });
    
    if (deleteResponse.getResponseCode() !== 204) {
      console.log(`⚠️ Impossibile eliminare vini esistenti per ${categoria.title}`);
    }
    
    // 4. PROCESSA RIGHE DATI
    const viniDaInserire = [];
    const errori = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.replace(/"/g, '').trim());
      
      // Crea oggetto riga
      const riga = {};
      headers.forEach((header, index) => {
        riga[header] = values[index] || '';
      });
      
      // Estrai nome vino
      const nomeVino = riga['NOME VINO'] || riga['NOME'] || riga['NAME'] || '';
      
      if (!nomeVino || nomeVino.toUpperCase() === categoria.title.toUpperCase()) {
        continue; // Salta righe vuote o header duplicati
      }
      
      // Prepara dati per inserimento
      const vinoData = {
        nome_vino: nomeVino,
        anno: riga['ANNO'] || null,
        produttore: riga['PRODUTTORE'] || null,
        provenienza: riga['PROVENIENZA'] || null,
        fornitore: riga['FORNITORE'] || null,
        costo: parseEuro(riga['COSTO'] || riga['COSTO ']),
        vendita: parseEuro(riga['VENDITA']),
        margine: parseEuro(riga['MARGINE']),
        tipologia: categoria.title,
        user_id: DEFAULT_USER_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      viniDaInserire.push(vinoData);
    }
    
    console.log(`🍷 ${categoria.title}: ${viniDaInserire.length} vini da inserire`);
    
    // 5. INSERISCI VINI IN BATCH (MAX 100 PER VOLTA)
    let totalInseriti = 0;
    const batchSize = 100;
    
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
          console.log(`✅ ${categoria.title}: Batch ${Math.floor(i/batchSize) + 1} inserito (${batch.length} vini)`);
        } else {
          console.error(`❌ Errore inserimento batch ${categoria.title}:`, insertResponse.getContentText());
          errori.push(`Errore inserimento batch: ${insertResponse.getContentText()}`);
        }
        
        // Pausa tra batch per evitare rate limiting
        if (i + batchSize < viniDaInserire.length) {
          Utilities.sleep(500);
        }
        
      } catch (batchError) {
        console.error(`❌ Errore batch ${categoria.title}:`, batchError);
        errori.push(`Errore batch: ${batchError.toString()}`);
      }
    }
    
    console.log(`✅ ${categoria.title}: ${totalInseriti} vini sincronizzati con successo`);
    
    return {
      success: true,
      wines: totalInseriti,
      errors: errori
    };
    
  } catch (error) {
    console.error(`❌ Errore sincronizzazione ${categoria.title}:`, error);
    return {
      success: false,
      wines: 0,
      errors: [error.toString()]
    };
  }
}

// 🚀 FUNZIONE PRINCIPALE DI SINCRONIZZAZIONE
function sincronizzaTutteLeCategorie() {
  console.log('🚀 Avvio sincronizzazione completa...');
  
  let totalVini = 0;
  let categorieOK = 0;
  const tuttiErrori = [];
  
  for (const categoria of MAPPATURA_SUPABASE) {
    try {
      const risultato = sincronizzaCategoria(categoria);
      
      if (risultato.success) {
        totalVini += risultato.wines;
        categorieOK++;
      }
      
      if (risultato.errors && risultato.errors.length > 0) {
        tuttiErrori.push(...risultato.errors);
      }
      
      // Pausa tra categorie
      Utilities.sleep(1000);
      
    } catch (error) {
      console.error(`❌ Errore categoria ${categoria.title}:`, error);
      tuttiErrori.push(`Errore ${categoria.title}: ${error.toString()}`);
    }
  }
  
  console.log(`🏁 Sincronizzazione completata:`);
  console.log(`   📊 ${totalVini} vini sincronizzati`);
  console.log(`   ✅ ${categorieOK}/${MAPPATURA_SUPABASE.length} categorie OK`);
  
  if (tuttiErrori.length > 0) {
    console.log(`   ⚠️ ${tuttiErrori.length} errori:`, tuttiErrori);
  }
  
  return {
    totalWines: totalVini,
    successfulCategories: categorieOK,
    totalCategories: MAPPATURA_SUPABASE.length,
    errors: tuttiErrori
  };
}

// 🔄 FUNZIONE PER TRIGGER AUTOMATICO (ogni minuto)
function onTimeBasedTrigger() {
  console.log('⏰ Trigger automatico avviato:', new Date());
  sincronizzaTutteLeCategorie();
}

// 🛠️ FUNZIONE PER CONFIGURARE IL TRIGGER AUTOMATICO
function configuraTriggersAutomatici() {
  // Elimina trigger esistenti
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });
  
  // Crea nuovo trigger ogni minuto
  ScriptApp.newTrigger('onTimeBasedTrigger')
    .timeBased()
    .everyMinutes(1)
    .create();
  
  console.log('✅ Trigger automatico configurato (ogni minuto)');
}

// 🧪 FUNZIONE DI TEST
function testSincronizzazione() {
  console.log('🧪 Test sincronizzazione...');
  
  // Test con una sola categoria
  const testCategoria = MAPPATURA_SUPABASE[0]; // BOLLICINE ITALIANE
  const risultato = sincronizzaCategoria(testCategoria);
  
  console.log('📊 Risultato test:', risultato);
  
  return risultato;
}

// 📋 FUNZIONE PER VERIFICARE STATO DATABASE
function verificaStatoDatabase() {
  try {
    const response = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/vini?user_id=eq.${DEFAULT_USER_ID}&select=tipologia,count`, {
      headers: {
        'apikey': SUPABASE_API_KEY,
        'Authorization': `Bearer ${SUPABASE_API_KEY}`
      }
    });
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      console.log('📊 Stato database vini:', data.length, 'record trovati');
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
// 2. Sostituisci SUPABASE_URL, SUPABASE_API_KEY e DEFAULT_USER_ID con i tuoi valori
// 3. Salva il progetto
// 4. Esegui 'configuraTriggersAutomatici()' una volta per attivare la sincronizzazione automatica
// 5. Usa 'testSincronizzazione()' per testare
// 6. Usa 'sincronizzaTutteLeCategorie()' per sincronizzazione manuale
// 7. Usa 'verificaStatoDatabase()' per controllare i dati
//
// La sincronizzazione avverrà automaticamente ogni minuto una volta configurata
// ============================================

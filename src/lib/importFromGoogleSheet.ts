
import { connectToGoogleSheet, getSheetData, extractSpreadsheetId } from './googleSheets';
import { supabase, isSupabaseAvailable } from './supabase';

export interface ImportResult {
  success: boolean;
  message: string;
  importedWines: number;
  importedCategories: number;
  errors?: string[];
}

const CATEGORY_MAPPINGS = {
  'ROSSI': 'ROSSI',
  'BIANCHI': 'BIANCHI',
  'BIANCO': 'BIANCHI',
  'VINI BIANCHI': 'BIANCHI',
  'BOLLICINE': 'BOLLICINE ITALIANE',
  'BOLLICINE ITALIANE': 'BOLLICINE ITALIANE',
  'BOLLICINE FRANCESI': 'BOLLICINE FRANCESI',
  'ROSATI': 'ROSATI',
  'ROSÉ': 'ROSATI',
  'ROSATO': 'ROSATI',
  'VINI DOLCI': 'VINI DOLCI',
  'DOLCI': 'VINI DOLCI'
};

async function importCategoryFromSheet(doc: any, sheetTitle: string, userId: string) {
  if (!isSupabaseAvailable || !supabase) {
    throw new Error('Supabase non disponibile');
  }

  const categoryName = CATEGORY_MAPPINGS[sheetTitle.toUpperCase()] || sheetTitle.toUpperCase();
  
  try {
    const wineData = await getSheetData(doc, sheetTitle);
    
    if (wineData.length === 0) {
      return { wines: 0, categoryCreated: false, errors: [] };
    }

    // Rimuovi i vini esistenti per questa categoria
    const { error: deleteError } = await supabase
      .from('vini')
      .delete()
      .eq('tipologia', categoryName)
      .eq('user_id', userId);

    if (deleteError) {
      throw deleteError;
    }

    console.log(`📊 ${sheetTitle}: ${wineData.length} righe grezze dal Google Sheet`);
    
    // Debug: mostra alcuni esempi di dati
    if (wineData.length > 0) {
      console.log('🔍 Esempio di riga dal Google Sheet:', wineData[0]);
    }

    // Prepara i dati per l'inserimento
    const validWines = wineData
      .filter(wine => wine.nome_vino && wine.nome_vino.trim())
      .map(wine => ({
        nome_vino: wine.nome_vino.trim(),
        anno: wine.anno?.trim() || null,
        produttore: wine.produttore?.trim() || null,
        provenienza: wine.provenienza?.trim() || null,
        fornitore: wine.fornitore?.trim() || null,
        costo: wine.costo,
        vendita: wine.vendita,
        margine: wine.margine,
        tipologia: categoryName,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

    console.log(`✅ ${sheetTitle}: ${validWines.length} vini validi preparati per l'inserimento`);

    if (validWines.length > 0) {
      const { error: insertError } = await supabase
        .from('vini')
        .insert(validWines);

      if (insertError) {
        throw insertError;
      }
    }

    return { 
      wines: validWines.length, 
      categoryCreated: validWines.length > 0, 
      errors: [] 
    };

  } catch (error) {
    console.error(`Errore importazione ${sheetTitle}:`, error);
    return { 
      wines: 0, 
      categoryCreated: false, 
      errors: [`Errore nel foglio ${sheetTitle}: ${error.message}`] 
    };
  }
}

// Sistema di sincronizzazione automatica
let autoSyncInterval: NodeJS.Timeout | null = null;

export function startAutoSync(googleSheetUrl: string, userId: string) {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
  }
  
  console.log('🔄 Avvio sincronizzazione automatica ogni 1 minuto');
  console.log('📍 Google Sheet URL:', googleSheetUrl);
  console.log('👤 User ID:', userId);
  
  // Esegui una sincronizzazione immediata al primo avvio
  setTimeout(async () => {
    console.log('🚀 Sincronizzazione immediata al primo avvio...');
    try {
      const result = await importFromGoogleSheet(googleSheetUrl, userId);
      console.log('📊 Risultato sincronizzazione immediata:', result);
      
      if (result.success && result.importedWines > 0) {
        console.log(`✅ Sincronizzazione immediata: ${result.importedWines} vini importati`);
        
        // Notifica l'utente dell'aggiornamento
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('winesUpdated', { 
            detail: { message: result.message, wines: result.importedWines }
          });
          window.dispatchEvent(event);
        }
      }
    } catch (error) {
      console.error('❌ Errore sincronizzazione immediata:', error);
    }
  }, 2000);
  
  autoSyncInterval = setInterval(async () => {
    try {
      const now = new Date().toLocaleTimeString();
      console.log(`🔍 [${now}] Controllo automatico aggiornamenti Google Sheet...`);
      
      const result = await importFromGoogleSheet(googleSheetUrl, userId);
      
      console.log(`📊 [${now}] Risultato sincronizzazione:`, {
        success: result.success,
        wines: result.importedWines,
        categories: result.importedCategories,
        message: result.message
      });
      
      if (result.success && result.importedWines > 0) {
        console.log(`✅ [${now}] Sincronizzazione automatica: ${result.importedWines} vini aggiornati`);
        
        // Notifica l'utente dell'aggiornamento
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('winesUpdated', { 
            detail: { message: result.message, wines: result.importedWines }
          });
          window.dispatchEvent(event);
        }
      } else if (result.success) {
        console.log(`📋 [${now}] Sincronizzazione automatica: nessun nuovo vino da importare`);
      } else {
        console.log(`❌ [${now}] Sincronizzazione fallita: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Errore sincronizzazione automatica:', error);
    }
  }, 60 * 1000); // 1 minuto
}

export function stopAutoSync() {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
    console.log('⏹️ Sincronizzazione automatica fermata');
  }
}

export async function importFromGoogleSheet(googleSheetUrl: string, userId: string): Promise<ImportResult> {
  if (!isSupabaseAvailable || !supabase) {
    return {
      success: false,
      message: 'Supabase non disponibile',
      importedWines: 0,
      importedCategories: 0
    };
  }

  if (!userId) {
    return {
      success: false,
      message: 'Utente non autenticato',
      importedWines: 0,
      importedCategories: 0
    };
  }

  try {
    const spreadsheetId = extractSpreadsheetId(googleSheetUrl);
    const doc = await connectToGoogleSheet(spreadsheetId);
    
    console.log(`📊 Connesso al Google Sheet: ${doc.title}`);
    
    // Debug: mostra tutti i fogli disponibili
    const availableSheets = doc.sheetsByIndex.map(sheet => sheet.title);
    console.log('📋 Fogli disponibili nel Google Sheet:', availableSheets);
    console.log('📅 Data ultimo aggiornamento Google Sheet:', doc.lastUpdatedTime);
    
    const sheetsToImport = Object.keys(CATEGORY_MAPPINGS);
    console.log('🔍 Fogli da cercare:', sheetsToImport);
    
    // Debug: verifica fogli disponibili per categorie specifiche
    const categoriesFound = {};
    for (const categoryKey of sheetsToImport) {
      const matchingSheets = availableSheets.filter(sheetName => {
        const upperSheet = sheetName.toUpperCase();
        const upperCategory = categoryKey.toUpperCase();
        
        // Cerca corrispondenze esatte o parziali
        return upperSheet === upperCategory || 
               upperSheet.includes(upperCategory.split(' ')[0]) ||
               (categoryKey === 'BOLLICINE ITALIANE' && (upperSheet.includes('BOLLICINE') || upperSheet.includes('BOLLICINI')));
      });
      
      if (matchingSheets.length > 0) {
        categoriesFound[categoryKey] = matchingSheets[0]; // Prende il primo match
        console.log(`🔄 Categoria "${categoryKey}" → Foglio "${matchingSheets[0]}"`);
      }
    }
    
    console.log('📋 Mapping categorie trovate:', categoriesFound);
    
    let totalWines = 0;
    let totalCategories = 0;
    const allErrors: string[] = [];

    // Importa ogni categoria disponibile
    for (const sheetName of sheetsToImport) {
      let actualSheetTitle = categoriesFound[sheetName];

      if (actualSheetTitle) {
        console.log(`🔄 Importando categoria: ${actualSheetTitle} → ${CATEGORY_MAPPINGS[sheetName]}`);
        
        // Debug: mostra info prima dell'importazione
        const currentCount = await supabase
          .from('vini')
          .select('id', { count: 'exact' })
          .eq('tipologia', CATEGORY_MAPPINGS[sheetName])
          .eq('user_id', userId);
        
        console.log(`📊 Vini attuali in DB per ${CATEGORY_MAPPINGS[sheetName]}:`, currentCount.count);
        
        const result = await importCategoryFromSheet(doc, actualSheetTitle, userId);
        totalWines += result.wines;
        
        if (result.categoryCreated) {
          totalCategories++;
        }
        
        if (result.errors.length > 0) {
          allErrors.push(...result.errors);
        }

        console.log(`✅ ${actualSheetTitle}: ${result.wines} vini importati (${currentCount.count} → ${result.wines})`);

        // Pausa tra le importazioni per evitare rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log(`❌ Foglio non trovato per categoria: ${sheetName}`);
        allErrors.push(`Foglio per categoria "${sheetName}" non trovato nel Google Sheet`);
      }
    }

    const message = totalWines > 0 
      ? `✅ ${totalWines} vini importati da ${totalCategories} categorie`
      : '❌ Nessun vino importato';

    return {
      success: totalWines > 0,
      message,
      importedWines: totalWines,
      importedCategories: totalCategories,
      errors: allErrors.length > 0 ? allErrors : undefined
    };

  } catch (error) {
    console.error('Errore importazione Google Sheet:', error);
    return {
      success: false,
      message: `Errore: ${error.message}`,
      importedWines: 0,
      importedCategories: 0,
      errors: [error.message]
    };
  }
}

export async function saveGoogleSheetLink(userId: string, googleSheetUrl: string) {
  if (!isSupabaseAvailable || !supabase) {
    throw new Error('Supabase non disponibile');
  }

  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      google_sheet_url: googleSheetUrl,
      updated_at: new Date().toISOString()
    });

  if (error) {
    throw error;
  }
}

export async function getGoogleSheetLink(userId: string): Promise<string | null> {
  if (!isSupabaseAvailable || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('google_sheet_url')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.google_sheet_url;
  } catch (error) {
    console.error('Errore caricamento link Google Sheet:', error);
    return null;
  }
}

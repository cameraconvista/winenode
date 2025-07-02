
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
    
    const sheetsToImport = Object.keys(CATEGORY_MAPPINGS);
    console.log('🔍 Fogli da cercare:', sheetsToImport);
    
    let totalWines = 0;
    let totalCategories = 0;
    const allErrors: string[] = [];

    // Importa ogni categoria disponibile
    for (const sheetName of sheetsToImport) {
      const actualSheetTitle = doc.sheetsByIndex.find(sheet => 
        sheet.title.toUpperCase() === sheetName
      )?.title;

      if (actualSheetTitle) {
        console.log(`🔄 Importando categoria: ${actualSheetTitle} → ${CATEGORY_MAPPINGS[sheetName]}`);
        
        const result = await importCategoryFromSheet(doc, actualSheetTitle, userId);
        totalWines += result.wines;
        
        if (result.categoryCreated) {
          totalCategories++;
        }
        
        if (result.errors.length > 0) {
          allErrors.push(...result.errors);
        }

        console.log(`✅ ${actualSheetTitle}: ${result.wines} vini importati`);

        // Pausa tra le importazioni per evitare rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log(`❌ Foglio non trovato: ${sheetName}`);
        allErrors.push(`Foglio "${sheetName}" non trovato nel Google Sheet`);
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

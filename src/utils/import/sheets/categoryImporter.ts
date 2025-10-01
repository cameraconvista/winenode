import { getSheetData } from '../../../lib/googleSheets';
import { supabase } from '../../../lib/supabase';
import { CATEGORY_MAPPINGS, CategoryImportResult } from './types';

export async function importCategoryFromSheet(doc: any, sheetTitle: string, userId: string): Promise<CategoryImportResult> {
  if (!supabase || !supabase) {
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

    const errors: string[] = [];
    let importedWines = 0;

    for (const wine of wineData) {
      try {
        const nome_vino = wine.nome_vino || (wine as any).name;
        if (!nome_vino || nome_vino.trim() === '') {
          errors.push(`Riga saltata: nome vino mancante`);
          continue;
        }

        const wineToInsert = {
          name: nome_vino.trim(),
          description: (wine as any).descrizione || (wine as any).description || '',
          cost: parseFloat((wine as any).costo || (wine as any).cost) || 0,
          inventory: parseInt((wine as any).giacenza || (wine as any).inventory) || 0,
          minStock: parseInt((wine as any).scorta_minima || (wine as any).minStock) || 5,
          tipologia: categoryName,
          vintage: wine.anno || (wine as any).vintage || null,
          user_id: userId
        };

        const { error: insertError } = await supabase
          .from('vini')
          .insert([wineToInsert]);

        if (insertError) {
          errors.push(`Errore inserimento ${nome_vino}: ${insertError.message}`);
        } else {
          importedWines++;
        }
      } catch (error) {
        const nome_vino = wine.nome_vino || (wine as any).name || 'vino sconosciuto';
        errors.push(`Errore processamento ${nome_vino}: ${error.message}`);
      }
    }

    return {
      wines: importedWines,
      categoryCreated: importedWines > 0,
      errors
    };

  } catch (error) {
    throw new Error(`Errore importazione categoria ${sheetTitle}: ${error.message}`);
  }
}

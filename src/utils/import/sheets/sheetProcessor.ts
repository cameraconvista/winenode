import { connectToGoogleSheet, extractSpreadsheetId } from '../../../lib/googleSheets';
import { ImportResult } from './types';
import { importCategoryFromSheet } from './categoryImporter';

export async function processGoogleSheetImport(sheetUrl: string, userId: string): Promise<ImportResult> {
  try {
    const spreadsheetId = extractSpreadsheetId(sheetUrl);
    if (!spreadsheetId) {
      return {
        success: false,
        message: 'URL del foglio Google non valido',
        importedWines: 0,
        importedCategories: 0,
        errors: ['URL non valido']
      };
    }

    const doc = await connectToGoogleSheet(spreadsheetId);
    await doc.loadInfo();

    let totalImportedWines = 0;
    let totalImportedCategories = 0;
    const allErrors: string[] = [];

    // Processa ogni foglio
    for (const sheet of doc.sheetsByIndex) {
      try {
        const result = await importCategoryFromSheet(doc, sheet.title, userId);
        
        totalImportedWines += result.wines;
        if (result.categoryCreated) {
          totalImportedCategories++;
        }
        
        if (result.errors.length > 0) {
          allErrors.push(...result.errors.map(err => `${sheet.title}: ${err}`));
        }
      } catch (error) {
        allErrors.push(`Errore foglio ${sheet.title}: ${error.message}`);
      }
    }

    const success = totalImportedWines > 0;
    const message = success 
      ? `Importazione completata: ${totalImportedWines} vini in ${totalImportedCategories} categorie`
      : 'Nessun vino importato';

    return {
      success,
      message,
      importedWines: totalImportedWines,
      importedCategories: totalImportedCategories,
      errors: allErrors.length > 0 ? allErrors : undefined
    };

  } catch (error) {
    return {
      success: false,
      message: `Errore durante l'importazione: ${error.message}`,
      importedWines: 0,
      importedCategories: 0,
      errors: [error.message]
    };
  }
}

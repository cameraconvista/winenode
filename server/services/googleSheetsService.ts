import { storage } from '../storage';

export interface ImportResult {
  success: boolean;
  imported: number;
  errors?: string[];
}

export interface ImportOptions {
  userId: string;
  sheetUrl: string;
}

/**
 * Google Sheets Service
 * Gestisce l'importazione e parsing dei dati da Google Sheets
 */
export class GoogleSheetsService {
  
  /**
   * Converte URL Google Sheets in URL CSV export
   */
  private convertToCSVUrl(sheetUrl: string): string {
    let csvUrl = sheetUrl;
    if (sheetUrl.includes('/edit')) {
      csvUrl = sheetUrl.replace('/edit#gid=', '/export?format=csv&gid=');
      if (!csvUrl.includes('export?format=csv')) {
        csvUrl = sheetUrl.replace('/edit', '/export?format=csv');
      }
    }
    return csvUrl;
  }

  /**
   * Scarica i dati CSV da Google Sheets
   */
  private async fetchCSVData(csvUrl: string): Promise<string> {
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Errore nel download: ${response.status}`);
    }
    return await response.text();
  }

  /**
   * Parsa una riga CSV e crea un oggetto wine
   */
  private parseCSVLine(line: string, lineNumber: number, userId: string): any {
    const columns = line.split(',').map(col => col.replace(/"/g, '').trim());
    
    if (columns.length < 2) {
      throw new Error('Numero insufficiente di colonne');
    }

    const name = columns[0];
    const type = columns[1].toLowerCase();
    
    if (!name || !type) {
      throw new Error('Nome o tipo mancante');
    }

    if (!['rosso', 'bianco', 'bollicine', 'rosato'].includes(type)) {
      throw new Error(`Tipo non valido: ${type}`);
    }

    return {
      name,
      type,
      supplier: columns[2] || 'Non specificato',
      inventory: parseInt(columns[3]) || 3,
      minStock: parseInt(columns[4]) || 2,
      price: columns[5] || '0.00',
      vintage: columns[6] || null,
      region: columns[7] || null,
      description: columns[8] || null,
      userId
    };
  }

  /**
   * Importa vini da Google Sheets
   */
  async importFromGoogleSheet(options: ImportOptions): Promise<ImportResult> {
    const { userId, sheetUrl } = options;
    
    try {
      // Converti URL e scarica CSV
      const csvUrl = this.convertToCSVUrl(sheetUrl);
      const csvText = await this.fetchCSVData(csvUrl);
      
      // Parsa righe CSV
      const lines = csvText.split('\n').filter(line => line.trim());
      let importedCount = 0;
      const errors: string[] = [];

      // Processa ogni riga (salta header)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const wineData = this.parseCSVLine(line, i + 1, userId);
          await storage.createWine(wineData);
          importedCount++;
        } catch (error) {
          errors.push(`Riga ${i + 1}: ${error.message}`);
        }
      }

      return {
        success: true,
        imported: importedCount,
        errors: errors.length > 0 ? errors : undefined
      };
      
    } catch (error) {
      console.error('Error importing Google Sheet:', error);
      throw new Error(`Errore nell'importazione: ${error.message}`);
    }
  }
}

// Singleton instance
export const googleSheetsService = new GoogleSheetsService();

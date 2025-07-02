
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Configurazione JWT per Google Sheets API
const GOOGLE_SERVICE_ACCOUNT_EMAIL = import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = import.meta.env.VITE_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  serviceAccountAuth: {
    client_email: string;
    private_key: string;
  };
}

export async function connectToGoogleSheet(spreadsheetId: string) {
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error('Credenziali Google Sheets non configurate. Aggiungi VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL e VITE_GOOGLE_PRIVATE_KEY nelle variabili ambiente.');
  }

  const serviceAccountAuth = new JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
  await doc.loadInfo();
  
  return doc;
}

export async function getSheetData(doc: GoogleSpreadsheet, sheetTitle: string) {
  const sheet = doc.sheetsByTitle[sheetTitle];
  if (!sheet) {
    throw new Error(`Foglio "${sheetTitle}" non trovato`);
  }

  await sheet.loadHeaderRow();
  const rows = await sheet.getRows();
  
  return rows.map(row => {
    // Helper function per parsing sicuro dei numeri
    const parseNumericValue = (value: string | undefined | null): number | null => {
      if (!value || value.trim() === '') return null;
      const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
      if (cleaned === '') return null;
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    };

    // Helper per valori di testo che possono essere vuoti
    const getTextValue = (value: string | undefined | null): string | null => {
      if (!value || value.trim() === '') return null;
      return value.trim();
    };

    return {
      nome_vino: row.get('NOME VINO') || row.get('NAME') || '',
      anno: getTextValue(row.get('ANNO')) || getTextValue(row.get('YEAR')),
      produttore: getTextValue(row.get('PRODUTTORE')) || getTextValue(row.get('PRODUCER')),
      provenienza: getTextValue(row.get('PROVENIENZA')) || getTextValue(row.get('ORIGIN')),
      fornitore: getTextValue(row.get('FORNITORE')) || getTextValue(row.get('SUPPLIER')),
      costo: parseNumericValue(row.get('COSTO')),
      vendita: parseNumericValue(row.get('VENDITA')),
      margine: parseNumericValue(row.get('MARGINE')),
    };
  });
}

export function extractSpreadsheetId(url: string): string {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    throw new Error('URL Google Sheets non valido');
  }
  return match[1];
}

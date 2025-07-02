
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
  
  return rows.map(row => ({
    nome_vino: row.get('NOME VINO') || row.get('NAME') || '',
    anno: row.get('ANNO') || row.get('YEAR') || '',
    produttore: row.get('PRODUTTORE') || row.get('PRODUCER') || '',
    provenienza: row.get('PROVENIENZA') || row.get('ORIGIN') || '',
    fornitore: row.get('FORNITORE') || row.get('SUPPLIER') || '',
    costo: parseFloat(row.get('COSTO')?.replace(/[^\d.,]/g, '')?.replace(',', '.') || '0') || null,
    vendita: parseFloat(row.get('VENDITA')?.replace(/[^\d.,]/g, '')?.replace(',', '.') || '0') || null,
    margine: parseFloat(row.get('MARGINE')?.replace(/[^\d.,]/g, '')?.replace(',', '.') || '0') || null,
  }));
}

export function extractSpreadsheetId(url: string): string {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    throw new Error('URL Google Sheets non valido');
  }
  return match[1];
}

/**
 * Shared Schemas Index
 * Esporta tutti gli schemi, tipi e validazioni per il progetto WineNode
 */

// Re-export wines schema
export {
  wines,
  Wine,
  InsertWine,
  WineSchema,
  InsertWineSchema,
} from './wines.schema';

// Re-export Google Sheets schema
export {
  googleSheetLinks,
  GoogleSheetLink,
  InsertGoogleSheetLink,
  GoogleSheetLinkSchema,
  InsertGoogleSheetLinkSchema,
} from './googleSheets.schema';

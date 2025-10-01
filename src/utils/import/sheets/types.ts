export interface ImportResult {
  success: boolean;
  message: string;
  importedWines: number;
  importedCategories: number;
  errors?: string[];
}

export interface CategoryImportResult {
  wines: number;
  categoryCreated: boolean;
  errors: string[];
}

export const CATEGORY_MAPPINGS = {
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
} as const;

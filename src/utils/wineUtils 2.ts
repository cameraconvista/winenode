import { WineRow } from '../lib/constants';

// Utility consolidata per gestione vini
export const parseCsvWineRows = (data: string[][], categoria: string): WineRow[] => {
  if (!data || data.length <= 1) return [];

  const headers = data[0];
  const nameIndex = headers.findIndex(h => 
    h?.toLowerCase().includes('nome') || 
    h?.toLowerCase().includes('vino') ||
    h?.toLowerCase().includes('denominazione')
  );

  if (nameIndex === -1) return [];

  return data.slice(1)
    .filter(row => row[nameIndex]?.trim())
    .map((row, index) => ({
      nomeVino: row[nameIndex]?.trim() || '',
      anno: row[headers.findIndex(h => h?.toLowerCase().includes('anno'))] || '',
      produttore: row[headers.findIndex(h => h?.toLowerCase().includes('produttore'))] || '',
      provenienza: row[headers.findIndex(h => h?.toLowerCase().includes('provenienza'))] || '',
      fornitore: row[headers.findIndex(h => h?.toLowerCase().includes('fornitore'))] || '',
      tipologia: categoria,
      giacenza: 0,
      ordine: index
    }));
};

export const buildEmptyRows = (count: number): WineRow[] => {
  return Array.from({ length: count }, (_, i) => ({
    nomeVino: '',
    anno: '',
    produttore: '',
    provenienza: '',
    fornitore: '',
    tipologia: '',
    giacenza: 0,
    ordine: i
  }));
};

export const validateWineData = (wine: WineRow): boolean => {
  return !!(wine.nomeVino?.trim());
};

export const sanitizeWineInput = (input: string): string => {
  return input?.trim().replace(/[<>]/g, '') || '';
};
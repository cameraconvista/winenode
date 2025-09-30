// Tipi per ordini - nomi invariati per compatibilità
export interface OrdineDettaglio {
  wineId: string;
  wineName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface Ordine {
  id: string;
  fornitore: string;
  fornitoreId?: string;
  data: string;
  dettagli?: OrdineDettaglio[];
  totale: number;
  bottiglie: number;
  stato: 'sospeso' | 'inviato' | 'archiviato';
  created_at?: string;
  updated_at?: string;
}

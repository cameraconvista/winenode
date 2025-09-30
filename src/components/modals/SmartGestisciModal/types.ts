// Tipi per SmartGestisciModal
export interface DettaglioOrdine {
  wineName: string;
  wineDescription?: string; // Produttore/descrizione
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface SmartGestisciModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (modifiedQuantities: Record<number, number>) => void;
  onArchive?: (modifiedQuantities: Record<number, number>) => void; // Callback per archiviazione
  ordineId: string;
  fornitore: string;
  dettagli: DettaglioOrdine[];
}

export interface EditingItem {
  index: number;
  originalValue: number;
  currentValue: number;
}

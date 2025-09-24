import { create } from 'zustand';

export interface OrderLine {
  wineId: number;
  unit: 'bottiglie' | 'cartoni';
  quantity: number;
}

export interface OrderDraft {
  supplierId: string | null;
  supplierName: string | null;
  lines: OrderLine[];
}

interface OrderDraftStore {
  draft: OrderDraft;
  setSupplier: (supplierId: string, supplierName: string) => void;
  setQuantity: (wineId: number, unit: 'bottiglie' | 'cartoni', quantity: number) => void;
  getQuantity: (wineId: number) => number;
  getUnit: (wineId: number) => 'bottiglie' | 'cartoni';
  getTotalBottles: () => number;
  getSelectedWinesCount: () => number;
  clear: () => void;
}

export const useOrderDraftStore = create<OrderDraftStore>((set, get) => ({
  draft: {
    supplierId: null,
    supplierName: null,
    lines: []
  },

  setSupplier: (supplierId: string, supplierName: string) => {
    set(state => ({
      draft: {
        ...state.draft,
        supplierId,
        supplierName
      }
    }));
  },

  setQuantity: (wineId: number, unit: 'bottiglie' | 'cartoni', quantity: number) => {
    set(state => {
      const existingLineIndex = state.draft.lines.findIndex(line => line.wineId === wineId);
      
      if (quantity === 0) {
        // Rimuovi la riga se quantità è 0
        return {
          draft: {
            ...state.draft,
            lines: state.draft.lines.filter(line => line.wineId !== wineId)
          }
        };
      }

      if (existingLineIndex >= 0) {
        // Aggiorna riga esistente
        const newLines = [...state.draft.lines];
        newLines[existingLineIndex] = { wineId, unit, quantity };
        return {
          draft: {
            ...state.draft,
            lines: newLines
          }
        };
      } else {
        // Aggiungi nuova riga
        return {
          draft: {
            ...state.draft,
            lines: [...state.draft.lines, { wineId, unit, quantity }]
          }
        };
      }
    });
  },

  getQuantity: (wineId: number) => {
    const line = get().draft.lines.find(line => line.wineId === wineId);
    return line?.quantity || 0;
  },

  getUnit: (wineId: number) => {
    const line = get().draft.lines.find(line => line.wineId === wineId);
    return line?.unit || 'bottiglie';
  },

  getTotalBottles: () => {
    return get().draft.lines.reduce((total, line) => {
      return total + (line.unit === 'cartoni' ? line.quantity * 6 : line.quantity);
    }, 0);
  },

  getSelectedWinesCount: () => {
    return get().draft.lines.length;
  },

  clear: () => {
    set({
      draft: {
        supplierId: null,
        supplierName: null,
        lines: []
      }
    });
  }
}));

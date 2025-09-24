import { describe, it, expect, beforeEach } from 'vitest';
import { useOrderDraftStore } from '../orderDraft.store';

describe('OrderDraftStore', () => {
  beforeEach(() => {
    // Reset store prima di ogni test
    useOrderDraftStore.getState().clear();
  });

  describe('setSupplier', () => {
    it('should set supplier correctly', () => {
      const { setSupplier, draft } = useOrderDraftStore.getState();
      
      setSupplier('supplier-1', 'Fornitore Test');
      
      const updatedDraft = useOrderDraftStore.getState().draft;
      expect(updatedDraft.supplierId).toBe('supplier-1');
      expect(updatedDraft.supplierName).toBe('Fornitore Test');
    });
  });

  describe('setQuantity', () => {
    it('should add new line when quantity > 0', () => {
      const { setQuantity } = useOrderDraftStore.getState();
      
      setQuantity(1, 'bottiglie', 12);
      
      const { draft } = useOrderDraftStore.getState();
      expect(draft.lines).toHaveLength(1);
      expect(draft.lines[0]).toEqual({
        wineId: 1,
        unit: 'bottiglie',
        quantity: 12
      });
    });

    it('should update existing line', () => {
      const { setQuantity } = useOrderDraftStore.getState();
      
      // Aggiungi riga iniziale
      setQuantity(1, 'bottiglie', 12);
      // Aggiorna la stessa riga
      setQuantity(1, 'cartoni', 2);
      
      const { draft } = useOrderDraftStore.getState();
      expect(draft.lines).toHaveLength(1);
      expect(draft.lines[0]).toEqual({
        wineId: 1,
        unit: 'cartoni',
        quantity: 2
      });
    });

    it('should remove line when quantity is 0', () => {
      const { setQuantity } = useOrderDraftStore.getState();
      
      // Aggiungi riga
      setQuantity(1, 'bottiglie', 12);
      expect(useOrderDraftStore.getState().draft.lines).toHaveLength(1);
      
      // Rimuovi impostando quantità a 0
      setQuantity(1, 'bottiglie', 0);
      expect(useOrderDraftStore.getState().draft.lines).toHaveLength(0);
    });
  });

  describe('getQuantity', () => {
    it('should return correct quantity for existing wine', () => {
      const { setQuantity, getQuantity } = useOrderDraftStore.getState();
      
      setQuantity(1, 'bottiglie', 12);
      
      expect(getQuantity(1)).toBe(12);
    });

    it('should return 0 for non-existing wine', () => {
      const { getQuantity } = useOrderDraftStore.getState();
      
      expect(getQuantity(999)).toBe(0);
    });
  });

  describe('getUnit', () => {
    it('should return correct unit for existing wine', () => {
      const { setQuantity, getUnit } = useOrderDraftStore.getState();
      
      setQuantity(1, 'cartoni', 2);
      
      expect(getUnit(1)).toBe('cartoni');
    });

    it('should return "bottiglie" as default for non-existing wine', () => {
      const { getUnit } = useOrderDraftStore.getState();
      
      expect(getUnit(999)).toBe('bottiglie');
    });
  });

  describe('getTotalBottles', () => {
    it('should calculate total bottles correctly', () => {
      const { setQuantity, getTotalBottles } = useOrderDraftStore.getState();
      
      setQuantity(1, 'bottiglie', 12); // 12 bottiglie
      setQuantity(2, 'cartoni', 2);    // 2 cartoni = 12 bottiglie
      
      expect(getTotalBottles()).toBe(24);
    });

    it('should return 0 when no lines', () => {
      const { getTotalBottles } = useOrderDraftStore.getState();
      
      expect(getTotalBottles()).toBe(0);
    });
  });

  describe('getSelectedWinesCount', () => {
    it('should return correct count of selected wines', () => {
      const { setQuantity, getSelectedWinesCount } = useOrderDraftStore.getState();
      
      setQuantity(1, 'bottiglie', 12);
      setQuantity(2, 'cartoni', 2);
      
      expect(getSelectedWinesCount()).toBe(2);
    });

    it('should return 0 when no wines selected', () => {
      const { getSelectedWinesCount } = useOrderDraftStore.getState();
      
      expect(getSelectedWinesCount()).toBe(0);
    });
  });

  describe('clear', () => {
    it('should reset draft to initial state', () => {
      const { setSupplier, setQuantity, clear } = useOrderDraftStore.getState();
      
      // Popola il draft
      setSupplier('supplier-1', 'Fornitore Test');
      setQuantity(1, 'bottiglie', 12);
      
      // Verifica che sia popolato
      expect(useOrderDraftStore.getState().draft.supplierId).toBe('supplier-1');
      expect(useOrderDraftStore.getState().draft.lines).toHaveLength(1);
      
      // Clear
      clear();
      
      // Verifica reset
      const { draft } = useOrderDraftStore.getState();
      expect(draft.supplierId).toBeNull();
      expect(draft.supplierName).toBeNull();
      expect(draft.lines).toHaveLength(0);
    });
  });
});

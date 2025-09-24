import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { useWineRowData } from '../hooks/useWineRowData';
import { useOrderDraftStore } from '../state/orderDraft.store';

// Componente test per verificare re-render
const TestWineRow = ({ wineId }: { wineId: number }) => {
  const renderCount = React.useRef(0);
  renderCount.current++;
  
  const { quantity, unit, handleQuantityChange } = useWineRowData(wineId);
  
  return (
    <div data-testid={`wine-${wineId}`}>
      <span data-testid={`render-count-${wineId}`}>{renderCount.current}</span>
      <span data-testid={`quantity-${wineId}`}>{quantity}</span>
      <span data-testid={`unit-${wineId}`}>{unit}</span>
      <button 
        data-testid={`increase-${wineId}`}
        onClick={() => handleQuantityChange(1)}
      >
        +
      </button>
    </div>
  );
};

describe('Performance Tests', () => {
  beforeEach(() => {
    useOrderDraftStore.getState().clear();
  });

  describe('Selective Re-rendering', () => {
    it('should only re-render affected wine row when quantity changes', () => {
      const { getByTestId } = render(
        <div>
          <TestWineRow wineId={1} />
          <TestWineRow wineId={2} />
          <TestWineRow wineId={3} />
        </div>
      );

      // Verifica render iniziale
      expect(getByTestId('render-count-1')).toHaveTextContent('1');
      expect(getByTestId('render-count-2')).toHaveTextContent('1');
      expect(getByTestId('render-count-3')).toHaveTextContent('1');

      // Cambia quantità solo per wine 1
      fireEvent.click(getByTestId('increase-1'));

      // Solo wine 1 dovrebbe essere ri-renderizzato
      expect(getByTestId('render-count-1')).toHaveTextContent('2');
      expect(getByTestId('render-count-2')).toHaveTextContent('1'); // Non cambiato
      expect(getByTestId('render-count-3')).toHaveTextContent('1'); // Non cambiato

      // Verifica che la quantità sia aggiornata
      expect(getByTestId('quantity-1')).toHaveTextContent('1');
      expect(getByTestId('quantity-2')).toHaveTextContent('0');
      expect(getByTestId('quantity-3')).toHaveTextContent('0');
    });
  });

  describe('Store Performance', () => {
    it('should handle multiple quantity updates efficiently', () => {
      const store = useOrderDraftStore.getState();
      
      // Misura tempo per 100 operazioni
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        store.setQuantity(1, 'bottiglie', i);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Dovrebbe completare in meno di 10ms
      expect(duration).toBeLessThan(10);
      
      // Verifica stato finale
      expect(store.getQuantity(1)).toBe(99);
    });

    it('should efficiently calculate totals with many items', () => {
      const store = useOrderDraftStore.getState();
      
      // Aggiungi 50 vini con quantità diverse
      for (let i = 1; i <= 50; i++) {
        store.setQuantity(i, i % 2 === 0 ? 'cartoni' : 'bottiglie', i);
      }
      
      // Misura tempo calcolo totale
      const startTime = performance.now();
      const total = store.getTotalBottles();
      const endTime = performance.now();
      
      // Calcolo dovrebbe essere quasi istantaneo
      expect(endTime - startTime).toBeLessThan(1);
      
      // Verifica calcolo corretto
      let expectedTotal = 0;
      for (let i = 1; i <= 50; i++) {
        expectedTotal += i % 2 === 0 ? i * 6 : i; // cartoni * 6 o bottiglie
      }
      expect(total).toBe(expectedTotal);
    });
  });

  describe('Memory Management', () => {
    it('should clean up store when items are removed', () => {
      const store = useOrderDraftStore.getState();
      
      // Aggiungi alcuni vini
      store.setQuantity(1, 'bottiglie', 10);
      store.setQuantity(2, 'cartoni', 5);
      store.setQuantity(3, 'bottiglie', 8);
      
      expect(store.draft.lines).toHaveLength(3);
      
      // Rimuovi impostando quantità a 0
      store.setQuantity(2, 'cartoni', 0);
      
      expect(store.draft.lines).toHaveLength(2);
      expect(store.draft.lines.find(line => line.wineId === 2)).toBeUndefined();
      
      // Clear completo
      store.clear();
      
      expect(store.draft.lines).toHaveLength(0);
      expect(store.draft.supplierId).toBeNull();
    });
  });
});

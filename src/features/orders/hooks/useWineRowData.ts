import { useOrderDraftStore } from '../state/orderDraft.store';
import { useMemo, useCallback } from 'react';

/**
 * Hook ottimizzato per singola riga vino
 * Si sottoscrive solo ai dati specifici per evitare re-render inutili
 */
export function useWineRowData(wineId: number) {
  // Selector cachato e stabile per evitare loop infiniti
  const selector = useCallback(
    (state: any) => {
      const line = state.draft.lines.find((line: any) => line.wineId === wineId);
      return {
        quantity: line?.quantity || 0,
        unit: (line?.unit || 'bottiglie') as 'bottiglie' | 'cartoni'
      };
    },
    [wineId]
  );

  const data = useOrderDraftStore(selector);
  const { quantity, unit } = data;

  // Azioni non causano re-render
  const setQuantity = useOrderDraftStore(state => state.setQuantity);

  const handleQuantityChange = (delta: number) => {
    const increment = unit === 'cartoni' ? 6 : 1;
    const newQty = Math.max(0, quantity + (delta * increment));
    setQuantity(wineId, unit, newQty);
  };

  const handleUnitChange = (newUnit: 'bottiglie' | 'cartoni') => {
    // Mantieni la quantità convertendola nell'unità equivalente
    let convertedQty = quantity;
    if (unit === 'cartoni' && newUnit === 'bottiglie') {
      convertedQty = quantity * 6; // 1 cartone = 6 bottiglie
    } else if (unit === 'bottiglie' && newUnit === 'cartoni') {
      convertedQty = Math.floor(quantity / 6); // 6 bottiglie = 1 cartone
    }
    
    setQuantity(wineId, newUnit, convertedQty);
  };

  return {
    quantity,
    unit,
    handleQuantityChange,
    handleUnitChange
  };
}

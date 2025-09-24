import { useOrderDraftStore } from '../state/orderDraft.store';

/**
 * Hook ottimizzato per singola riga vino
 * Si sottoscrive solo ai dati specifici per evitare re-render inutili
 */
export function useWineRowData(wineId: number) {
  // Selector specifico per questa riga - si aggiorna solo se cambia questa riga
  const { quantity, unit } = useOrderDraftStore(state => {
    const line = state.draft.lines.find(line => line.wineId === wineId);
    return {
      quantity: line?.quantity || 0,
      unit: line?.unit || 'bottiglie' as const
    };
  });

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

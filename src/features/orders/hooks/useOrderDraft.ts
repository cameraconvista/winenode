import { useOrderDraftStore } from '../state/orderDraft.store';

export function useOrderDraft() {
  const {
    draft,
    setSupplier,
    setQuantity,
    getQuantity,
    getUnit,
    getTotalBottles,
    getSelectedWinesCount,
    clear
  } = useOrderDraftStore();

  const handleQuantityChange = (wineId: number, delta: number) => {
    const currentQty = getQuantity(wineId);
    const currentUnit = getUnit(wineId);
    const increment = currentUnit === 'cartoni' ? 6 : 1;
    const newQty = Math.max(0, currentQty + (delta * increment));
    
    setQuantity(wineId, currentUnit, newQty);
  };

  const handleUnitChange = (wineId: number, unit: 'bottiglie' | 'cartoni') => {
    const currentQty = getQuantity(wineId);
    // Reset quantità quando si cambia unità per evitare confusione
    setQuantity(wineId, unit, 0);
  };

  return {
    draft,
    setSupplier,
    setQuantity,
    getQuantity,
    getUnit,
    getTotalBottles,
    getSelectedWinesCount,
    handleQuantityChange,
    handleUnitChange,
    clear
  };
}

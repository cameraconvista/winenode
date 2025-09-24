import { useOrderDraftStore } from '../state/orderDraft.store';

export function useOrderDraft() {
  const draft = useOrderDraftStore(state => state.draft);
  const setSupplier = useOrderDraftStore(state => state.setSupplier);
  const setQuantity = useOrderDraftStore(state => state.setQuantity);
  const getQuantity = useOrderDraftStore(state => state.getQuantity);
  const getUnit = useOrderDraftStore(state => state.getUnit);
  const getTotalBottles = useOrderDraftStore(state => state.getTotalBottles);
  const getSelectedWinesCount = useOrderDraftStore(state => state.getSelectedWinesCount);
  const clear = useOrderDraftStore(state => state.clear);

  const handleQuantityChange = (wineId: number, delta: number) => {
    const currentQty = getQuantity(wineId);
    const currentUnit = getUnit(wineId);
    const increment = currentUnit === 'cartoni' ? 6 : 1;
    const newQty = Math.max(0, currentQty + (delta * increment));
    
    console.log('🔍 handleQuantityChange:', { wineId, delta, currentQty, currentUnit, newQty });
    setQuantity(wineId, currentUnit, newQty);
  };

  const handleUnitChange = (wineId: number, newUnit: 'bottiglie' | 'cartoni') => {
    const currentQty = getQuantity(wineId);
    const currentUnit = getUnit(wineId);
    
    // Converti la quantità nell'unità equivalente invece di resettare
    let convertedQty = currentQty;
    if (currentUnit === 'cartoni' && newUnit === 'bottiglie') {
      convertedQty = currentQty * 6; // 1 cartone = 6 bottiglie
    } else if (currentUnit === 'bottiglie' && newUnit === 'cartoni') {
      convertedQty = Math.floor(currentQty / 6); // 6 bottiglie = 1 cartone
    }
    
    setQuantity(wineId, newUnit, convertedQty);
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

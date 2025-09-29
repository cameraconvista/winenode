import { useState, useMemo } from 'react';

export interface OrdineItem {
  wineId: string;
  quantity: number;
  unit: 'bottiglie' | 'cartoni';
}

export function useCreaOrdine() {
  const [ordineItems, setOrdineItems] = useState<OrdineItem[]>([]);
  const [unitPreferences, setUnitPreferences] = useState<Record<string, 'bottiglie' | 'cartoni'>>({});

  const handleQuantityChange = (wineId: string, delta: number) => {
    setOrdineItems(prev => {
      const existingIndex = prev.findIndex(item => item.wineId === wineId);
      
      if (existingIndex >= 0) {
        const newItems = [...prev];
        const currentQuantity = newItems[existingIndex].quantity;
        const newQuantity = Math.max(0, currentQuantity + delta);
        
        // console.log(`🔢 Quantity change: ${wineId}, current: ${currentQuantity}, delta: ${delta}, new: ${newQuantity}`);
        
        if (newQuantity === 0) {
          // Rimuovi item se quantità è 0
          newItems.splice(existingIndex, 1);
        } else {
          newItems[existingIndex].quantity = newQuantity;
        }
        
        return newItems;
      } else if (delta > 0) {
        // Aggiungi nuovo item se delta positivo - USA PREFERENZA O DEFAULT CARTONI
        const preferredUnit = unitPreferences[wineId] || 'cartoni';
        // console.log(`➕ Creating new item: ${wineId}, quantity: ${delta}, unit: ${preferredUnit}`);
        return [...prev, {
          wineId,
          quantity: delta,
          unit: preferredUnit
        }];
      }
      
      return prev;
    });
  };

  const handleUnitChange = (wineId: string, unit: 'bottiglie' | 'cartoni') => {
    setOrdineItems(prev => {
      const existingIndex = prev.findIndex(item => item.wineId === wineId);
      
      if (existingIndex >= 0) {
        const newItems = [...prev];
        const currentQuantity = newItems[existingIndex].quantity;
        // console.log(`🔄 Unit change: ${wineId}, keeping quantity: ${currentQuantity}, new unit: ${unit}`);
        // MANTIENI quantità esistente quando si cambia unità (selezione manuale)
        newItems[existingIndex].unit = unit;
        return newItems;
      } else {
        // NON creare item se non esiste - memorizza solo la preferenza
        // console.log(`🆕 Unit selection for new item: ${wineId}, unit: ${unit} - saving preference`);
        setUnitPreferences(prevPrefs => ({
          ...prevPrefs,
          [wineId]: unit
        }));
        return prev; // Non modificare ordineItems
      }
    });
  };

  // Calcola totale bottiglie (convertendo cartoni in bottiglie)
  const totalBottiglie = useMemo(() => {
    return ordineItems.reduce((total, item) => {
      const multiplier = item.unit === 'cartoni' ? 6 : 1; // Assumiamo 6 bottiglie per cartone
      return total + (item.quantity * multiplier);
    }, 0);
  }, [ordineItems]);

  const resetOrdine = () => {
    setOrdineItems([]);
  };

  return {
    ordineItems,
    totalBottiglie,
    unitPreferences,
    handleQuantityChange,
    handleUnitChange,
    resetOrdine
  };
}

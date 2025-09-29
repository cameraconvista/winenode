import { useState, useMemo, useCallback } from 'react';

export interface OrdineItem {
  wineId: string;
  quantity: number;
  unit: 'bottiglie' | 'cartoni';
}

export function useCreaOrdine() {
  const [ordineItems, setOrdineItems] = useState<OrdineItem[]>([]);
  const [unitPreferences, setUnitPreferences] = useState<Record<string, 'bottiglie' | 'cartoni'>>({});

  const handleQuantityChange = useCallback((wineId: string, delta: number) => {
    setOrdineItems(prev => {
      const existingIndex = prev.findIndex(item => item.wineId === wineId);
      
      if (existingIndex >= 0) {
        const newItems = [...prev];
        const currentQuantity = newItems[existingIndex].quantity;
        const newQuantity = Math.max(0, currentQuantity + delta);
        
        console.log(`🔢 Quantity change: ${wineId}, current: ${currentQuantity}, delta: ${delta}, new: ${newQuantity}`);
        
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
        console.log(`➕ Creating new item: ${wineId}, quantity: ${delta}, unit: ${preferredUnit}`);
        return [...prev, {
          wineId,
          quantity: delta,
          unit: preferredUnit
        }];
      }
      
      return prev;
    });
  }, [unitPreferences]);

  const handleUnitChange = useCallback((wineId: string, unit: 'bottiglie' | 'cartoni') => {
    const existingIndex = ordineItems.findIndex(item => item.wineId === wineId);
    
    console.log(`🔄 Unit change: ${wineId}, unit: ${unit}, existingIndex: ${existingIndex}`);
    
    if (existingIndex >= 0) {
      // Item esiste: RESET quantità a 0 quando si cambia unità
      console.log(`🔄 Resetting quantity to 0 and changing unit to: ${unit}`);
      setOrdineItems(prev => {
        const newItems = [...prev];
        // RIMUOVI l'item esistente (reset a 0)
        newItems.splice(existingIndex, 1);
        return newItems;
      });
    }
    
    // Salva sempre la preferenza unità per futuri click +
    console.log(`🆕 Saving unit preference: ${wineId} -> ${unit}`);
    setUnitPreferences(prevPrefs => ({
      ...prevPrefs,
      [wineId]: unit
    }));
  }, [ordineItems]);

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

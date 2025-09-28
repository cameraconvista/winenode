import { useState, useMemo } from 'react';

export interface OrdineItem {
  wineId: string;
  quantity: number;
  unit: 'bottiglie' | 'cartoni';
}

export function useCreaOrdine() {
  const [ordineItems, setOrdineItems] = useState<OrdineItem[]>([]);

  const handleQuantityChange = (wineId: string, delta: number) => {
    setOrdineItems(prev => {
      const existingIndex = prev.findIndex(item => item.wineId === wineId);
      
      if (existingIndex >= 0) {
        const newItems = [...prev];
        const newQuantity = Math.max(0, newItems[existingIndex].quantity + delta);
        
        if (newQuantity === 0) {
          // Rimuovi item se quantità è 0
          newItems.splice(existingIndex, 1);
        } else {
          newItems[existingIndex].quantity = newQuantity;
        }
        
        return newItems;
      } else if (delta > 0) {
        // Aggiungi nuovo item se delta positivo
        return [...prev, {
          wineId,
          quantity: delta,
          unit: 'cartoni' // Default cambiato a cartoni per la maggior parte degli ordini
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
        // Reset quantità a 0 quando si cambia unità
        newItems[existingIndex].quantity = 0;
        newItems[existingIndex].unit = unit;
        return newItems;
      } else {
        // Crea nuovo item se non esiste
        return [...prev, {
          wineId,
          quantity: 0,
          unit
        }];
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
    handleQuantityChange,
    handleUnitChange,
    resetOrdine
  };
}

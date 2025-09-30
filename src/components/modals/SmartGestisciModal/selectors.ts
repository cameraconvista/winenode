import { useMemo } from 'react';
import { DettaglioOrdine } from './types';
import useWines from '../../../hooks/useWines';

// Hook per calcolare totale confermato
export function useTotalConfermato(dettagli: DettaglioOrdine[], modifiedQuantities: Record<number, number>) {
  return useMemo(() => {
    return dettagli.reduce((acc, dettaglio, index) => {
      const quantity = modifiedQuantities[index] ?? dettaglio.quantity;
      return acc + quantity;
    }, 0);
  }, [dettagli, modifiedQuantities]);
}

// Hook per calcolare valore confermato
export function useValoreConfermato(dettagli: DettaglioOrdine[], modifiedQuantities: Record<number, number>) {
  return useMemo(() => {
    return dettagli.reduce((acc, dettaglio, index) => {
      const quantity = modifiedQuantities[index] ?? dettaglio.quantity;
      return acc + (quantity * dettaglio.unitPrice);
    }, 0);
  }, [dettagli, modifiedQuantities]);
}

// Hook per recuperare il produttore dal nome del vino
export function useWineProducer() {
  const { wines } = useWines();
  
  return useMemo(() => {
    return (wineName: string) => {
      const wine = wines.find(w => w.name === wineName);
      return wine?.description || null;
    };
  }, [wines]);
}

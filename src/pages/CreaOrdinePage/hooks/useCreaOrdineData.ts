import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useWines } from '../../../hooks/useWinesOffline';
import { useCreaOrdine } from '../../../hooks/useCreaOrdine';

export const useCreaOrdineData = () => {
  const { supplier } = useParams<{ supplier: string }>();
  const { wines, loading } = useWines();
  
  const {
    ordineItems,
    totalBottiglie,
    unitPreferences,
    handleQuantityChange,
    handleUnitChange
  } = useCreaOrdine();

  // Memoizza filtro vini per fornitore selezionato
  const supplierWines = useMemo(() => {
    const decodedSupplier = decodeURIComponent(supplier || '');
    return wines.filter(wine => wine.supplier === decodedSupplier);
  }, [wines, supplier]);

  // Memoizza lookup O(1) per ordineItems
  const ordineItemsById = useMemo(() => {
    const map = new Map();
    ordineItems.forEach(item => map.set(item.wineId, item));
    return map;
  }, [ordineItems]);

  return {
    supplier,
    wines,
    loading,
    supplierWines,
    ordineItems,
    ordineItemsById,
    totalBottiglie,
    unitPreferences,
    handleQuantityChange,
    handleUnitChange
  };
};

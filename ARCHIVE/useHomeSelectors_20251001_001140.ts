import { useMemo } from 'react';
import { WineType } from '../../../hooks/useWines';
import { useWineSearch } from '../../../hooks/useWineSearch';
import { isFeatureEnabled } from '../../../config/features';
import { HomeFilters } from './useHomeState';

export function useHomeSelectors(
  wines: WineType[], 
  activeTab: string, 
  filters: HomeFilters
) {
  // Memoizza testo chip per performance
  const chipDisplayText = useMemo(() => {
    switch (activeTab) {
      case 'TUTTI I VINI': return 'Tutti';
      case 'BOLLICINE ITALIANE': return 'Bollicine IT';
      case 'BOLLICINE FRANCESI': return 'Bollicine FR';
      case 'BIANCHI': return 'Bianchi';
      case 'ROSSI': return 'Rossi';
      case 'ROSATI': return 'Rosati';
      case 'VINI DOLCI': return 'Dolci';
      default: return 'Tutti';
    }
  }, [activeTab]);

  // Memoizza filtri e ordinamento per performance
  const baseFilteredWines = useMemo(() => {
    return wines
      .filter(wine => {
        const normalizedType = (wine.type || '').toLowerCase(); // ✅ FIX crash

        // Esclude le righe che sono solo nomi di tipologie (senza produttore/descrizione)
        const isTypeHeaderOnly = !wine.description && !wine.supplier && 
          (wine.name === "BIANCHI" || wine.name === "ROSSI" || wine.name === "ROSATI" || 
           wine.name === "BOLLICINE ITALIANE" || wine.name === "BOLLICINE FRANCESI" || 
           wine.name === "VINI DOLCI");

        if (isTypeHeaderOnly) {
          return false;
        }

        const matchesCategory = 
          activeTab === "TUTTI I VINI" ||
          (activeTab === "BOLLICINE ITALIANE" && (normalizedType === "bollicine italiane" || normalizedType === "bollicine")) ||
          (activeTab === "BOLLICINE FRANCESI" && normalizedType === "bollicine francesi") ||
          (activeTab === "BIANCHI" && (normalizedType === "bianchi" || normalizedType === "bianco")) ||
          (activeTab === "ROSSI" && (normalizedType === "rossi" || normalizedType === "rosso")) ||
          (activeTab === "ROSATI" && (normalizedType === "rosati" || normalizedType === "rosato")) ||
          (activeTab === "VINI DOLCI" && (normalizedType === "vini dolci" || normalizedType === "dolce"));

        const matchesType = !filters.wineType || normalizedType === filters.wineType;
        const matchesSupplier = !filters.supplier || wine.supplier === filters.supplier;
        // Logica alert: se showAlertsOnly è true, mostra SOLO vini con giacenza <= minStock
        const isInAlert = wine.inventory <= wine.minStock;
        const matchesAlerts = !filters.showAlertsOnly || isInAlert;

        return matchesCategory && matchesType && matchesSupplier && matchesAlerts;
      })
      .sort((a, b) => {
        // ✅ Ordinamento alfabetico A-Z SOLO per "TUTTI I VINI"
        if (activeTab === "TUTTI I VINI") {
          return a.name.localeCompare(b.name, 'it', { 
            sensitivity: 'base',
            numeric: true,
            ignorePunctuation: true 
          });
        }
        // ✅ Per le singole tipologie, mantieni ordine originale del database/Google Sheet
        return 0;
      });
  }, [wines, activeTab, filters.wineType, filters.supplier, filters.showAlertsOnly]);

  // Hook ricerca vini (solo se feature abilitata)
  const wineSearch = useWineSearch(baseFilteredWines);

  // Memoizza risultato finale con ricerca
  const filteredWines = useMemo(() => {
    if (isFeatureEnabled('searchLens') && wineSearch.isFiltering) {
      // Filtra baseFilteredWines basandosi sui risultati della ricerca
      const searchIds = new Set(wineSearch.filteredWines.map(w => w.id));
      return baseFilteredWines.filter(wine => searchIds.has(wine.id));
    }
    return baseFilteredWines;
  }, [baseFilteredWines, wineSearch.isFiltering, wineSearch.filteredWines]);

  return {
    chipDisplayText,
    baseFilteredWines,
    filteredWines,
    wineSearch
  };
}

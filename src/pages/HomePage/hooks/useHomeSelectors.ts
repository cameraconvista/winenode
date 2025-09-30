import { useMemo } from 'react';
import { WineType } from '../../../hooks/useWines';
import { useWineSearch } from '../../../hooks/useWineSearch';
import { isFeatureEnabled } from '../../../config/features';
import { HomeFilters } from './useHomeState';

// Helper functions per ridurre complessità
const getChipDisplayText = (activeTab: string): string => {
  const chipMap: Record<string, string> = {
    'TUTTI I VINI': 'Tutti',
    'BOLLICINE ITALIANE': 'Bollicine IT',
    'BOLLICINE FRANCESI': 'Bollicine FR',
    'BIANCHI': 'Bianchi',
    'ROSSI': 'Rossi',
    'ROSATI': 'Rosati',
    'VINI DOLCI': 'Dolci'
  };
  return chipMap[activeTab] || 'Tutti';
};

const isTypeHeaderOnly = (wine: WineType): boolean => {
  const typeHeaders = ["BIANCHI", "ROSSI", "ROSATI", "BOLLICINE ITALIANE", "BOLLICINE FRANCESI", "VINI DOLCI"];
  return !wine.description && !wine.supplier && typeHeaders.includes(wine.name);
};

const matchesCategory = (wine: WineType, activeTab: string): boolean => {
  if (activeTab === "TUTTI I VINI") return true;
  
  const normalizedType = (wine.type || '').toLowerCase();
  const categoryMatches: Record<string, string[]> = {
    'BOLLICINE ITALIANE': ['bollicine italiane', 'bollicine'],
    'BOLLICINE FRANCESI': ['bollicine francesi'],
    'BIANCHI': ['bianchi', 'bianco'],
    'ROSSI': ['rossi', 'rosso'],
    'ROSATI': ['rosati', 'rosato'],
    'VINI DOLCI': ['vini dolci', 'dolce']
  };
  
  return categoryMatches[activeTab]?.includes(normalizedType) || false;
};

const sortWines = (wines: WineType[], activeTab: string): WineType[] => {
  if (activeTab === "TUTTI I VINI") {
    return wines.sort((a, b) => a.name.localeCompare(b.name, 'it', { 
      sensitivity: 'base',
      numeric: true,
      ignorePunctuation: true 
    }));
  }
  return wines; // Mantieni ordine originale per tipologie specifiche
};

export function useHomeSelectors(
  wines: WineType[], 
  activeTab: string, 
  filters: HomeFilters
) {
  // Memoizza testo chip per performance
  const chipDisplayText = useMemo(() => getChipDisplayText(activeTab), [activeTab]);

  // Memoizza filtri e ordinamento per performance
  const baseFilteredWines = useMemo(() => {
    const filtered = wines.filter(wine => {
      // Esclude header tipologie
      if (isTypeHeaderOnly(wine)) return false;
      
      // Applica filtri
      const normalizedType = (wine.type || '').toLowerCase();
      const matchesCat = matchesCategory(wine, activeTab);
      const matchesType = !filters.wineType || normalizedType === filters.wineType;
      const matchesSupplier = !filters.supplier || wine.supplier === filters.supplier;
      const matchesAlerts = !filters.showAlertsOnly || wine.inventory <= wine.minStock;

      return matchesCat && matchesType && matchesSupplier && matchesAlerts;
    });
    
    return sortWines(filtered, activeTab);
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

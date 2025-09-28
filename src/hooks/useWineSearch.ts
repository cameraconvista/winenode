import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from './useDebounce';

export interface Wine {
  id: string;
  name: string;
  description?: string;
  vintage?: string;
  supplier?: string;
  [key: string]: any;
}

/**
 * Normalizza stringa per ricerca case-insensitive e accent-insensitive
 */
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
    .trim();
};

/**
 * Hook per ricerca locale sui vini
 * Filtra solo per nome del vino con debounce
 */
export const useWineSearch = (wines: Wine[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Debounce della query per performance
  const debouncedQuery = useDebounce(searchQuery, 200);
  
  // Lista filtrata con memoization
  const filteredWines = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return wines;
    }
    
    const normalizedQuery = normalizeString(debouncedQuery);
    
    return wines.filter(wine => {
      const normalizedName = normalizeString(wine.name || '');
      return normalizedName.includes(normalizedQuery);
    });
  }, [wines, debouncedQuery]);
  
  // Handlers
  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);
  
  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, []);
  
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);
  
  const updateQuery = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);
  
  return {
    // Stato
    searchQuery,
    isSearchOpen,
    filteredWines,
    hasResults: filteredWines.length > 0,
    isFiltering: debouncedQuery.trim().length > 0,
    
    // Actions
    openSearch,
    closeSearch,
    clearSearch,
    updateQuery,
  };
};

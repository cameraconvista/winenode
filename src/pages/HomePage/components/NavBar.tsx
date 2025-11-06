import React, { memo } from 'react';
import PhosphorCart from '~icons/ph/shopping-cart-light';
import PhosphorFunnel from '~icons/ph/funnel-light';
import PhosphorBell from '~icons/ph/bell-light';
import PhosphorMagnifyingGlass from '~icons/ph/magnifying-glass-light';
import PhosphorArrowClockwise from '~icons/ph/arrow-clockwise-light';
import { isFeatureEnabled } from '../../../config/features';
import { CategoryChip } from './CategoryChip';
import { HomeFilters } from '../hooks/useHomeState';

interface NavBarProps {
  filters: HomeFilters;
  setFilters: React.Dispatch<React.SetStateAction<HomeFilters>>;
  setShowFilterModal: (show: boolean) => void;
  activeTab: string;
  chipDisplayText: string;
  wineSearch: {
    isSearchOpen: boolean;
    toggleSearch: () => void;
  };
  onCarrelloClick: () => void;
  onTabChange: (category: string) => void;
  onRefreshWines: () => void;
}

export const NavBar = memo(function NavBar({
  filters,
  setFilters,
  setShowFilterModal,
  activeTab,
  chipDisplayText,
  wineSearch,
  onCarrelloClick,
  onTabChange,
  onRefreshWines
}: NavBarProps) {
  return (
    <nav className="mobile-navbar">
      {/* Gruppo icone a sinistra */}
      <div className="nav-icons-group">
        <button 
          onClick={onCarrelloClick}
          className="nav-btn btn-ordine"
          title="Carrello Ordini"
        >
          <PhosphorCart className="icon" aria-hidden="true" />
        </button>
        
        <button 
          onClick={() => setShowFilterModal(true)} 
          className="nav-btn btn-filtri"
          title="Filtri"
          style={{ 
            background: (filters.wineType || filters.supplier) ? '#d4a300' : 'transparent',
            color: (filters.wineType || filters.supplier) ? 'white' : 'var(--text)',
            borderRadius: '8px',
            border: 'none',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
            WebkitAppearance: 'none',
            appearance: 'none'
          } as React.CSSProperties}
        >
          <PhosphorFunnel 
            className="icon" 
            aria-hidden="true"
            style={{
              color: (filters.wineType || filters.supplier) ? 'white' : 'var(--text)'
            }}
          />
        </button>
        
        <button
          onClick={() => setFilters(prev => ({ ...prev, showAlertsOnly: !prev.showAlertsOnly }))}
          className="nav-btn btn-allert"
          title={filters.showAlertsOnly ? "Mostra tutti i vini" : "Mostra solo vini in esaurimento"}
          style={{ 
            background: filters.showAlertsOnly ? 'var(--danger)' : 'transparent',
            color: filters.showAlertsOnly ? 'white' : 'var(--text)',
            borderRadius: '8px',
            border: 'none',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
            WebkitAppearance: 'none',
            appearance: 'none'
          } as React.CSSProperties}
        >
          <PhosphorBell 
            className="icon" 
            aria-hidden="true"
            style={{
              color: filters.showAlertsOnly ? 'white' : 'var(--text)'
            }}
          />
        </button>
        
        {/* Icona lente ricerca (se feature abilitata) */}
        {isFeatureEnabled('searchLens') && (
          <button
            onClick={wineSearch.toggleSearch}
            className="nav-btn btn-search"
            title={wineSearch.isSearchOpen ? "Chiudi ricerca" : "Cerca vini"}
            aria-label={wineSearch.isSearchOpen ? "Chiudi ricerca" : "Apri ricerca"}
            style={{ 
              background: wineSearch.isSearchOpen ? 'var(--accent)' : 'transparent',
              color: wineSearch.isSearchOpen ? 'white' : 'var(--text)',
              borderRadius: '8px',
              border: 'none',
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
              WebkitAppearance: 'none',
              appearance: 'none'
            } as React.CSSProperties}
          >
            <PhosphorMagnifyingGlass 
              className="icon" 
              aria-hidden="true"
              style={{
                color: wineSearch.isSearchOpen ? 'white' : 'var(--text)'
              }}
            />
          </button>
        )}
        
        {/* Pulsante refresh vini */}
        <button
          onClick={onRefreshWines}
          className="nav-btn btn-refresh"
          title="Aggiorna vini"
          aria-label="Aggiorna vini"
          style={{ 
            background: 'transparent',
            color: 'var(--text)',
            borderRadius: '8px',
            border: 'none',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
            WebkitAppearance: 'none',
            appearance: 'none'
          } as React.CSSProperties}
        >
          <PhosphorArrowClockwise 
            className="icon" 
            aria-hidden="true"
          />
        </button>
      </div>
      
      {/* Pulsante "Tutti" a destra */}
      <CategoryChip
        activeTab={activeTab}
        chipDisplayText={chipDisplayText}
        onTabChange={onTabChange}
      />
    </nav>
  );
});

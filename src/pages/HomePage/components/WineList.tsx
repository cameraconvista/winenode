import React, { memo } from 'react';
import { WineSearchBar } from '../../../components/search/WineSearchBar';
import { isFeatureEnabled } from '../../../config/features';
import { WineRow } from './WineRow';
import { WineType } from '../../../hooks/useWines';

interface WineListProps {
  filteredWines: WineType[];
  wines: WineType[];
  animatingInventory: string | null;
  wineSearch: {
    isSearchOpen: boolean;
    searchQuery: string;
    updateQuery: (query: string) => void;
    closeSearch: () => void;
    clearSearch: () => void;
  };
  onWineClick: (wine: WineType) => void;
  onOpenInventoryModal: (wine: WineType) => void;
}

export const WineList = memo(function WineList({
  filteredWines,
  wines,
  animatingInventory,
  wineSearch,
  onWineClick,
  onOpenInventoryModal
}: WineListProps) {
  return (
    <main className="mobile-content">
      <div 
        className="wine-list-container"
        style={{
          height: '100%',
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'none',
          touchAction: 'pan-y',
          scrollBehavior: 'smooth'
        }}
      >
        {/* Barra di ricerca (se feature abilitata) */}
        {isFeatureEnabled('searchLens') && (
          <WineSearchBar
            isOpen={wineSearch.isSearchOpen}
            searchQuery={wineSearch.searchQuery}
            onQueryChange={wineSearch.updateQuery}
            onClose={wineSearch.closeSearch}
            onClear={wineSearch.clearSearch}
          />
        )}

        {filteredWines.length === 0 ? (
          <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
            {wines.length === 0 ? 'Nessun vino nel tuo inventario' : 'Nessun vino trovato con i filtri selezionati'}
          </p>
        ) : (
          <div 
            className="space-y-0.5 sm:space-y-1 overflow-x-hidden w-full"
            style={{
              paddingBottom: 'calc(64pt + env(safe-area-inset-bottom, 0px) + 12pt)'
            }}
          >
            {filteredWines.map(wine => (
              <WineRow
                key={wine.id}
                wine={wine}
                animatingInventory={animatingInventory}
                onWineClick={onWineClick}
                onOpenInventoryModal={onOpenInventoryModal}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
});

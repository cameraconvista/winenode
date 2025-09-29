import React, { memo } from 'react';
import PhosphorBell from '~icons/ph/bell-light';
import { WineType } from '../../../hooks/useWines';

interface WineRowProps {
  wine: WineType;
  animatingInventory: string | null;
  onWineClick: (wine: WineType) => void;
  onOpenInventoryModal: (wine: WineType) => void;
}

export const WineRow = memo(function WineRow({ 
  wine, 
  animatingInventory, 
  onWineClick, 
  onOpenInventoryModal 
}: WineRowProps) {
  return (
    <div 
      key={wine.id} 
      className="wine-card rounded-lg overflow-x-hidden w-full max-w-full" 
      style={{ 
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        padding: '6px 8px',
        boxShadow: 'var(--shadow)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-3 overflow-x-hidden w-full">
        <div 
          className="flex-1 cursor-pointer overflow-x-hidden min-w-0" 
          onClick={() => onWineClick(wine)}
        >
          <div className="flex flex-col gap-0.5 sm:gap-1 overflow-x-hidden min-w-0">
            {/* Prima riga: Nome vino tutto maiuscolo */}
            <div 
              className="text-xs sm:text-sm font-semibold truncate overflow-x-hidden uppercase leading-tight" 
              style={{ color: 'var(--text)' }}
            >
              {wine.name}
            </div>
            {/* Seconda riga: Anno · Produttore · Fornitore € Prezzo */}
            <div 
              className="text-xs truncate overflow-x-hidden leading-tight" 
              style={{ fontSize: '10px' }}
            >
              {wine.vintage && (
                <>
                  <span className="vintage" style={{ color: 'var(--muted-text)' }}>
                    {wine.vintage}
                  </span>
                  {(wine.description || (wine.supplier && wine.supplier.trim() && wine.supplier.trim() !== 'Non specificato')) && (
                    <span className="mx-2" style={{ color: 'var(--muted-text)' }}>·</span>
                  )}
                </>
              )}
              {wine.description && (
                <>
                  <span className="producer" style={{ color: 'var(--muted-text)' }}>
                    {wine.description}
                  </span>
                  {wine.supplier && wine.supplier.trim() && wine.supplier.trim() !== 'Non specificato' && (
                    <span className="mx-2" style={{ color: 'var(--muted-text)' }}>·</span>
                  )}
                </>
              )}
              {wine.supplier && wine.supplier.trim() && wine.supplier.trim() !== 'Non specificato' && (
                <span className="font-medium" style={{ color: 'var(--warn)' }}>
                  {wine.supplier}
                </span>
              )}
            </div>
          </div>
        </div>
        {wine.inventory <= wine.minStock && (
          <PhosphorBell 
            className="flex-shrink-0 mr-2" 
            style={{ 
              width: '18px', 
              height: '18px', 
              color: 'var(--danger)' 
            }}
            aria-hidden="true" 
          />
        )}
        <div className="flex items-center flex-shrink-0 ml-auto">
          <span 
            onClick={e => { 
              e.stopPropagation(); 
              onOpenInventoryModal(wine);
            }}
            className={`font-bold text-sm sm:text-base cursor-pointer text-center py-2 px-2 transition-all duration-200 rounded-lg ${
              animatingInventory === wine.id ? 'animate-pulse' : ''
            }`}
            style={{ 
              color: wine.inventory <= wine.minStock ? 'var(--danger)' : 'var(--text)',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: animatingInventory === wine.id ? 'var(--warn)' : 'transparent',
              fontWeight: wine.inventory <= wine.minStock ? 'bold' : 'normal'
            }}
          >
            {wine.inventory || 0}
          </span>
        </div>
      </div>
    </div>
  );
});

import React from 'react';
import { useCreaOrdineData } from './hooks/useCreaOrdineData';
import { useCreaOrdineHandlers } from './hooks/useCreaOrdineHandlers';
import { CreaOrdineHeader } from './components/CreaOrdineHeader';
import { WineItem } from './components/WineItem';

export default function CreaOrdinePage() {
  const {
    supplier,
    loading,
    supplierWines,
    ordineItems,
    ordineItemsById,
    totalBottiglie,
    unitPreferences,
    handleQuantityChange,
    handleUnitChange
  } = useCreaOrdineData();

  const { handleBack, handleNavigateToSummary } = useCreaOrdineHandlers({
    supplier,
    ordineItems,
    totalBottiglie
  });

  if (loading) {
    return (
      <div className="homepage-container" style={{ 
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)'
      }}>
        <div style={{ color: '#541111' }}>Caricamento vini...</div>
      </div>
    );
  }

  return (
    <div className="homepage-container" style={{ 
      width: '100vw',
      height: '100vh',
      maxWidth: '100%',
      overflow: 'hidden',
      position: 'relative',
      background: 'var(--bg)'
    }}>
      <CreaOrdineHeader 
        supplier={supplier}
        totalBottiglie={totalBottiglie}
        onBack={handleBack}
      />

      {/* CONTENT SCROLLABILE */}
      <main className="mobile-content">
        <div className="wine-list-container"
          style={{
            height: '100%',
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'none',
            touchAction: 'pan-y',
            scrollBehavior: 'smooth',
            paddingTop: '120px',
            paddingBottom: '120px'
          }}
        >
          {supplierWines.length === 0 ? (
            <div 
              className="p-4 rounded-lg text-center"
              style={{ background: '#541111', border: '1px solid #8b7355', margin: '16px' }}
            >
              <p style={{ color: '#fff9dc' }}>
                Nessun vino disponibile per questo fornitore
              </p>
            </div>
          ) : (
            <div className="space-y-2" style={{ padding: '16px' }}>
              {supplierWines.map((wine) => {
                const ordineItem = ordineItemsById.get(wine.id);
                const unitPreference = unitPreferences[wine.id] || 'bottiglie';
                
                return (
                  <WineItem
                    key={wine.id}
                    wine={wine}
                    ordineItem={ordineItem}
                    unitPreference={unitPreference}
                    onQuantityChange={handleQuantityChange}
                    onUnitChange={handleUnitChange}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* FOOTER FISSO */}
      <footer 
        className="fixed bottom-0 left-0 right-0 p-4 border-t"
        style={{ 
          background: '#fff9dc', 
          borderColor: '#e2d6aa',
          paddingBottom: 'calc(max(env(safe-area-inset-bottom), 0px) + 28px)',
          zIndex: 50
        }}
      >
        <div className="flex flex-nowrap gap-3">
          <button
            onClick={handleBack}
            className="px-6 py-3 rounded-lg font-medium transition-colors"
            style={{ 
              background: 'white', 
              color: '#541111',
              border: '1px solid #e2d6aa',
              minHeight: '44px',
              minWidth: '120px',
              flex: '1',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              fontSize: window.innerWidth <= 767 ? '13px' : '16px'
            }}
          >
            Indietro
          </button>
          <button
            onClick={handleNavigateToSummary}
            disabled={totalBottiglie === 0}
            className="px-6 py-3 rounded-lg font-medium transition-colors"
            style={{ 
              background: totalBottiglie > 0 ? '#16a34a' : '#d1c7b8',
              color: '#fff9dc',
              minHeight: '44px',
              minWidth: '120px',
              flex: '1',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              fontSize: window.innerWidth <= 767 ? '13px' : '16px'
            }}
          >
            Conferma Ordine
          </button>
        </div>
      </footer>
    </div>
  );
}

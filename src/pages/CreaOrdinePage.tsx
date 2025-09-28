import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import useWines from '../hooks/useWines';
import { useCreaOrdine } from '../hooks/useCreaOrdine';

export default function CreaOrdinePage() {
  const { supplier } = useParams<{ supplier: string }>();
  const navigate = useNavigate();
  const { wines, loading } = useWines();
  
  const {
    ordineItems,
    totalBottiglie,
    handleQuantityChange,
    handleUnitChange
  } = useCreaOrdine();

  // Filtra vini per fornitore selezionato
  const supplierWines = wines.filter(wine => 
    wine.supplier === decodeURIComponent(supplier || '')
  );

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fff9dc' }}>
        <div className="text-center">
          <div className="text-lg font-medium" style={{ color: '#541111' }}>
            Caricamento vini...
          </div>
        </div>
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
      background: '#fff9dc'
    }}>
      {/* HEADER FISSO CON LOGO */}
      <header className="mobile-header">
        <div className="header-content">
          <div className="logo-wrap">
            <picture>
              <source type="image/webp" srcSet="/logo1.webp" />
              <img 
                src="/logo1.png" 
                alt="WINENODE"
                loading="eager"
              />
            </picture>
          </div>
        </div>
      </header>

      {/* CONTENT SCROLLABILE */}
      <main className="mobile-content">
        <div className="crea-ordine-page-content" style={{
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          
          {/* Titolo Centrato (senza freccia indietro) */}
          <div className="crea-ordine-header-section" style={{
            flexShrink: 0,
            padding: '16px',
            borderBottom: '1px solid #e2d6aa',
            background: '#fff9dc'
          }}>
            <div className="text-center">
              <h1 className="text-lg font-bold" style={{ color: '#541111' }}>
                Crea Ordine
              </h1>
              <p className="text-sm" style={{ color: '#7a4a30' }}>
                Fornitore: {decodeURIComponent(supplier || '')}
              </p>
            </div>
          </div>

          {/* Content Scrollabile */}
          <div className="crea-ordine-content-scroll" style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            padding: '16px',
            paddingBottom: 'max(env(safe-area-inset-bottom), 0px) + 80px'
          }}>
        {supplierWines.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-base" style={{ color: '#7a4a30' }}>
              Nessun vino trovato per questo fornitore
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {supplierWines.map((wine) => {
              const isLowStock = wine.inventory <= wine.minStock;
              const currentItem = ordineItems.find(item => item.wineId === wine.id);
              
              return (
                <div
                  key={wine.id}
                  className="p-4 rounded-lg border"
                  style={{
                    background: '#fff2b8',
                    borderColor: isLowStock ? '#fecaca' : '#e2d6aa'
                  }}
                >
                  {/* Wine Info */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-sm mb-1" style={{ color: '#541111' }}>
                        {wine.name}
                      </h3>
                      <p className="text-xs" style={{ color: '#7a4a30' }}>
                        {wine.description} {wine.vintage && `(${wine.vintage})`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium" style={{ 
                        color: isLowStock ? '#dc2626' : '#541111' 
                      }}>
                        Giacenza: {wine.inventory}
                      </div>
                      {isLowStock && (
                        <div className="text-xs flex items-center gap-1 mt-1" style={{ color: '#dc2626' }}>
                          <div 
                            className="w-3 h-3 flex-shrink-0"
                            style={{
                              WebkitMask: 'url("/allert.png") center/contain no-repeat',
                              mask: 'url("/allert.png") center/contain no-repeat',
                              background: '#dc2626'
                            }}
                          ></div>
                          Sotto soglia
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(wine.id, -1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors"
                        style={{ background: '#dc2626' }}
                        disabled={!currentItem || currentItem.quantity <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      
                      <div 
                        className="px-3 py-1 rounded text-center min-w-[60px] text-sm font-medium"
                        style={{ background: 'white', color: '#541111', border: '1px solid #e2d6aa' }}
                      >
                        {currentItem?.quantity || 0}
                      </div>
                      
                      <button
                        onClick={() => handleQuantityChange(wine.id, 1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors"
                        style={{ background: '#16a34a' }}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Unit Toggle */}
                    <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #e2d6aa' }}>
                      <button
                        onClick={() => handleUnitChange(wine.id, 'bottiglie')}
                        className="px-3 py-1 text-xs font-medium transition-colors"
                        style={{
                          background: (currentItem?.unit === 'bottiglie') ? '#8b7355' : 'white',
                          color: (currentItem?.unit === 'bottiglie') ? '#fff9dc' : '#541111',
                          border: (currentItem?.unit === 'bottiglie') ? '2px solid #d4a300' : '1px solid #e2d6aa'
                        }}
                      >
                        Bottiglie
                      </button>
                      <button
                        onClick={() => handleUnitChange(wine.id, 'cartoni')}
                        className="px-3 py-1 text-xs font-medium transition-colors"
                        style={{
                          background: (!currentItem || currentItem.unit === 'cartoni') ? '#8b7355' : 'white',
                          color: (!currentItem || currentItem.unit === 'cartoni') ? '#fff9dc' : '#541111',
                          border: (!currentItem || currentItem.unit === 'cartoni') ? '2px solid #d4a300' : '1px solid #e2d6aa'
                        }}
                      >
                        Cartoni
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          )}
          </div>
        </div>
      </main>

      {/* Footer Fisso */}
      <footer 
        className="fixed bottom-0 left-0 right-0 p-4 border-t"
        style={{ 
          background: '#fff9dc', 
          borderColor: '#e2d6aa',
          paddingBottom: 'max(env(safe-area-inset-bottom), 0px) + 16px',
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
            onClick={() => {
              console.log('🔘 Click Conferma Ordine - totalBottiglie:', totalBottiglie);
              console.log('🔘 ordineItems:', ordineItems);
              if (totalBottiglie > 0) {
                console.log('✅ Navigando a riepilogo ordine...');
                navigate(`/orders/summary/${supplier}`, {
                  state: {
                    ordineItems,
                    totalBottiglie
                  }
                });
              } else {
                console.log('❌ Nessuna bottiglia selezionata');
              }
            }}
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
            disabled={totalBottiglie === 0}
          >
            Gestisci Ordine
          </button>
        </div>
      </footer>
    </div>
  );
}

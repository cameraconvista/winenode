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
    <div className="min-h-screen" style={{ background: '#fff9dc' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 p-4 border-b" style={{ 
        background: '#fff9dc', 
        borderColor: '#e2d6aa' 
      }}>
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#541111' }}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold" style={{ color: '#541111' }}>
              Crea Ordine
            </h1>
            <p className="text-sm" style={{ color: '#7a4a30' }}>
              Fornitore: {decodeURIComponent(supplier || '')}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 pb-20">
        {supplierWines.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-base" style={{ color: '#7a4a30' }}>
              Nessun vino trovato per questo fornitore
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {supplierWines.map((wine) => {
              const isLowStock = wine.inventory <= wine.minStock;
              const currentItem = ordineItems.find(item => item.wineId === wine.id);
              
              return (
                <div
                  key={wine.id}
                  className="p-4 rounded-lg border"
                  style={{
                    background: isLowStock ? '#fef2f2' : '#fff2b8',
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
                          🔔 Sotto soglia
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
                          background: (!currentItem || currentItem.unit === 'bottiglie') ? '#8b7355' : 'white',
                          color: (!currentItem || currentItem.unit === 'bottiglie') ? '#fff9dc' : '#541111'
                        }}
                      >
                        Bottiglie
                      </button>
                      <button
                        onClick={() => handleUnitChange(wine.id, 'cartoni')}
                        className="px-3 py-1 text-xs font-medium transition-colors"
                        style={{
                          background: (currentItem?.unit === 'cartoni') ? '#8b7355' : 'white',
                          color: (currentItem?.unit === 'cartoni') ? '#fff9dc' : '#541111'
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
      </main>

      {/* Footer */}
      <footer 
        className="fixed bottom-0 left-0 right-0 p-4 border-t"
        style={{ background: '#fff9dc', borderColor: '#e2d6aa' }}
      >
        <div className="flex gap-3">
          <button
            onClick={handleBack}
            className="px-6 py-3 rounded-lg font-medium transition-colors"
            style={{ 
              background: 'white', 
              color: '#541111',
              border: '1px solid #e2d6aa'
            }}
          >
            Indietro
          </button>
          <button
            onClick={() => {
              if (totalBottiglie > 0) {
                navigate(`/orders/summary/${supplier}`, {
                  state: {
                    ordineItems,
                    totalBottiglie
                  }
                });
              }
            }}
            className="flex-1 px-6 py-3 rounded-lg font-medium transition-colors"
            style={{ 
              background: totalBottiglie > 0 ? '#8b7355' : '#d1c7b8',
              color: '#fff9dc'
            }}
            disabled={totalBottiglie === 0}
          >
            Conferma Ordine ({totalBottiglie} bottiglie)
          </button>
        </div>
      </footer>
    </div>
  );
}

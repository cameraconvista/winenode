import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Bell } from 'lucide-react';
import useSuppliers from '../hooks/useSuppliers';
import useWines from '../hooks/useWines';

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const supplierId = searchParams.get('supplier');
  
  const { suppliers } = useSuppliers();
  const { wines } = useWines();
  
  const [selectedSupplierName, setSelectedSupplierName] = useState<string>('');
  const [orderQuantities, setOrderQuantities] = useState<Record<number, number>>({});
  const [orderMode, setOrderMode] = useState<Record<number, 'bottiglie' | 'cartoni'>>({});

  useEffect(() => {
    if (supplierId && suppliers.length > 0) {
      const supplier = suppliers.find(s => s.id === supplierId);
      if (supplier) {
        setSelectedSupplierName(supplier.nome);
      }
    }
  }, [supplierId, suppliers]);

  const filteredWines = wines.filter(w => w.supplier === selectedSupplierName);
  const totalBottles = Object.values(orderQuantities).reduce((sum, qty) => sum + qty, 0);
  const selectedWinesCount = Object.values(orderQuantities).filter(qty => qty > 0).length;

  const handleQuantityChange = (wineId: number, delta: number) => {
    const currentQty = orderQuantities[wineId] || 0;
    const currentMode = orderMode[wineId] || 'bottiglie';
    const increment = currentMode === 'cartoni' ? 6 : 1;
    const newQty = Math.max(0, currentQty + (delta * increment));
    
    setOrderQuantities(prev => ({
      ...prev,
      [wineId]: newQty
    }));
  };

  const handleConfirmOrder = () => {
    // Qui implementeresti la logica per confermare l'ordine
    alert(`Ordine confermato: ${totalBottles} bottiglie da ${selectedSupplierName}`);
    navigate('/');
  };

  return (
    <div className="min-h-screen" style={{ background: '#fff9dc' }}>
      {/* HEADER STICKY */}
      <header 
        className="fixed top-0 left-0 right-0"
        style={{
          background: '#fff9dc',
          borderBottom: '1px solid rgba(84, 17, 17, 0.15)',
          paddingTop: `calc(env(safe-area-inset-top, 0px) + 8pt)`,
          paddingBottom: '8pt',
          minHeight: '56pt',
          maxHeight: '64pt',
          zIndex: 15
        }}
      >
        <div className="flex items-center justify-between px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 p-2 rounded-lg transition-colors"
            style={{ 
              color: '#541111',
              minWidth: '44px',
              minHeight: '44px'
            }}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Indietro</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-lg font-bold" style={{ color: '#541111' }}>
              Crea Ordine
            </h1>
            {selectedSupplierName && (
              <p className="text-sm opacity-80" style={{ color: '#541111' }}>
                Fornitore: {selectedSupplierName}
              </p>
            )}
          </div>
          
          <div className="w-20"></div> {/* Spacer per centrare il titolo */}
        </div>
      </header>

      {/* CONTENT SCROLLABILE */}
      <main 
        className="overflow-y-auto overflow-x-hidden"
        style={{
          paddingTop: `calc(env(safe-area-inset-top, 0px) + 72pt)`,
          paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 80pt)`,
          height: '100vh',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'none',
          zIndex: 10
        }}
      >
        <div className="px-4 space-y-4">
          {/* Lista vini */}
          {selectedSupplierName && filteredWines.length > 0 && (
            <div className="space-y-3">
              {filteredWines.map(wine => {
                const isLowStock = wine.inventory <= wine.minStock;
                const quantity = orderQuantities[Number(wine.id)] || 0;
                const mode = orderMode[Number(wine.id)] || 'bottiglie';
                
                return (
                  <div
                    key={wine.id}
                    className="p-4 rounded-lg"
                    style={{
                      background: isLowStock ? '#fef2f2' : '#fff3bf',
                      border: `1px solid ${isLowStock ? '#fca5a5' : 'rgba(84, 17, 17, 0.2)'}`,
                      borderLeft: `4px solid ${isLowStock ? '#ef4444' : '#f59e0b'}`
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-base" style={{ color: '#541111' }}>
                          {wine.name}
                        </h4>
                        {wine.description && (
                          <p className="text-sm opacity-80" style={{ color: '#541111' }}>
                            {wine.description} {wine.vintage && `(${wine.vintage})`}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right ml-4">
                        <p className={`text-sm font-bold`} style={{ 
                          color: isLowStock ? '#dc2626' : '#541111' 
                        }}>
                          Giacenza: {wine.inventory}
                        </p>
                        {isLowStock && (
                          <div className="flex items-center gap-1 mt-1">
                            <Bell className="h-3 w-3 text-red-600" />
                            <span className="text-xs text-red-600">Sotto soglia</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Controlli quantità */}
                    <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'rgba(84, 17, 17, 0.1)' }}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(Number(wine.id), -1)}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                          style={{ 
                            minWidth: '44px', 
                            minHeight: '44px',
                            width: '44px',
                            height: '44px'
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        
                        <div className="text-center min-w-16">
                          <div className="text-lg font-bold" style={{ color: '#541111' }}>
                            {mode === 'cartoni' ? Math.floor(quantity / 6) : quantity}
                          </div>
                          <div className="text-xs opacity-70" style={{ color: '#541111' }}>
                            {mode === 'cartoni' ? 'cartoni' : 'bottiglie'}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleQuantityChange(Number(wine.id), 1)}
                          className="bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors"
                          style={{ 
                            minWidth: '44px', 
                            minHeight: '44px',
                            width: '44px',
                            height: '44px'
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Toggle bottiglie/cartoni */}
                      <div className="flex rounded-lg p-1" style={{ background: 'rgba(84, 17, 17, 0.1)' }}>
                        <button
                          onClick={() => setOrderMode(prev => ({ ...prev, [Number(wine.id)]: 'bottiglie' }))}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            mode === 'bottiglie' ? 'text-white' : ''
                          }`}
                          style={{
                            background: mode === 'bottiglie' ? '#541111' : 'transparent',
                            color: mode === 'bottiglie' ? '#fff9dc' : '#541111'
                          }}
                        >
                          Bottiglie
                        </button>
                        <button
                          onClick={() => setOrderMode(prev => ({ ...prev, [Number(wine.id)]: 'cartoni' }))}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            mode === 'cartoni' ? 'text-white' : ''
                          }`}
                          style={{
                            background: mode === 'cartoni' ? '#541111' : 'transparent',
                            color: mode === 'cartoni' ? '#fff9dc' : '#541111'
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

          {/* Messaggio se nessun vino */}
          {selectedSupplierName && filteredWines.length === 0 && (
            <div 
              className="text-center py-8 rounded-lg"
              style={{ 
                background: '#fff3bf',
                border: '1px solid rgba(84, 17, 17, 0.2)'
              }}
            >
              <p style={{ color: '#541111' }}>
                Nessun vino trovato per il fornitore {selectedSupplierName}
              </p>
            </div>
          )}

          {/* Messaggio se nessun fornitore */}
          {!selectedSupplierName && (
            <div 
              className="text-center py-8 rounded-lg"
              style={{ 
                background: '#fff3bf',
                border: '1px solid rgba(84, 17, 17, 0.2)'
              }}
            >
              <p style={{ color: '#541111' }}>
                Fornitore non trovato. Torna indietro e seleziona un fornitore.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER STICKY */}
      <footer 
        className="fixed bottom-0 left-0 right-0"
        style={{
          background: '#fff9dc',
          borderTop: '1px solid rgba(84, 17, 17, 0.15)',
          paddingTop: '8pt',
          paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 8pt)`,
          minHeight: '64pt',
          maxHeight: '72pt',
          zIndex: 20
        }}
      >
        <div className="flex items-center justify-between px-4 gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 font-medium rounded-lg transition-colors"
            style={{
              color: '#541111',
              border: '1px solid rgba(84, 17, 17, 0.3)',
              background: 'transparent',
              minHeight: '44px'
            }}
          >
            Indietro
          </button>
          
          <button
            onClick={handleConfirmOrder}
            disabled={totalBottles === 0}
            className="flex-1 px-6 py-3 font-bold rounded-lg transition-colors disabled:opacity-50"
            style={{
              background: totalBottles > 0 ? '#541111' : '#9ca3af',
              color: '#fff9dc',
              border: 'none',
              minHeight: '44px'
            }}
          >
            Conferma Ordine ({totalBottles} bottiglie)
          </button>
        </div>
        
        {selectedWinesCount > 0 && (
          <div className="px-4 pt-2">
            <p className="text-xs text-center opacity-70" style={{ color: '#541111' }}>
              {selectedWinesCount} vini selezionati • {totalBottles} bottiglie totali
            </p>
          </div>
        )}
      </footer>
    </div>
  );
}

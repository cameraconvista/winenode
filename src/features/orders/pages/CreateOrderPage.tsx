import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import useSuppliers from '../../../hooks/useSuppliers';
import useWines from '../../../hooks/useWines';
import WineRow from '../components/WineRow';
import OrderTotalsBar from '../components/OrderTotalsBar';
import { useOrderDraft, useOrderSubmit } from '../hooks';

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const supplierId = searchParams.get('supplier') ?? '';
  
  const { suppliers } = useSuppliers();
  const { wines } = useWines();
  const { 
    draft, 
    setSupplier, 
    getQuantity, 
    getUnit, 
    getTotalBottles, 
    getSelectedWinesCount, 
    handleQuantityChange, 
    handleUnitChange 
  } = useOrderDraft();
  
  const { 
    submitOrder, 
    isSubmitting, 
    error, 
    success, 
    canSubmit,
    clearMessages 
  } = useOrderSubmit();
  
  const [selectedSupplierName, setSelectedSupplierName] = useState<string>('');

  useEffect(() => {
    if (supplierId && suppliers.length > 0) {
      const supplier = suppliers.find(s => s.id === supplierId);
      if (supplier && selectedSupplierName !== supplier.nome) {
        setSelectedSupplierName(supplier.nome);
        setSupplier(supplier.id, supplier.nome);
      }
    }
  }, [supplierId, suppliers, selectedSupplierName, setSupplier]);

  const filteredWines = wines.filter(w => w.supplier === selectedSupplierName);
  const totalBottles = getTotalBottles();
  const selectedWinesCount = getSelectedWinesCount();

  const handleConfirmOrder = async () => {
    clearMessages();
    await submitOrder();
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
          
          <div className="w-20"></div>
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
          {/* Messaggi di errore/successo */}
          {error && (
            <div 
              className="p-4 rounded-lg border"
              style={{
                background: '#fef2f2',
                borderColor: '#fca5a5',
                color: '#dc2626'
              }}
            >
              <p className="font-medium">Errore</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {success && (
            <div 
              className="p-4 rounded-lg border"
              style={{
                background: '#f0fdf4',
                borderColor: '#86efac',
                color: '#166534'
              }}
            >
              <p className="font-medium">Successo!</p>
              <p className="text-sm">{success}</p>
            </div>
          )}

          {/* Lista vini */}
          {selectedSupplierName && filteredWines.length > 0 && (
            <div className="space-y-3">
              {filteredWines.map(wine => {
                const wineId = Number(wine.id);
                const line = draft.lines.find(line => line.wineId === wineId);
                const quantity = line?.quantity || 0;
                const mode = line?.unit || 'bottiglie';
                
                console.log('🎯 Rendering wine:', { wineId, quantity, mode, line });
                
                return (
                  <WineRow
                    key={wine.id}
                    wine={wine}
                    quantity={quantity}
                    mode={mode}
                    onQuantityChange={handleQuantityChange}
                    onModeChange={handleUnitChange}
                  />
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
            disabled={!canSubmit}
            className="flex-1 px-6 py-3 font-bold rounded-lg transition-colors disabled:opacity-50"
            style={{
              background: canSubmit ? '#541111' : '#9ca3af',
              color: '#fff9dc',
              border: 'none',
              minHeight: '44px'
            }}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Invio in corso...
              </span>
            ) : (
              `Conferma Ordine (${totalBottles} bottiglie)`
            )}
          </button>
        </div>
        
        <OrderTotalsBar 
          selectedWinesCount={selectedWinesCount}
          totalBottles={totalBottles}
        />
      </footer>
    </div>
  );
}

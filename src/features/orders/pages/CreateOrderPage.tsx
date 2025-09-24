import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import useSuppliers from '../../../hooks/useSuppliers';
import useWines from '../../../hooks/useWines';
import WineRow from '../components/WineRow';
import OrderTotalsBar from '../components/OrderTotalsBar';
import { useOrderDraft } from '../hooks/useOrderDraft';

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const supplierId = searchParams.get('supplier') ?? '';
  
  const { suppliers } = useSuppliers();
  const { wines } = useWines();
  const { 
    draft, 
    setSupplier, 
    getTotalBottles, 
    getSelectedWinesCount
  } = useOrderDraft();
  
  const [selectedSupplierName, setSelectedSupplierName] = useState<string>('');

  useEffect(() => {
    if (supplierId && suppliers.length > 0) {
      const supplier = suppliers.find(s => s.id === supplierId);
      if (supplier) {
        setSelectedSupplierName(supplier.nome);
        setSupplier(supplier.id, supplier.nome);
      }
    }
  }, [supplierId, suppliers, setSupplier]);

  const filteredWines = wines.filter(w => w.supplier === selectedSupplierName);
  const totalBottles = getTotalBottles();
  const selectedWinesCount = getSelectedWinesCount();

  const handleConfirmOrder = () => {
    console.log(`Ordine confermato: ${totalBottles} bottiglie da ${selectedSupplierName}`);
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
          {/* Lista vini */}
          {selectedSupplierName && filteredWines.length > 0 && (
            <div className="space-y-3">
              {filteredWines.map(wine => (
                <WineRow
                  key={wine.id}
                  wine={wine}
                />
              ))}
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
        
        <OrderTotalsBar 
          selectedWinesCount={selectedWinesCount}
          totalBottles={totalBottles}
        />
      </footer>
    </div>
  );
}

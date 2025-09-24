import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { X, ArrowLeft, Check, AlertTriangle, Loader2 } from 'lucide-react';
import useWines from '../hooks/useWines';
import { OrdineItem } from '../hooks/useCreaOrdine';
import { useOrdini } from '../contexts/OrdiniContext';

interface LocationState {
  ordineItems: OrdineItem[];
  totalBottiglie: number;
}

export default function RiepilogoOrdinePage() {
  const { supplier } = useParams<{ supplier: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { wines } = useWines();
  const { aggiungiOrdine } = useOrdini();
  
  // Stati per feedback visivo
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const state = location.state as LocationState;
  const ordineItems = state?.ordineItems || [];
  const totalBottiglie = state?.totalBottiglie || 0;

  // Calcola dettagli ordine
  const ordineDetails = ordineItems.map(item => {
    const wine = wines.find(w => w.id === item.wineId);
    const unitPrice = wine?.cost || 0;
    const multiplier = item.unit === 'cartoni' ? 6 : 1;
    const totalQuantityBottiglie = item.quantity * multiplier;
    const totalPrice = totalQuantityBottiglie * unitPrice;

    return {
      ...item,
      wine,
      unitPrice,
      totalQuantityBottiglie,
      totalPrice
    };
  });

  const totalOrdine = ordineDetails.reduce((sum, detail) => sum + detail.totalPrice, 0);

  const handleClose = () => {
    navigate('/');
  };

  const handleModificaOrdine = () => {
    navigate(-1);
  };

  const handleConferma = async () => {
    if (isConfirming) return; // Previeni doppi click
    
    const fornitore = decodeURIComponent(supplier || '');
    
    console.log('🚀 Confermando ordine:', {
      fornitore,
      ordineItems,
      totalBottiglie,
      totalOrdine
    });

    setIsConfirming(true);

    try {
      // Crea nuovo ordine
      const nuovoOrdine = {
        fornitore,
        totale: totalOrdine,
        data: new Date().toLocaleDateString('it-IT'),
        stato: 'in_corso' as const,
        dettagli: ordineDetails.map(detail => ({
          wineId: detail.wineId,
          wineName: detail.wine?.name || 'Vino sconosciuto',
          quantity: detail.quantity,
          unit: detail.unit,
          unitPrice: detail.unitPrice,
          totalPrice: detail.totalPrice
        }))
      };

      // Aggiungi ordine agli inviati
      await aggiungiOrdine(nuovoOrdine);

      // Mostra messaggio di successo
      setShowSuccess(true);
      
      // Attendi 2 secondi per mostrare il messaggio di successo
      setTimeout(() => {
        // Naviga alla pagina Gestisci Ordini tab Inviati
        navigate('/orders/manage?tab=inviati');
      }, 2000);

    } catch (error) {
      console.error('❌ Errore durante la conferma ordine:', error);
      setIsConfirming(false);
      // Qui potresti aggiungere un toast di errore se necessario
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#fff9dc' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 p-4 border-b" style={{ 
        background: '#fff9dc', 
        borderColor: '#e2d6aa' 
      }}>
        <div className="flex items-center justify-end">
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#541111' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 pb-24">
        {/* Messaggio di successo */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div 
              className="p-8 rounded-lg text-center max-w-sm mx-4"
              style={{ background: '#fff9dc' }}
            >
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#16a34a' }}>
                  <Check className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#541111' }}>
                Ordine Confermato!
              </h3>
              <p className="text-base" style={{ color: '#7a4a30' }}>
                L'ordine è stato salvato con successo nell'archivio gestione ordini.
              </p>
              <div className="mt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderColor: '#541111' }}></div>
                <p className="text-sm mt-2" style={{ color: '#7a4a30' }}>
                  Reindirizzamento in corso...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Riepilogo Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">📋</span>
            <h2 className="text-xl font-bold" style={{ color: '#541111' }}>
              Riepilogo Ordine
            </h2>
          </div>
          <p className="text-base" style={{ color: '#7a4a30' }}>
            Fornitore: {decodeURIComponent(supplier || '')}
          </p>
        </div>

        {/* Dettaglio Ordine */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#541111' }}>
            Dettaglio Ordine:
          </h3>
          
          {ordineDetails.length === 0 ? (
            <div 
              className="p-4 rounded-lg text-center"
              style={{ background: '#541111', border: '1px solid #8b7355' }}
            >
              <p style={{ color: '#fff9dc' }}>Nessun vino selezionato</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ordineDetails.map((detail) => (
                <div
                  key={detail.wineId}
                  className="p-4 rounded-lg border"
                  style={{ background: '#541111', borderColor: '#8b7355' }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm" style={{ color: '#fff9dc' }}>
                        {detail.wine?.name || 'Vino non trovato'}
                      </h4>
                      <p className="text-xs" style={{ color: '#fef3c7' }}>
                        {detail.wine?.description} {detail.wine?.vintage && `(${detail.wine.vintage})`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium" style={{ color: '#16a34a' }}>
                        €{detail.totalPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs" style={{ color: '#fef3c7' }}>
                    <span>
                      {detail.quantity} {detail.unit} 
                      {detail.unit === 'cartoni' && ` (${detail.totalQuantityBottiglie} bottiglie)`}
                    </span>
                    <span>
                      €{detail.unitPrice.toFixed(2)} per bottiglia
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totale Ordine */}
        <div 
          className="p-6 rounded-lg mb-6"
          style={{ background: '#2e0d0d', border: '1px solid #541111' }}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-semibold" style={{ color: '#fff9dc' }}>
              Totale Ordine:
            </span>
            <span className="text-2xl font-bold" style={{ color: '#16a34a' }}>
              €{totalOrdine.toFixed(2)}
            </span>
          </div>
          
          <div className="text-center mb-3">
            <p className="text-sm" style={{ color: '#fff9dc' }}>
              {totalBottiglie} bottiglie totali
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xs" style={{ color: '#d4a300' }}>
            <AlertTriangle className="h-4 w-4" />
            <span>Prezzi IVA esclusa</span>
          </div>
          <p className="text-center text-xs mt-1" style={{ color: '#9b9b9b' }}>
            Calcolato sui costi di acquisto
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="fixed bottom-0 left-0 right-0 p-4 border-t"
        style={{ background: '#fff9dc', borderColor: '#e2d6aa' }}
      >
        <div className="flex gap-3">
          <button
            onClick={handleModificaOrdine}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors"
            style={{ 
              background: 'transparent', 
              color: '#541111',
              border: '1px solid #e2d6aa'
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Modifica Ordine
          </button>
          <button
            onClick={handleConferma}
            disabled={ordineDetails.length === 0 || isConfirming}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            style={{ 
              background: ordineDetails.length > 0 && !isConfirming ? '#16a34a' : '#9b9b9b',
              color: '#fff9dc'
            }}
          >
            {isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                SALVANDO...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                CONFERMA
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}

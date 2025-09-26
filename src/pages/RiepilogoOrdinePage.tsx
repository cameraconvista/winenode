import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Check, AlertTriangle } from 'lucide-react';
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

  const handleModificaOrdine = () => {
    navigate(-1);
  };

  const handleConferma = () => {
    const fornitore = decodeURIComponent(supplier || '');
    
    console.log('🚀 Confermando ordine:', {
      fornitore,
      ordineItems,
      totalBottiglie,
      totalOrdine
    });

    // Crea nuovo ordine
    const nuovoOrdine = {
      fornitore,
      totale: totalOrdine,
      bottiglie: totalBottiglie,
      data: new Date().toLocaleDateString('it-IT'),
      stato: 'sospeso' as const, // Stato valido per database: 'sospeso','inviato','ricevuto','archiviato'
      tipo: 'inviato' as const,
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
    aggiungiOrdine(nuovoOrdine);

    // Naviga alla pagina Gestisci Ordini tab Inviati
    navigate('/orders/manage?tab=inviati');
  };

  return (
    <div className="homepage-container" style={{ 
      width: '100vw',
      height: '100vh',
      maxWidth: '100%',
      overflow: 'hidden',
      position: 'relative',
      background: 'var(--bg)'
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
        <div className="wine-list-container"
          style={{
            height: '100%',
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'none',
            touchAction: 'pan-y',
            scrollBehavior: 'smooth'
          }}
        >
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
        </div>
      </main>

      {/* NAVBAR FISSA */}
      <nav className="mobile-navbar">
        <button
          onClick={handleModificaOrdine}
          className="nav-btn"
          title="Modifica Ordine"
        >
          <div className="icon" style={{
            background: 'var(--text)',
            WebkitMask: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M10 19l-7-7m0 0l7-7m-7 7h18\'/%3E%3C/svg%3E") center/contain no-repeat',
            mask: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M10 19l-7-7m0 0l7-7m-7 7h18\'/%3E%3C/svg%3E") center/contain no-repeat'
          }}></div>
          <span className="label">Modifica</span>
        </button>
        <button
          onClick={handleConferma}
          disabled={ordineDetails.length === 0}
          className="nav-btn nav-btn-primary"
          title="Conferma Ordine"
          style={{ 
            opacity: ordineDetails.length === 0 ? 0.5 : 1,
            background: ordineDetails.length > 0 ? 'var(--accent)' : 'var(--muted)',
            color: 'white'
          }}
        >
          <div className="icon" style={{
            background: 'white',
            WebkitMask: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M5 13l4 4L19 7\'/%3E%3C/svg%3E") center/contain no-repeat',
            mask: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M5 13l4 4L19 7\'/%3E%3C/svg%3E") center/contain no-repeat'
          }}></div>
          <span className="label">CONFERMA</span>
        </button>
      </nav>
    </div>
  );
}

import React, { useState, lazy, Suspense } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useRiepilogoData } from './hooks/useRiepilogoData';
import { useRiepilogoHandlers } from './hooks/useRiepilogoHandlers';
import { RiepilogoHeader } from './components/RiepilogoHeader';
import { OrdineDetailsList } from './components/OrdineDetailsList';
import { RiepilogoFooter } from './components/RiepilogoFooter';
import { LocationState } from './types';

// Lazy loading per modale WhatsApp non critico al first render
const WhatsAppOrderModal = lazy(() => import('../../components/modals/WhatsAppOrderModal'));

export default function RiepilogoOrdinePage() {
  const { supplier } = useParams<{ supplier: string }>();
  const location = useLocation();
  
  // Stati locali
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Dati derivati
  const { ordineDetails, totalOrdine, whatsAppOrderDetails } = useRiepilogoData();
  
  // Calcolo totalBottiglie dalla location state
  const state = location.state as LocationState;
  const totalBottiglie = state?.totalBottiglie || 0;

  // Handlers
  const handlers = useRiepilogoHandlers({
    ordineDetails,
    totalOrdine,
    totalBottiglie,
    isConfirming,
    setIsConfirming,
    setIsWhatsAppModalOpen
  });

  return (
    <div className="homepage-container" style={{ 
      width: '100vw',
      height: '100vh',
      maxWidth: '100%',
      overflow: 'hidden',
      position: 'relative',
      background: 'var(--bg)'
    }}>
      <RiepilogoHeader />

      {/* HEADER STICKY SOTTO IL LOGO */}
      <div 
        className="sticky border-b"
        style={{ 
          background: 'var(--bg)', 
          borderColor: '#e2d6aa',
          top: 'calc(var(--safe-top) + 60pt)',
          zIndex: 40,
          paddingTop: '16px',
          paddingBottom: '16px',
          paddingLeft: '16px',
          paddingRight: '16px'
        }}
      >
        {/* Riepilogo Header */}
        <div className="text-center mb-4">
          <div className="text-center mb-2">
            <h2 className="text-xl font-bold" style={{ color: '#541111' }}>
              Riepilogo Ordine
            </h2>
          </div>
          <p className="text-base" style={{ color: '#7a4a30' }}>
            Fornitore: {decodeURIComponent(supplier || '')}
          </p>
        </div>

        <h3 className="text-lg font-semibold" style={{ color: '#541111' }}>
          Dettaglio Ordine:
        </h3>
      </div>

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
          <OrdineDetailsList 
            ordineDetails={ordineDetails}
            totalOrdine={totalOrdine}
            totalBottiglie={totalBottiglie}
          />
        </div>
      </main>

      <RiepilogoFooter 
        ordineDetails={ordineDetails}
        totalBottiglie={totalBottiglie}
        isConfirming={isConfirming}
        handlers={handlers}
      />

      {/* Modale WhatsApp */}
      <Suspense fallback={null}>
        <WhatsAppOrderModal
          isOpen={isWhatsAppModalOpen}
          onClose={handlers.handleWhatsAppModalClose}
          orderDetails={whatsAppOrderDetails}
          supplierName={supplier}
        />
      </Suspense>
    </div>
  );
}

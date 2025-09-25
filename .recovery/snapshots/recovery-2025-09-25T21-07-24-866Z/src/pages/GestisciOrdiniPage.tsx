import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Package, Eye, Check, Trash2 } from 'lucide-react';
import { useOrdini, Ordine } from '../contexts/OrdiniContext';
import OrdineRicevutoCard from '../components/orders/OrdineRicevutoCard';
import ConfermaEliminazioneModal from '../components/modals/ConfermaEliminazioneModal';
import { ORDINI_LABELS } from '../constants/ordiniLabels';
import { isFeatureEnabled } from '../config/featureFlags';
import '../styles/gestisci-ordini-mobile.css';

type TabType = 'inviati' | 'ricevuti';

export default function GestisciOrdiniPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('inviati');
  
  const {
    ordiniInviati,
    ordiniRicevuti,
    ordiniStorico,
    loading,
    aggiornaStatoOrdine,
    spostaOrdineInviatiARicevuti,
    aggiornaQuantitaOrdine,
    confermaRicezioneOrdine,
    eliminaOrdineInviato,
    eliminaOrdineRicevuto,
    eliminaOrdineStorico
  } = useOrdini();

  // Stati per il modale di conferma eliminazione
  const [showConfermaEliminazione, setShowConfermaEliminazione] = useState(false);
  const [ordineToDelete, setOrdineToDelete] = useState<{
    id: string;
    ordine: Ordine;
    tipo: 'inviato' | 'ricevuto';
  } | null>(null);

  // Gestisci tab da URL query
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabType;
    if (tabFromUrl && ['inviati', 'ricevuti'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleClose = () => {
    navigate('/');
  };

  const handleVisualizza = (ordineId: string) => {
    console.log('👁️ Visualizza ordine:', ordineId);
    // TODO: Implementare visualizzazione dettagli ordine
  };

  const handleConfermaOrdine = async (ordineId: string) => {
    console.log('✅ Conferma ordine con aggiornamento giacenze:', ordineId);
    
    if (isFeatureEnabled('ORDINI_CONFIRM_IN_CREATI')) {
      // Nuova logica: conferma diretta con aggiornamento giacenze
      await confermaRicezioneOrdine(ordineId);
    } else {
      // Logica precedente: sposta solo in ricevuti
      spostaOrdineInviatiARicevuti(ordineId);
    }
  };

  const handleConfermaRicezione = async (ordineId: string) => {
    console.log('📦 Conferma ricezione ordine:', ordineId);
    await confermaRicezioneOrdine(ordineId);
  };

  const handleEliminaOrdineInviato = (ordineId: string, ordine: Ordine) => {
    setOrdineToDelete({ id: ordineId, ordine, tipo: 'inviato' });
    setShowConfermaEliminazione(true);
  };

  const handleEliminaOrdineRicevuto = (ordineId: string, ordine: Ordine) => {
    setOrdineToDelete({ id: ordineId, ordine, tipo: 'ricevuto' });
    setShowConfermaEliminazione(true);
  };

  // handleEliminaOrdineStorico rimosso - tab Storico eliminato

  const confermaEliminazione = () => {
    if (!ordineToDelete) return;

    switch (ordineToDelete.tipo) {
      case 'inviato':
        eliminaOrdineInviato(ordineToDelete.id);
        break;
      case 'ricevuto':
        eliminaOrdineRicevuto(ordineToDelete.id);
        break;
    }

    setOrdineToDelete(null);
  };

  const getMessaggioEliminazione = () => {
    if (!ordineToDelete) return '';
    
    switch (ordineToDelete.tipo) {
      case 'inviato':
        return ORDINI_LABELS.eliminazione.creato;
      case 'ricevuto':
        return ORDINI_LABELS.eliminazione.archiviato;
      default:
        return '';
    }
  };

  const getTabCount = (tab: TabType) => {
    switch (tab) {
      case 'inviati':
        return ordiniInviati.length;
      case 'ricevuti':
        return ordiniRicevuti.length;
      default:
        return 0;
    }
  };

  const getCurrentTabData = () => {
    switch (activeTab) {
      case 'inviati':
        return ordiniInviati;
      case 'ricevuti':
        return ordiniRicevuti;
      default:
        return [];
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'inviati':
        return {
          title: ORDINI_LABELS.emptyState.creati.title,
          subtitle: ORDINI_LABELS.emptyState.creati.subtitle
        };
      case 'ricevuti':
        return {
          title: ORDINI_LABELS.emptyState.archiviati.title,
          subtitle: ORDINI_LABELS.emptyState.archiviati.subtitle
        };
      default:
        return {
          title: ORDINI_LABELS.emptyState.default.title,
          subtitle: ORDINI_LABELS.emptyState.default.subtitle
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fff9dc' }}>
        <div className="text-center">
          <div className="text-lg font-medium" style={{ color: '#541111' }}>
            Caricamento ordini...
          </div>
        </div>
      </div>
    );
  }

  const currentData = getCurrentTabData();
  const emptyMessage = getEmptyMessage();

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
        <div className="gestisci-ordini-page-content" style={{
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          
          {/* Titolo e Pulsante Chiudi */}
          <div className="gestisci-ordini-header-section" style={{
            flexShrink: 0,
            padding: '16px',
            borderBottom: '1px solid #e2d6aa',
            background: '#fff9dc'
          }}>
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold" style={{ color: '#541111' }}>
                {ORDINI_LABELS.header.titoloPagina}
              </h1>
              <button
                onClick={handleClose}
                className="gestisci-ordini-button"
                style={{ 
                  color: '#541111',
                  background: 'transparent',
                  minWidth: '44px',
                  minHeight: '44px',
                  padding: '10px'
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tabs Fissi */}
          <div className="gestisci-ordini-tabs" style={{
            flexShrink: 0,
            padding: '16px 16px 0 16px',
            background: '#fff9dc'
          }}>
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('inviati')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              background: activeTab === 'inviati' ? '#d4a300' : 'transparent',
              color: activeTab === 'inviati' ? '#fff9dc' : '#541111',
              border: activeTab === 'inviati' ? 'none' : '1px solid #e2d6aa'
            }}
          >
            {ORDINI_LABELS.tabs.creati} ({getTabCount('inviati')})
          </button>
          
          <button
            onClick={() => setActiveTab('ricevuti')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              background: activeTab === 'ricevuti' ? '#d4a300' : 'transparent',
              color: activeTab === 'ricevuti' ? '#fff9dc' : '#541111',
              border: activeTab === 'ricevuti' ? 'none' : '1px solid #e2d6aa'
            }}
          >
            {ORDINI_LABELS.tabs.archiviati} ({getTabCount('ricevuti')})
          </button>
          
          {!isFeatureEnabled('REMOVE_STORICO_TAB') && (
            <button
              onClick={() => setActiveTab('storico' as TabType)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                background: activeTab === 'storico' ? '#d4a300' : 'transparent',
                color: activeTab === 'storico' ? '#fff9dc' : '#541111',
                border: activeTab === 'storico' ? 'none' : '1px solid #e2d6aa'
              }}
            >
              📋 Storico ({getTabCount('storico' as TabType)})
            </button>
          )}
        </div>
      </div>

          {/* Content Scrollabile */}
          <div className="gestisci-ordini-content-scroll" style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            padding: '0 16px',
            paddingBottom: 'max(env(safe-area-inset-bottom), 0px) + 16px'
          }}>
            {currentData.length === 0 ? (
              <div className="gestisci-ordini-empty" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                padding: '32px 16px'
              }}>
                <Package 
                  className="h-16 w-16 mb-4 opacity-30"
                  style={{ color: '#7a4a30' }}
                />
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#541111' }}>
                  {emptyMessage.title}
                </h3>
                <p className="text-sm" style={{ color: '#7a4a30' }}>
                  {emptyMessage.subtitle}
                </p>
              </div>
            ) : (
              <div className="gestisci-ordini-list" style={{
                padding: '8px 0',
                gap: '12px',
                display: 'flex',
                flexDirection: 'column'
              }}>
            {currentData.map((ordine) => {
              // Usa componente specializzato per ordini ricevuti
              if (activeTab === 'ricevuti') {
                return (
                  <OrdineRicevutoCard
                    key={ordine.id}
                    ordine={ordine}
                    onVisualizza={handleVisualizza}
                    onConfermaRicezione={handleConfermaRicezione}
                    onElimina={handleEliminaOrdineRicevuto}
                    onAggiornaQuantita={aggiornaQuantitaOrdine}
                  />
                );
              }

              // Layout standard per inviati e storico
              return (
                <div
                  key={ordine.id}
                  className="gestisci-ordini-card"
                >
                  {/* Header con fornitore e badge */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏢</span>
                      <h4 className="font-bold text-base" style={{ color: '#541111' }}>
                        {ordine.fornitore}
                      </h4>
                    </div>
                    {activeTab === 'inviati' && (
                      <span 
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ background: '#d4a300', color: '#fff9dc' }}
                      >
                        INVIATO
                      </span>
                    )}
                    {activeTab === 'storico' && (
                      <span 
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ background: '#16a34a', color: '#fff9dc' }}
                      >
                        COMPLETATO
                      </span>
                    )}
                  </div>

                  {/* Dettagli ordine */}
                  <div className="grid grid-cols-3 gap-4 mb-3 text-xs" style={{ color: '#7a4a30' }}>
                    <div>
                      <span className="block font-medium">📅 Ordinato:</span>
                      <span>{ordine.data}</span>
                    </div>
                    <div>
                      <span className="block font-medium">📦 Articoli:</span>
                      <span>{ordine.bottiglie}</span>
                    </div>
                    <div>
                      <span className="block font-medium">💰 Totale:</span>
                      <span className="font-bold" style={{ color: '#16a34a' }}>
                        €{ordine.totale.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Pulsanti azione per tab Inviati */}
                  {activeTab === 'inviati' && (
                    <div className="flex gap-2 pt-2 border-t" style={{ borderColor: '#e2d6aa' }}>
                      <button
                        onClick={() => handleVisualizza(ordine.id)}
                        className="gestisci-ordini-button flex items-center gap-1"
                        style={{ background: '#541111', color: '#fff9dc' }}
                      >
                        <Eye className="h-3 w-3" />
                        {ORDINI_LABELS.azioni.visualizza}
                      </button>
                      <button
                        onClick={() => handleConfermaOrdine(ordine.id)}
                        className="gestisci-ordini-button flex items-center gap-1"
                        style={{ background: '#16a34a', color: '#fff9dc' }}
                      >
                        <Check className="h-3 w-3" />
                        {ORDINI_LABELS.azioni.conferma}
                      </button>
                      <button
                        onClick={() => handleEliminaOrdineInviato(ordine.id, ordine)}
                        className="gestisci-ordini-button flex items-center gap-1"
                        style={{ background: '#dc2626', color: '#fff9dc' }}
                      >
                        <Trash2 className="h-3 w-3" />
                        {ORDINI_LABELS.azioni.elimina}
                      </button>
                    </div>
                  )}

                  {/* Layout per storico rimosso - tab eliminato */}
                </div>
              );
            })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modale Conferma Eliminazione */}
      <ConfermaEliminazioneModal
        isOpen={showConfermaEliminazione}
        onOpenChange={setShowConfermaEliminazione}
        onConfirm={confermaEliminazione}
        titolo={ORDINI_LABELS.header.modaleTitolo}
        messaggio={getMessaggioEliminazione()}
        dettagliOrdine={ordineToDelete ? {
          fornitore: ordineToDelete.ordine.fornitore,
          totale: ordineToDelete.ordine.totale,
          data: ordineToDelete.ordine.data
        } : undefined}
      />
    </div>
  );
}

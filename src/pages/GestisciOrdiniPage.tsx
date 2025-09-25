import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Package, Eye, Check, Trash2 } from 'lucide-react';
import { useOrdini, Ordine } from '../contexts/OrdiniContext';
import OrdineRicevutoCard from '../components/orders/OrdineRicevutoCard';
import ConfermaEliminazioneModal from '../components/modals/ConfermaEliminazioneModal';
import { ORDINI_LABELS } from '../constants/ordiniLabels';
import { isFeatureEnabled } from '../config/featureFlags';
import QuantityPicker from '../components/QuantityPicker';
import '../styles/gestisci-ordini-mobile.css';

type TabType = 'inviati' | 'ricevuti';

export default function GestisciOrdiniPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('inviati');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [managingOrders, setManagingOrders] = useState<Set<string>>(new Set());
  const [modifiedQuantities, setModifiedQuantities] = useState<Record<string, Record<number, number>>>({});
  
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

  const handleToggleExpanded = (ordineId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ordineId)) {
        newSet.delete(ordineId);
      } else {
        newSet.add(ordineId);
      }
      return newSet;
    });
  };

  const handleToggleManaging = (ordineId: string) => {
    if (!isFeatureEnabled('CREATI_INLINE_GESTISCI')) return;
    
    setManagingOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ordineId)) {
        newSet.delete(ordineId);
        // Reset quantità modificate quando si chiude la gestione
        setModifiedQuantities(prevMod => {
          const newMod = { ...prevMod };
          delete newMod[ordineId];
          return newMod;
        });
      } else {
        newSet.add(ordineId);
        // Inizializza quantità con valori originali
        const ordine = ordiniInviati.find(o => o.id === ordineId);
        if (ordine && ordine.dettagli) {
          setModifiedQuantities(prevMod => ({
            ...prevMod,
            [ordineId]: ordine.dettagli!.reduce((acc, dettaglio, index) => {
              acc[index] = dettaglio.quantity;
              return acc;
            }, {} as Record<number, number>)
          }));
        }
      }
      return newSet;
    });
  };

  const handleQuantityChange = (ordineId: string, dettaglioIndex: number, newQuantity: number) => {
    setModifiedQuantities(prev => ({
      ...prev,
      [ordineId]: {
        ...prev[ordineId],
        [dettaglioIndex]: newQuantity
      }
    }));
  };

  const handleConfermaModifiche = async (ordineId: string) => {
    const ordine = ordiniInviati.find(o => o.id === ordineId);
    if (!ordine || !ordine.dettagli) return;

    try {
      // Prepara i dettagli aggiornati con le quantità modificate
      const dettagliAggiornati = ordine.dettagli.map((dettaglio, index) => {
        const newQuantity = modifiedQuantities[ordineId]?.[index] ?? dettaglio.quantity;
        return {
          ...dettaglio,
          quantity: newQuantity,
          totalPrice: newQuantity * dettaglio.unitPrice
        };
      });

      // Aggiorna l'ordine nel context
      aggiornaQuantitaOrdine(ordineId, dettagliAggiornati);

      // Conferma ricezione con logica atomica (riusa Fase 3)
      await confermaRicezioneOrdine(ordineId);

      // Chiudi la modalità gestione
      handleToggleManaging(ordineId);

      console.log('✅ Quantità confermate e ordine archiviato con successo');
    } catch (error) {
      console.error('❌ Errore durante la conferma delle modifiche:', error);
    }
  };

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
        // Tab "Ordini Archiviati" conta ordini completati (storico)
        return ordiniStorico.length;
      default:
        return 0;
    }
  };

  const getCurrentTabData = () => {
    switch (activeTab) {
      case 'inviati':
        return ordiniInviati;
      case 'ricevuti':
        // Tab "Ordini Archiviati" mostra ordini completati (storico)
        return ordiniStorico;
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
        <div className="flex gap-2 mb-6 flex-nowrap">
          <button
            onClick={() => setActiveTab('inviati')}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-medium transition-colors flex-1 whitespace-nowrap"
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
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-medium transition-colors flex-1 whitespace-nowrap"
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
                  className="gestisci-ordini-card cursor-pointer"
                  onClick={() => handleToggleExpanded(ordine.id)}
                >
                  {/* Header con fornitore e badge */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base" style={{ color: '#541111' }}>
                        {ordine.fornitore}
                      </h4>
                    </div>
                    {activeTab === 'inviati' && (
                      <span 
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ background: '#16a34a', color: '#fff9dc' }}
                      >
                        {ORDINI_LABELS.badges.creato}
                      </span>
                    )}
                    {activeTab === 'storico' && (
                      <span 
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ background: '#16a34a', color: '#fff9dc' }}
                      >
                        {ORDINI_LABELS.badges.completato}
                      </span>
                    )}
                  </div>

                  {/* Dettagli ordine */}
                  <div className="grid grid-cols-2 gap-4 mb-3 text-xs" style={{ color: '#7a4a30' }}>
                    <div>
                      <span className="block font-medium">{ORDINI_LABELS.dettagli.ordinato}</span>
                      <span className="font-bold">{ordine.data}</span>
                    </div>
                    <div>
                      <span className="block font-medium">{ORDINI_LABELS.dettagli.totale}</span>
                      <span className="font-bold" style={{ color: '#7a4a30' }}>
                        €{ordine.totale.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Box dettagli espandibile per ordini creati */}
                  {activeTab === 'inviati' && expandedOrders.has(ordine.id) && ordine.dettagli && (
                    <div 
                      className="mb-4 p-3 rounded border-t"
                      style={{ borderColor: '#e2d6aa', background: 'white' }}
                    >
                      <div className="space-y-2">
                        {ordine.dettagli.map((dettaglio, index) => (
                          <div key={index} className="flex items-center justify-between text-xs">
                            <div className="flex-1">
                              <span className="font-medium" style={{ color: '#541111' }}>
                                {dettaglio.wineName}
                              </span>
                              <div style={{ color: '#7a4a30' }}>
                                {dettaglio.quantity} {dettaglio.unit} - €{dettaglio.totalPrice.toFixed(2)} (€{dettaglio.unitPrice.toFixed(2)}/cad)
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sezione gestione inline per ordini creati */}
                  {activeTab === 'inviati' && managingOrders.has(ordine.id) && ordine.dettagli && (
                    <div 
                      className="mb-4 p-4 rounded border-t"
                      style={{ borderColor: '#e2d6aa', background: '#f9f9f9' }}
                    >
                      <h5 className="text-sm font-medium mb-3" style={{ color: '#541111' }}>
                        {ORDINI_LABELS.gestioneInline.titolo}
                      </h5>

                      {/* Tabella gestione quantità */}
                      <div className="space-y-3">
                        {ordine.dettagli.map((dettaglio, index) => {
                          const currentQuantity = modifiedQuantities[ordine.id]?.[index] ?? dettaglio.quantity;
                          const maxQuantity = dettaglio.quantity; // Limite massimo = quantità ordinata
                          
                          return (
                            <div key={index} className="bg-white p-3 rounded border" style={{ borderColor: '#e2d6aa' }}>
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-center">
                                {/* Prodotto */}
                                <div>
                                  <div className="text-xs font-medium mb-1" style={{ color: '#7a4a30' }}>
                                    {ORDINI_LABELS.gestioneInline.colonne.prodotto}
                                  </div>
                                  <div className="text-sm font-medium" style={{ color: '#541111' }}>
                                    {dettaglio.wineName}
                                  </div>
                                </div>

                                {/* Unità */}
                                <div>
                                  <div className="text-xs font-medium mb-1" style={{ color: '#7a4a30' }}>
                                    {ORDINI_LABELS.gestioneInline.colonne.unita}
                                  </div>
                                  <div className="text-sm" style={{ color: '#7a4a30' }}>
                                    {dettaglio.unit}
                                  </div>
                                </div>

                                {/* Modifica quantità */}
                                <div>
                                  <div className="text-xs font-medium mb-2" style={{ color: '#7a4a30' }}>
                                    {ORDINI_LABELS.gestioneInline.colonne.modificaQuantita}
                                  </div>
                                  <QuantityPicker
                                    value={currentQuantity}
                                    onChange={(newQuantity) => handleQuantityChange(ordine.id, index, newQuantity)}
                                    min={0}
                                    max={maxQuantity}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Riepilogo */}
                      {(() => {
                        const totalConfermato = ordine.dettagli.reduce((acc, dettaglio, index) => {
                          const quantity = modifiedQuantities[ordine.id]?.[index] ?? dettaglio.quantity;
                          return acc + quantity;
                        }, 0);
                        
                        const valoreConfermato = ordine.dettagli.reduce((acc, dettaglio, index) => {
                          const quantity = modifiedQuantities[ordine.id]?.[index] ?? dettaglio.quantity;
                          return acc + (quantity * dettaglio.unitPrice);
                        }, 0);

                        return (
                          <div className="mt-4 p-3 bg-white rounded border" style={{ borderColor: '#e2d6aa' }}>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium" style={{ color: '#7a4a30' }}>
                                  {ORDINI_LABELS.gestioneInline.riepilogo.totaleConfermato}
                                </span>
                                <span className="ml-2 font-bold" style={{ color: '#541111' }}>
                                  {totalConfermato}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium" style={{ color: '#7a4a30' }}>
                                  {ORDINI_LABELS.gestioneInline.riepilogo.valoreConfermato}
                                </span>
                                <span className="ml-2 font-bold" style={{ color: '#541111' }}>
                                  €{valoreConfermato.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Pulsanti azione gestione */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfermaModifiche(ordine.id);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded text-xs font-medium transition-colors"
                          style={{ 
                            background: '#16a34a', 
                            color: '#fff9dc'
                          }}
                        >
                          <Check className="h-3 w-3" />
                          {ORDINI_LABELS.gestioneInline.azioni.confermaModifiche}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleManaging(ordine.id);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded text-xs font-medium transition-colors"
                          style={{ 
                            background: '#6b7280', 
                            color: '#fff9dc'
                          }}
                        >
                          {ORDINI_LABELS.gestioneInline.azioni.annulla}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Pulsanti azione per tab Inviati */}
                  {activeTab === 'inviati' && (
                    <div className="flex gap-2 pt-2 border-t" style={{ borderColor: '#e2d6aa' }}>
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (isFeatureEnabled('CREATI_INLINE_GESTISCI')) {
                            handleToggleManaging(ordine.id);
                          } else {
                            handleConfermaOrdine(ordine.id);
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded text-xs font-medium transition-colors"
                        style={{ 
                          background: '#d4a300', 
                          color: '#fff9dc'
                        }}
                      >
                        <Check className="h-3 w-3" />
                        {ORDINI_LABELS.azioni.conferma}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEliminaOrdineInviato(ordine.id, ordine); }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded text-xs font-medium transition-colors"
                        style={{ 
                          background: '#dc2626', 
                          color: '#fff9dc'
                        }}
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

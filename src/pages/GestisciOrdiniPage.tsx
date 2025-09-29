import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Package, Eye, Check, Trash2 } from 'lucide-react';
import { useOrdini, Ordine } from '../contexts/OrdiniContext';
import OrdineRicevutoCard from '../components/orders/OrdineRicevutoCard';
import ConfermaEliminazioneModal from '../components/modals/ConfermaEliminazioneModal';
import WhatsAppOrderModal from '../components/modals/WhatsAppOrderModal';
import { ORDINI_LABELS } from '../constants/ordiniLabels';
import { formatDateIt } from '../utils/formatDate';
import { isFeatureEnabled } from '../config/featureFlags';
import QuantityPicker from '../components/QuantityPicker';
import GestisciOrdiniInventoryModal from '../components/GestisciOrdiniInventoryModal';
import SmartGestisciModal from '../components/modals/SmartGestisciModal';
import ConfirmArchiveModal from '../components/modals/ConfirmArchiveModal';
import { OrderDetail } from '../utils/buildWhatsAppMessage';
import '../styles/gestisci-ordini-mobile.css';

type TabType = 'inviati' | 'archiviati';

export default function GestisciOrdiniPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('inviati');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [managingOrders, setManagingOrders] = useState<Set<string>>(new Set());
  const [modifiedQuantities, setModifiedQuantities] = useState<Record<string, Record<number, number>>>({});
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [editingQuantity, setEditingQuantity] = useState<{ordineId: string, dettaglioIndex: number, currentValue: number, originalValue: number} | null>(null);
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [smartModalOrdine, setSmartModalOrdine] = useState<Ordine | null>(null);
  const [draftQuantities, setDraftQuantities] = useState<Record<string, Record<number, number>>>({});
  const [showConfirmArchive, setShowConfirmArchive] = useState(false);
  const [pendingArchiveOrder, setPendingArchiveOrder] = useState<{ordineId: string, quantities: Record<number, number>} | null>(null);
  
  // Stati per il modale WhatsApp
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppOrderDetails, setWhatsAppOrderDetails] = useState<OrderDetail[]>([]);
  const [whatsAppSupplierName, setWhatsAppSupplierName] = useState<string>('');
  
  const {
    ordiniInviati,
    ordiniStorico,
    loading,
    aggiornaStatoOrdine,
    aggiornaQuantitaOrdine,
    confermaRicezioneOrdine,
    eliminaOrdineInviato,
    eliminaOrdineStorico,
    inizializzaQuantitaConfermate,
    aggiornaQuantitaConfermata,
    getQuantitaConfermate
  } = useOrdini();

  // Stati per il modale di conferma eliminazione
  const [showConfermaEliminazione, setShowConfermaEliminazione] = useState(false);
  const [ordineToDelete, setOrdineToDelete] = useState<{
    id: string;
    ordine: Ordine;
    tipo: 'inviato' | 'archiviato';
  } | null>(null);

  // PERF: Selettori memoizzati per derive data
  const currentTabData = useMemo(() => {
    switch (activeTab) {
      case 'inviati':
        return ordiniInviati;
      case 'archiviati':
        return ordiniStorico;
      default:
        return [];
    }
  }, [activeTab, ordiniInviati, ordiniStorico]);

  const emptyMessage = useMemo(() => {
    switch (activeTab) {
      case 'inviati':
        return {
          title: ORDINI_LABELS.emptyState.creati.title,
          subtitle: ORDINI_LABELS.emptyState.creati.subtitle
        };
      case 'archiviati':
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
  }, [activeTab]);

  // Gestisci tab da URL query
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabType;
    if (tabFromUrl && ['inviati', 'archiviati'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // PERF: Handlers stabili con useCallback
  const handleClose = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleVisualizza = useCallback((ordineId: string) => {
    // TODO: Implementare visualizzazione dettagli ordine
  }, []);

  const handleConfermaOrdine = useCallback(async (ordineId: string) => {
    await confermaRicezioneOrdine(ordineId);
  }, [confermaRicezioneOrdine]);

  const handleEliminaOrdineCreato = useCallback((ordineId: string, ordine: Ordine) => {
    setOrdineToDelete({ id: ordineId, ordine, tipo: 'inviato' });
    setShowConfermaEliminazione(true);
  }, []);

  const handleEliminaOrdineArchiviato = useCallback((ordineId: string, ordine: Ordine) => {
    setOrdineToDelete({ id: ordineId, ordine, tipo: 'archiviato' });
    setShowConfermaEliminazione(true);
  }, []);

  const handleToggleExpanded = useCallback((ordineId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ordineId)) {
        newSet.delete(ordineId);
      } else {
        newSet.add(ordineId);
      }
      return newSet;
    });
  }, []);

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

  const handleQuantityChange = useCallback((ordineId: string, dettaglioIndex: number, newQuantity: number) => {
    setModifiedQuantities(prev => ({
      ...prev,
      [ordineId]: {
        ...prev[ordineId],
        [dettaglioIndex]: newQuantity
      }
    }));
  }, []);

  const handleOpenQuantityModal = useCallback((ordineId: string, dettaglioIndex: number) => {
    const ordine = ordiniInviati.find(o => o.id === ordineId);
    if (!ordine?.dettagli?.[dettaglioIndex]) return;

    const originalValue = ordine.dettagli[dettaglioIndex].quantity;
    const currentValue = isFeatureEnabled('QTY_MODAL_PERSIST_COMMIT') 
      ? (draftQuantities[ordineId]?.[dettaglioIndex] ?? modifiedQuantities[ordineId]?.[dettaglioIndex] ?? originalValue)
      : (modifiedQuantities[ordineId]?.[dettaglioIndex] ?? originalValue);

    setEditingQuantity({ ordineId, dettaglioIndex, currentValue, originalValue });
    setShowQuantityModal(true);
  }, [ordiniInviati, draftQuantities, modifiedQuantities]);

  const handleCloseQuantityModal = useCallback(() => {
    setShowQuantityModal(false);
    setEditingQuantity(null);
  }, []);

  const handleConfirmQuantityModal = (newQuantity: number) => {
    if (!editingQuantity) return;

    if (isFeatureEnabled('QTY_MODAL_PERSIST_COMMIT')) {
      setDraftQuantities(prev => ({
        ...prev,
        [editingQuantity.ordineId]: {
          ...prev[editingQuantity.ordineId],
          [editingQuantity.dettaglioIndex]: newQuantity
        }
      }));

      const ordine = ordiniInviati.find(o => o.id === editingQuantity.ordineId);
      if (ordine && ordine.dettagli) {
        const dettagliAggiornati = ordine.dettagli.map((dettaglio, index) => {
          if (index === editingQuantity.dettaglioIndex) {
            return {
              ...dettaglio,
              quantity: newQuantity,
              totalPrice: newQuantity * dettaglio.unitPrice
            };
          }
          return dettaglio;
        });
        
        // Aggiorna le quantità confermate invece dell'ordine direttamente
        const wineId = ordine.dettagli[editingQuantity.dettaglioIndex].wineId;
        aggiornaQuantitaConfermata(editingQuantity.ordineId, wineId, newQuantity);
      }

      // Se abilitato il flusso di archiviazione, mostra dialog
      if (isFeatureEnabled('QTY_MODAL_CONFIRM_ARCHIVE_FLOW')) {
        const ordine = ordiniInviati.find(o => o.id === editingQuantity.ordineId);
        if (ordine && ordine.dettagli) {
          // Prepara le quantità per l'archiviazione
          const quantities = ordine.dettagli.reduce((acc, _, index) => {
            acc[index] = index === editingQuantity.dettaglioIndex 
              ? newQuantity 
              : (draftQuantities[editingQuantity.ordineId]?.[index] ?? ordine.dettagli![index].quantity);
            return acc;
          }, {} as Record<number, number>);

          setPendingArchiveOrder({
            ordineId: editingQuantity.ordineId,
            quantities
          });
          setShowConfirmArchive(true);
        }
      }
    } else {
      // Comportamento legacy
      handleQuantityChange(editingQuantity.ordineId, editingQuantity.dettaglioIndex, newQuantity);
    }

    handleCloseQuantityModal();
  };

  const handleOpenSmartModal = useCallback((ordine: Ordine) => {
    if (!isFeatureEnabled('CREATI_SMART_FULL_MODAL')) return;
    
    // Inizializza le quantità confermate per questo ordine
    if (ordine.dettagli) {
      inizializzaQuantitaConfermate(ordine.id, ordine.dettagli);
    }
    
    setSmartModalOrdine(ordine);
    setShowSmartModal(true);
  }, [inizializzaQuantitaConfermate]);

  const handleCloseSmartModal = useCallback(() => {
    setShowSmartModal(false);
    setSmartModalOrdine(null);
  }, []);

  const handleSmartModalConfirm = useCallback((modifiedQuantities: Record<number, number>) => {
    if (!smartModalOrdine?.dettagli) return;

    // Aggiorna le quantità confermate per ogni prodotto modificato
    smartModalOrdine.dettagli.forEach((dettaglio, index) => {
      if (modifiedQuantities[index] !== undefined) {
        aggiornaQuantitaConfermata(smartModalOrdine.id, dettaglio.wineId, modifiedQuantities[index]);
      }
    });
  }, [smartModalOrdine, aggiornaQuantitaConfermata]);

  const handleSmartModalArchive = useCallback(async (modifiedQuantities: Record<number, number>) => {
    if (!smartModalOrdine || !smartModalOrdine.dettagli) return;

    try {
      // Aggiorna le quantità confermate per ogni prodotto modificato
      smartModalOrdine.dettagli.forEach((dettaglio, index) => {
        if (modifiedQuantities[index] !== undefined) {
          aggiornaQuantitaConfermata(smartModalOrdine.id, dettaglio.wineId, modifiedQuantities[index]);
        }
      });

      // Conferma ricezione con quantità confermate (logica atomica)
      await confermaRicezioneOrdine(smartModalOrdine.id);

      // Switch al tab Archiviati
      setActiveTab('archiviati');

    } catch (error) {
      console.error('Errore durante archiviazione Smart Modal:', error);
    }
  }, [smartModalOrdine, aggiornaQuantitaConfermata, confermaRicezioneOrdine, setActiveTab]);

  const handleConfirmArchive = async () => {
    if (!pendingArchiveOrder) return;

    const ordine = ordiniInviati.find(o => o.id === pendingArchiveOrder.ordineId);
    if (!ordine || !ordine.dettagli) return;

    try {
      // Prepara i dettagli aggiornati con le quantità committate
      const dettagliAggiornati = ordine.dettagli.map((dettaglio, index) => {
        const newQuantity = pendingArchiveOrder.quantities[index] ?? dettaglio.quantity;
        return {
          ...dettaglio,
          quantity: newQuantity,
          totalPrice: newQuantity * dettaglio.unitPrice
        };
      });

      // Prima aggiorna le quantità, poi conferma ricezione (logica atomica Fase 3)
      aggiornaQuantitaOrdine(pendingArchiveOrder.ordineId, dettagliAggiornati);
      await confermaRicezioneOrdine(pendingArchiveOrder.ordineId);

      // Pulisci gli stati
      setDraftQuantities(prev => {
        const newDrafts = { ...prev };
        delete newDrafts[pendingArchiveOrder.ordineId];
        return newDrafts;
      });

      // Chiudi dialog e switch al tab Archiviati
      setShowConfirmArchive(false);
      setPendingArchiveOrder(null);
      setActiveTab('archiviati');

    } catch (error) {
      console.error('Errore durante archiviazione:', error);
    }
  };

  const handleCancelArchive = () => {
    setShowConfirmArchive(false);
    setPendingArchiveOrder(null);
  };

  const handleOpenWhatsAppModal = (ordine: Ordine) => {
    if (!ordine.dettagli) return;
    
    // Converte i dettagli ordine nel formato richiesto dal modale WhatsApp
    const orderDetails: OrderDetail[] = ordine.dettagli.map(dettaglio => ({
      wineName: dettaglio.wineName,
      vintage: undefined, // OrdineDettaglio non ha vintage, sarà undefined
      quantity: dettaglio.quantity,
      unit: dettaglio.unit as 'bottiglie' | 'cartoni'
    }));
    
    setWhatsAppOrderDetails(orderDetails);
    setWhatsAppSupplierName(ordine.fornitore);
    setShowWhatsAppModal(true);
  };

  const handleCloseWhatsAppModal = () => {
    setShowWhatsAppModal(false);
    setWhatsAppOrderDetails([]);
    setWhatsAppSupplierName('');
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

    } catch (error) {
      console.error('Errore durante la conferma delle modifiche:', error);
    }
  };

  const confermaEliminazione = useCallback(() => {
    if (!ordineToDelete) return;

    switch (ordineToDelete.tipo) {
      case 'inviato':
        eliminaOrdineInviato(ordineToDelete.id);
        break;
      case 'archiviato':
        eliminaOrdineStorico(ordineToDelete.id);
        break;
    }

    setOrdineToDelete(null);
  }, [ordineToDelete, eliminaOrdineInviato, eliminaOrdineStorico]);

  const getMessaggioEliminazione = useMemo(() => {
    if (!ordineToDelete) return '';
    
    switch (ordineToDelete.tipo) {
      case 'inviato':
        return ORDINI_LABELS.eliminazione.creato;
      case 'archiviato':
        return ORDINI_LABELS.eliminazione.archiviato;
      default:
        return '';
    }
  }, [ordineToDelete]);

  // PERF: Funzione helper per conteggi tab
  const getTabCount = useCallback((tab: TabType) => {
    switch (tab) {
      case 'inviati':
        return ordiniInviati.length;
      case 'archiviati':
        return ordiniStorico.length;
      default:
        return 0;
    }
  }, [ordiniInviati.length, ordiniStorico.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-app-accent"></div>
      </div>
    );
  }

  // PERF: Usa selettori memoizzati

  return (
    <div className="homepage-container" style={{ 
      width: '100vw',
      height: '100dvh', /* Dynamic viewport height per iOS Safari */
      maxWidth: '100%',
      overflow: 'hidden',
      position: 'relative',
      background: '#fff9dc'
    }}>
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
            onClick={() => setActiveTab('archiviati')}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg font-medium transition-colors flex-1 whitespace-nowrap"
            style={{
              background: activeTab === 'archiviati' ? '#d4a300' : 'transparent',
              color: activeTab === 'archiviati' ? '#fff9dc' : '#541111',
              border: activeTab === 'archiviati' ? 'none' : '1px solid #e2d6aa'
            }}
          >
            {ORDINI_LABELS.tabs.archiviati} ({getTabCount('archiviati')})
          </button>
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
            {currentTabData.length === 0 ? (
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
            {currentTabData.map((ordine) => {
              // Usa componente specializzato per ordini archiviati
              if (activeTab === 'archiviati') {
                return (
                  <OrdineRicevutoCard
                    key={ordine.id}
                    ordine={ordine}
                    onVisualizza={handleVisualizza}
                    onConfermaRicezione={handleConfermaOrdine}
                    onElimina={handleEliminaOrdineArchiviato}
                    onAggiornaQuantita={aggiornaQuantitaOrdine}
                  />
                );
              }

              // Layout standard per ordini creati
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
                      <div className="flex items-center gap-2">
                        {/* Pulsante WhatsApp */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenWhatsAppModal(ordine);
                          }}
                          className="flex items-center justify-center rounded transition-colors hover:bg-black/5"
                          style={{ 
                            width: '28px', 
                            height: '28px',
                            padding: '4px'
                          }}
                          aria-label="Invia ordine via WhatsApp"
                        >
                          <img 
                            src="/whatsapp.png" 
                            alt="WhatsApp" 
                            className="w-5 h-5"
                            loading="lazy"
                            decoding="async"
                            style={{ filter: 'none' }}
                          />
                        </button>
                        
                        {/* Badge CREATO */}
                        <span 
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ background: '#16a34a', color: '#fff9dc' }}
                        >
                          {ORDINI_LABELS.badges.creato}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dettagli ordine */}
                  <div className="grid grid-cols-2 gap-4 mb-3 text-xs" style={{ color: '#7a4a30' }}>
                    <div>
                      <span className="block font-medium">{ORDINI_LABELS.dettagli.ordinato}</span>
                      <span className="font-bold">{formatDateIt(ordine.data)}</span>
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
                        {ordine.dettagli.map((dettaglio, index) => {
                          const isCompactMode = isFeatureEnabled('CREATI_SMART_FULL_MODAL');
                          // Usa draftQuantities se disponibile per persistenza
                          const displayQuantity = isFeatureEnabled('QTY_MODAL_PERSIST_COMMIT')
                            ? (draftQuantities[ordine.id]?.[index] ?? dettaglio.quantity)
                            : dettaglio.quantity;
                          const displayTotalPrice = displayQuantity * dettaglio.unitPrice;
                          
                          return (
                            <div key={index} className={`flex items-center justify-between text-xs ${isCompactMode ? 'py-1' : ''}`}>
                              <div className="flex-1 min-w-0">
                                {/* Riga 1: Nome vino (compatto con ellipsis) */}
                                <div className={`font-medium ${isCompactMode ? 'truncate' : ''}`} style={{ color: '#541111' }}>
                                  {dettaglio.wineName}
                                </div>
                                
                                {/* Riga 2: Meta info compatta */}
                                <div className={`${isCompactMode ? 'text-xs whitespace-nowrap' : ''}`} style={{ color: '#7a4a30' }}>
                                  {isCompactMode ? (
                                    `${dettaglio.unit} • ${displayQuantity} • €${dettaglio.unitPrice.toFixed(2)}/cad • €${displayTotalPrice.toFixed(2)}`
                                  ) : (
                                    `${displayQuantity} ${dettaglio.unit} - €${displayTotalPrice.toFixed(2)} (€${dettaglio.unitPrice.toFixed(2)}/cad)`
                                  )}
                                </div>
                              </div>

                              {/* Quantità cliccabile per aprire modale */}
                              {isFeatureEnabled('CREATI_QTY_MODAL') && (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenQuantityModal(ordine.id, index);
                                  }}
                                  className="ml-3 px-3 py-1 rounded border cursor-pointer transition-all duration-200 hover:bg-gray-50 flex-shrink-0"
                                  style={{ 
                                    borderColor: '#e2d6aa',
                                    background: 'white'
                                  }}
                                >
                                  <span className="text-sm font-bold" style={{ color: '#541111' }}>
                                    {displayQuantity}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
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
                                  {isFeatureEnabled('CREATI_QTY_MODAL') ? (
                                    <div
                                      onClick={() => handleOpenQuantityModal(ordine.id, index)}
                                      className="inline-flex items-center justify-center px-4 py-2 rounded border cursor-pointer transition-all duration-200 hover:bg-gray-50"
                                      style={{ 
                                        borderColor: '#e2d6aa',
                                        background: 'white',
                                        minWidth: '60px'
                                      }}
                                    >
                                      <span className="text-sm font-bold" style={{ color: '#541111' }}>
                                        {currentQuantity}
                                      </span>
                                    </div>
                                  ) : (
                                    <QuantityPicker
                                      value={currentQuantity}
                                      onChange={(newQuantity) => handleQuantityChange(ordine.id, index, newQuantity)}
                                      min={0}
                                      max={maxQuantity}
                                    />
                                  )}
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

                  {/* Pulsanti azione per ordini creati */}
                  {activeTab === 'inviati' && (
                    <div className="flex gap-2 pt-2 border-t" style={{ borderColor: '#e2d6aa' }}>
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (isFeatureEnabled('CREATI_SMART_FULL_MODAL')) {
                            handleOpenSmartModal(ordine);
                          } else if (isFeatureEnabled('CREATI_INLINE_GESTISCI')) {
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
                        onClick={(e) => { e.stopPropagation(); handleEliminaOrdineCreato(ordine.id, ordine); }}
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
        messaggio={getMessaggioEliminazione}
        dettagliOrdine={ordineToDelete ? {
          fornitore: ordineToDelete.ordine.fornitore,
          totale: ordineToDelete.ordine.totale,
          data: ordineToDelete.ordine.data
        } : undefined}
      />

      {/* Modale Modifica Quantità - Gestione Ordini */}
      <GestisciOrdiniInventoryModal
        isOpen={showQuantityModal}
        initialValue={editingQuantity?.currentValue || 0}
        onConfirm={handleConfirmQuantityModal}
        onCancel={handleCloseQuantityModal}
        min={0}
        max={100}
        originalValue={editingQuantity?.originalValue}
      />

      {/* Modale Smart Gestisci */}
      {smartModalOrdine && (
        <SmartGestisciModal
          isOpen={showSmartModal}
          onClose={handleCloseSmartModal}
          onConfirm={handleSmartModalConfirm}
          onArchive={handleSmartModalArchive}
          ordineId={smartModalOrdine.id}
          fornitore={smartModalOrdine.fornitore}
          dettagli={smartModalOrdine.dettagli || []}
        />
      )}

      {/* Dialog Conferma Archiviazione */}
      <ConfirmArchiveModal
        isOpen={showConfirmArchive}
        onConfirm={handleConfirmArchive}
        onCancel={handleCancelArchive}
        fornitore={pendingArchiveOrder ? ordiniInviati.find(o => o.id === pendingArchiveOrder.ordineId)?.fornitore : undefined}
        totalItems={pendingArchiveOrder ? Object.values(pendingArchiveOrder.quantities).reduce((sum, qty) => sum + qty, 0) : undefined}
        totalValue={pendingArchiveOrder ? Object.entries(pendingArchiveOrder.quantities).reduce((sum, [index, qty]) => {
          const ordine = ordiniInviati.find(o => o.id === pendingArchiveOrder.ordineId);
          const dettaglio = ordine?.dettagli?.[parseInt(index)];
          return sum + (qty * (dettaglio?.unitPrice || 0));
        }, 0) : undefined}
      />

      {/* Modale WhatsApp */}
      <WhatsAppOrderModal
        isOpen={showWhatsAppModal}
        onClose={handleCloseWhatsAppModal}
        orderDetails={whatsAppOrderDetails}
        supplierName={whatsAppSupplierName}
      />
    </div>
  );
}

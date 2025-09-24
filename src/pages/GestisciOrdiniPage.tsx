import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Package, Eye, Check, Trash2 } from 'lucide-react';
import { useOrdini } from '../contexts/OrdiniContext';
import OrdineRicevutoCard from '../components/orders/OrdineRicevutoCard';

type TabType = 'inviati' | 'ricevuti' | 'storico';

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
    eliminaOrdineStorico
  } = useOrdini();

  // Gestisci tab da URL query
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabType;
    if (tabFromUrl && ['inviati', 'ricevuti', 'storico'].includes(tabFromUrl)) {
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

  const handleConfermaOrdine = (ordineId: string) => {
    console.log('✅ Conferma ordine (sposta a ricevuti):', ordineId);
    spostaOrdineInviatiARicevuti(ordineId);
  };

  const handleConfermaRicezione = async (ordineId: string) => {
    console.log('📦 Conferma ricezione ordine:', ordineId);
    await confermaRicezioneOrdine(ordineId);
  };

  const handleEliminaOrdine = (ordineId: string) => {
    console.log('🗑️ Elimina ordine:', ordineId);
    // TODO: Implementare eliminazione ordine per inviati/ricevuti
  };

  const handleEliminaOrdineStorico = (ordineId: string) => {
    console.log('🗑️ Elimina ordine dallo storico:', ordineId);
    eliminaOrdineStorico(ordineId);
  };

  const getTabCount = (tab: TabType) => {
    switch (tab) {
      case 'inviati':
        return ordiniInviati.length;
      case 'ricevuti':
        return ordiniRicevuti.length;
      case 'storico':
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
        return ordiniRicevuti;
      case 'storico':
        return ordiniStorico;
      default:
        return [];
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'inviati':
        return {
          title: 'Nessun ordine inviati',
          subtitle: 'Gli ordini inviati appariranno qui'
        };
      case 'ricevuti':
        return {
          title: 'Nessun ordine ricevuti',
          subtitle: 'Gli ordini ricevuti appariranno qui'
        };
      case 'storico':
        return {
          title: 'Nessun ordine nello storico',
          subtitle: 'Lo storico degli ordini apparirà qui'
        };
      default:
        return {
          title: 'Nessun ordine',
          subtitle: 'Gli ordini appariranno qui'
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
    <div className="min-h-screen" style={{ background: '#fff9dc' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 p-4 border-b" style={{ 
        background: '#fff9dc', 
        borderColor: '#e2d6aa' 
      }}>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold" style={{ color: '#541111' }}>
            Gestisci Ordini
          </h1>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: '#541111' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="p-4 pb-0">
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
            📤 Inviati ({getTabCount('inviati')})
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
            📥 Ricevuti ({getTabCount('ricevuti')})
          </button>
          
          <button
            onClick={() => setActiveTab('storico')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              background: activeTab === 'storico' ? '#d4a300' : 'transparent',
              color: activeTab === 'storico' ? '#fff9dc' : '#541111',
              border: activeTab === 'storico' ? 'none' : '1px solid #e2d6aa'
            }}
          >
            📋 Storico ({getTabCount('storico')})
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="p-4 pt-0">
        {currentData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
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
          <div className="space-y-3">
            {currentData.map((ordine) => {
              // Usa componente specializzato per ordini ricevuti
              if (activeTab === 'ricevuti') {
                return (
                  <OrdineRicevutoCard
                    key={ordine.id}
                    ordine={ordine}
                    onVisualizza={handleVisualizza}
                    onConfermaRicezione={handleConfermaRicezione}
                    onElimina={handleEliminaOrdine}
                    onAggiornaQuantita={aggiornaQuantitaOrdine}
                  />
                );
              }

              // Layout standard per inviati e storico
              return (
                <div
                  key={ordine.id}
                  className="p-4 rounded-lg border"
                  style={{ background: '#fff2b8', borderColor: '#e2d6aa' }}
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
                        className="flex items-center gap-1 px-3 py-2 rounded text-xs font-medium transition-colors"
                        style={{ background: '#541111', color: '#fff9dc' }}
                      >
                        <Eye className="h-3 w-3" />
                        Visualizza
                      </button>
                      <button
                        onClick={() => handleConfermaOrdine(ordine.id)}
                        className="flex items-center gap-1 px-3 py-2 rounded text-xs font-medium transition-colors"
                        style={{ background: '#16a34a', color: '#fff9dc' }}
                      >
                        <Check className="h-3 w-3" />
                        Conferma
                      </button>
                      <button
                        onClick={() => handleEliminaOrdine(ordine.id)}
                        className="flex items-center gap-1 px-3 py-2 rounded text-xs font-medium transition-colors"
                        style={{ background: '#dc2626', color: '#fff9dc' }}
                      >
                        <Trash2 className="h-3 w-3" />
                        Elimina
                      </button>
                    </div>
                  )}

                  {/* Layout per storico con pulsanti */}
                  {activeTab === 'storico' && (
                    <div className="flex justify-between items-center text-xs pt-2 border-t" style={{ color: '#7a4a30', borderColor: '#e2d6aa' }}>
                      <span>Completato il {ordine.data}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVisualizza(ordine.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors"
                          style={{ background: '#541111', color: '#fff9dc' }}
                        >
                          <Eye className="h-3 w-3" />
                          Dettagli
                        </button>
                        <button
                          onClick={() => handleEliminaOrdineStorico(ordine.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors"
                          style={{ background: '#dc2626', color: '#fff9dc' }}
                        >
                          <Trash2 className="h-3 w-3" />
                          Elimina
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

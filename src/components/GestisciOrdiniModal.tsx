import React, { useState, useEffect } from 'react';
import { X, Package, Clock, CheckCircle, Archive, Eye, Check, Truck, Trash2 } from 'lucide-react';
import { useOrdini } from '../hooks/useOrdini';
import OrdineDetailModal from './OrdineDetailModal';
import RicezioneOrdineModal from './RicezioneOrdineModal';

interface GestisciOrdiniModalProps {
  open: boolean;
  onClose: () => void;
}

type TabType = 'inviati' | 'ricevuti' | 'storico';

const GestisciOrdiniModal: React.FC<GestisciOrdiniModalProps> = ({ open, onClose }) => {
  const { ordini, isLoading, error, loadOrdini, aggiornaStatoOrdine } = useOrdini();
  const [activeTab, setActiveTab] = useState<TabType>('inviati');
  const [selectedOrdine, setSelectedOrdine] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRicezioneModal, setShowRicezioneModal] = useState(false);
  const [ordineInRicezione, setOrdineInRicezione] = useState<any>(null);

  useEffect(() => {
    if (open) {
      loadOrdini();
    }
  }, [open]);

  if (!open) return null;

  const filteredOrdini = ordini.filter(o => {
    switch (activeTab) {
      case 'inviati': return o.stato === 'inviato';
      case 'ricevuti': return o.stato === 'ricevuto';
      case 'storico': return o.stato === 'archiviato';
      default: return false;
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'sospeso': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'inviato': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'ricevuto': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'archiviato': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case 'inviati': return <Truck className="h-4 w-4" />;
      case 'ricevuti': return <CheckCircle className="h-4 w-4" />;
      case 'storico': return <Archive className="h-4 w-4" />;
    }
  };

  const getTabLabel = (tab: TabType) => {
    switch (tab) {
      case 'inviati': return 'Inviati';
      case 'ricevuti': return 'Ricevuti';
      case 'storico': return 'Storico';
    }
  };

  const getTabCount = (tab: TabType) => {
    return ordini.filter(o => {
      switch (tab) {
        case 'inviati': return o.stato === 'inviato';
        case 'ricevuti': return o.stato === 'ricevuto';
        case 'storico': return o.stato === 'archiviato';
        default: return false;
      }
    }).length;
  };

  const handleMarkAsInviato = async (ordineId: string) => {
    const success = await aggiornaStatoOrdine(ordineId, 'inviato');
    if (success) {
      console.log('✅ Ordine marcato come inviato');
    }
  };

  const handleMarkAsRicevuto = async (ordine: any) => {
    setOrdineInRicezione(ordine);
    setShowRicezioneModal(true);
  };

  const handleConfermaRicezione = async (ordineId: string, quantitaRicevute: Record<string, number>) => {
    const success = await aggiornaStatoOrdine(ordineId, 'ricevuto', {
      quantita_ricevute: quantitaRicevute
    });
    
    if (success) {
      console.log('✅ Ordine ricevuto con aggiornamento giacenze');
      setShowRicezioneModal(false);
      setOrdineInRicezione(null);
    }
  };

  const handleArchiviaOrdine = async (ordineId: string, fornitoreNome: string) => {
    if (window.confirm(`Sei sicuro di voler archiviare l'ordine di ${fornitoreNome}?`)) {
      const success = await aggiornaStatoOrdine(ordineId, 'archiviato');
      if (success) {
        console.log('✅ Ordine archiviato');
      }
    }
  };

  const handleEliminaOrdine = async (ordineId: string, fornitoreNome: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare l'ordine di ${fornitoreNome}? Questa azione non può essere annullata.`)) {
      try {
        console.log('🗑️ Eliminazione ordine:', ordineId);
        
        // Importa supabase client
        const { supabase } = await import('../lib/supabase');
        
        if (!supabase) {
          throw new Error('Supabase client non disponibile');
        }

        // Elimina l'ordine dal database
        const { error } = await supabase
          .from('ordini')
          .delete()
          .eq('id', ordineId);

        if (error) {
          console.error('❌ Errore eliminazione ordine:', error);
          alert('Errore durante l\'eliminazione dell\'ordine. Riprova.');
          return;
        }

        console.log('✅ Ordine eliminato con successo');
        
        // Ricarica la lista degli ordini
        await loadOrdini();
        
      } catch (error) {
        console.error('❌ Errore eliminazione ordine:', error);
        alert('Errore durante l\'eliminazione dell\'ordine. Riprova.');
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-cream">Gestisci Ordini</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-700">
            <div className="flex space-x-1 p-1">
              {(['inviati', 'ricevuti', 'storico'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? 'bg-amber-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  {getTabIcon(tab)}
                  {getTabLabel(tab)}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab ? 'bg-white/20' : 'bg-gray-600'
                  }`}>
                    {getTabCount(tab)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {isLoading && (
              <div className="text-center py-8">
                <div className="text-gray-400">Caricamento ordini...</div>
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
                <p className="text-red-300">Errore: {error}</p>
              </div>
            )}

            {!isLoading && !error && (
              <div className="space-y-4">
                {filteredOrdini.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">
                      Nessun ordine {getTabLabel(activeTab).toLowerCase()}
                    </h3>
                    <p className="text-gray-500">
                      {activeTab === 'inviati' && 'Gli ordini inviati appariranno qui'}
                      {activeTab === 'ricevuti' && 'Gli ordini ricevuti appariranno qui'}
                      {activeTab === 'storico' && 'Gli ordini archiviati appariranno qui'}
                    </p>
                  </div>
                ) : (
                  filteredOrdini.map((ordine) => (
                    <div
                      key={ordine.id}
                      className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 hover:bg-gray-600/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-white text-lg">
                              🏪 {ordine.fornitore_nome || ordine.fornitore}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatoColor(ordine.stato)}`}>
                              {ordine.stato.toUpperCase()}
                            </span>
                          </div>

                          <div className="text-sm text-gray-400 space-y-1">
                            <p>📅 Ordinato: {formatDate(ordine.data)}</p>
                            {ordine.data_invio_whatsapp && (
                              <p>📱 Inviato: {formatDate(ordine.data_invio_whatsapp)}</p>
                            )}
                            {ordine.data_ricevimento && (
                              <p>📦 Ricevuto: {formatDate(ordine.data_ricevimento)}</p>
                            )}
                            <p>🍷 Articoli: {(() => {
                              try {
                                const contenuto = typeof ordine.contenuto === 'string' 
                                  ? JSON.parse(ordine.contenuto) 
                                  : ordine.contenuto;
                                return Array.isArray(contenuto) ? contenuto.length : 0;
                              } catch {
                                return 0;
                              }
                            })()}</p>
                            <p>💰 Totale: <span className="text-green-400 font-semibold">€{ordine.totale.toFixed(2)}</span></p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrdine(ordine);
                              setShowDetailModal(true);
                            }}
                            className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg transition-colors"
                            title="Visualizza dettagli"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {ordine.stato === 'sospeso' && (
                            <button
                              onClick={() => handleMarkAsInviato(ordine.id)}
                              className="p-2 bg-green-600/20 hover:bg-green-600/40 text-green-300 rounded-lg transition-colors"
                              title="Marca come inviato"
                            >
                              <Truck className="h-4 w-4" />
                            </button>
                          )}

                          {ordine.stato === 'inviato' && (
                            <button
                              onClick={() => handleMarkAsRicevuto(ordine)}
                              className="p-2 bg-green-600/20 hover:bg-green-600/40 text-green-300 rounded-lg transition-colors"
                              title="Marca come ricevuto"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}

                          {ordine.stato === 'ricevuto' && (
                            <button
                              onClick={() => handleArchiviaOrdine(ordine.id, ordine.fornitore_nome || ordine.fornitore)}
                              className="p-2 bg-gray-600/20 hover:bg-gray-600/40 text-gray-300 rounded-lg transition-colors"
                              title="Archivia ordine"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                          )}

                          {/* Pulsante elimina ordine - disponibile per tutti gli stati */}
                          <button
                            onClick={() => handleEliminaOrdine(ordine.id, ordine.fornitore_nome || ordine.fornitore)}
                            className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 rounded-lg transition-colors"
                            title="Elimina ordine"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Quick preview dei vini */}
                      {(() => {
                        try {
                          const contenuto = typeof ordine.contenuto === 'string' 
                            ? JSON.parse(ordine.contenuto) 
                            : ordine.contenuto;

                          if (!Array.isArray(contenuto) || contenuto.length === 0) return null;

                          return (
                            <div className="border-t border-gray-600/50 pt-3">
                              <div className="text-xs text-gray-400 mb-2">Vini ordinati:</div>
                              <div className="space-y-1">
                                {contenuto.slice(0, 2).map((vino, index) => (
                                  <div key={index} className="flex justify-between text-sm">
                                    <span className="text-gray-300">
                                      {vino.nome}
                                    </span>
                                    <span className="text-gray-400">
                                      {vino.quantita} bot. × €{(vino.prezzo_unitario || 0).toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                                {contenuto.length > 2 && (
                                  <div className="text-xs text-gray-500">
                                    ... e altri {contenuto.length - 2} vini
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        } catch {
                          return null;
                        }
                      })()}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedOrdine && (
        <OrdineDetailModal
          ordine={selectedOrdine}
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedOrdine(null);
          }}
          onUpdate={() => {
            loadOrdini();
          }}
        />
      )}

      {/* Ricezione Modal */}
      {showRicezioneModal && ordineInRicezione && (
        <RicezioneOrdineModal
          ordine={ordineInRicezione}
          open={showRicezioneModal}
          onClose={() => {
            setShowRicezioneModal(false);
            setOrdineInRicezione(null);
          }}
          onConfirm={handleConfermaRicezione}
        />
      )}
    </>
  );
};

export default GestisciOrdiniModal;
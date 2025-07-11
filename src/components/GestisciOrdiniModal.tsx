
import React, { useState, useEffect } from 'react';
import { X, Package, Clock, CheckCircle, Archive, Eye, Check, Truck } from 'lucide-react';
import { useOrdini } from '../hooks/useOrdini';
import OrdineDetailModal from './OrdineDetailModal';

interface GestisciOrdiniModalProps {
  open: boolean;
  onClose: () => void;
}

type TabType = 'sospesi' | 'inviati' | 'ricevuti' | 'storico';

export default function GestisciOrdiniModal({ open, onClose }: GestisciOrdiniModalProps) {
  const { ordini, isLoading, error, loadOrdini, aggiornaStatoOrdine } = useOrdini();
  const [activeTab, setActiveTab] = useState<TabType>('sospesi');
  const [selectedOrdine, setSelectedOrdine] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (open) {
      loadOrdini();
    }
  }, [open]);

  if (!open) return null;

  const filteredOrdini = ordini.filter(o => {
    switch (activeTab) {
      case 'sospesi': return o.stato === 'sospeso';
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
      case 'sospesi': return <Clock className="h-4 w-4" />;
      case 'inviati': return <Truck className="h-4 w-4" />;
      case 'ricevuti': return <CheckCircle className="h-4 w-4" />;
      case 'storico': return <Archive className="h-4 w-4" />;
    }
  };

  const getTabLabel = (tab: TabType) => {
    switch (tab) {
      case 'sospesi': return 'Sospesi';
      case 'inviati': return 'Inviati';
      case 'ricevuti': return 'Ricevuti';
      case 'storico': return 'Storico';
    }
  };

  const getTabCount = (tab: TabType) => {
    return ordini.filter(o => {
      switch (tab) {
        case 'sospesi': return o.stato === 'sospeso';
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

  const handleMarkAsRicevuto = async (ordineId: string) => {
    const success = await aggiornaStatoOrdine(ordineId, 'ricevuto');
    if (success) {
      console.log('✅ Ordine marcato come ricevuto');
    }
  };

  const handleArchiviaOrdine = async (ordineId: string) => {
    const success = await aggiornaStatoOrdine(ordineId, 'archiviato');
    if (success) {
      console.log('✅ Ordine archiviato');
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
              {(['sospesi', 'inviati', 'ricevuti', 'storico'] as TabType[]).map((tab) => (
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
                      {activeTab === 'sospesi' && 'Crea un nuovo ordine per vederlo qui'}
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
                            <h3 className="text-lg font-semibold text-white">
                              {ordine.fornitore}
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
                            <p>🍷 Articoli: {ordine.dettagli?.length || 0}</p>
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
                              onClick={() => handleMarkAsRicevuto(ordine.id)}
                              className="p-2 bg-green-600/20 hover:bg-green-600/40 text-green-300 rounded-lg transition-colors"
                              title="Marca come ricevuto"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}

                          {ordine.stato === 'ricevuto' && (
                            <button
                              onClick={() => handleArchiviaOrdine(ordine.id)}
                              className="p-2 bg-gray-600/20 hover:bg-gray-600/40 text-gray-300 rounded-lg transition-colors"
                              title="Archivia ordine"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Quick preview dei vini */}
                      {ordine.dettagli && ordine.dettagli.length > 0 && (
                        <div className="border-t border-gray-600/50 pt-3">
                          <div className="text-xs text-gray-400 mb-2">Vini ordinati:</div>
                          <div className="space-y-1">
                            {ordine.dettagli.slice(0, 2).map((dettaglio) => (
                              <div key={dettaglio.id} className="flex justify-between text-sm">
                                <span className="text-gray-300">
                                  {dettaglio.nome_vino} {dettaglio.anno && `(${dettaglio.anno})`}
                                </span>
                                <span className="text-gray-400">
                                  {dettaglio.quantita_ordinata} bot. × €{dettaglio.prezzo_unitario.toFixed(2)}
                                </span>
                              </div>
                            ))}
                            {ordine.dettagli.length > 2 && (
                              <div className="text-xs text-gray-500">
                                ... e altri {ordine.dettagli.length - 2} vini
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
    </>
  );
}

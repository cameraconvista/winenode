import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Package, Clock, Eye, Check, Edit3 } from 'lucide-react';
import { useOrdini } from '../hooks/useOrdini';
import OrdineDetailModal from '../components/OrdineDetailModal';

export default function OrdiniSospesiPage() {
  const navigate = useNavigate();
  const { ordini, isLoading, error, loadOrdini, aggiornaStatoOrdine } = useOrdini();
  const [selectedOrdine, setSelectedOrdine] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filtra solo ordini sospesi e inviati
  const ordiniSospesi = ordini.filter(o => o.stato === 'sospeso' || o.stato === 'inviato');

  useEffect(() => {
    loadOrdini();
  }, []);

  const handleViewOrdine = (ordine: any) => {
    setSelectedOrdine(ordine);
    setShowDetailModal(true);
  };

  const handleMarkAsInviato = async (ordineId: string) => {
    const success = await aggiornaStatoOrdine(ordineId, 'inviato');
    if (success) {
      console.log('✅ Ordine marcato come inviato');
    }
  };

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
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatoIcon = (stato: string) => {
    switch (stato) {
      case 'sospeso': return <Clock className="h-4 w-4" />;
      case 'inviato': return <Package className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div 
      className="min-h-screen text-white"
      style={{
        background: "linear-gradient(to bottom right, #1f0202, #2d0505, #1f0202)",
      }}
    >
      {/* Header */}
      <header className="border-b border-red-900/30 bg-black/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 text-white hover:text-cream hover:bg-white/10 rounded-full transition-all duration-200"
              title="Torna alle impostazioni"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-cream">ORDINI SOSPESI</h1>
              <img
                src="/logo 2 CCV.png"
                alt="WINENODE"
                className="h-12 w-auto object-contain"
              />
            </div>

            <button
              onClick={() => navigate("/")}
              className="p-2 text-white hover:text-cream hover:bg-gray-800 rounded-lg transition-colors"
              title="Vai alla home"
            >
              <Home className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">Ordini Sospesi</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {ordiniSospesi.filter(o => o.stato === 'sospeso').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Ordini Inviati</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {ordiniSospesi.filter(o => o.stato === 'inviato').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Valore Totale</p>
                  <p className="text-2xl font-bold text-green-400">
                    €{ordiniSospesi.reduce((sum, o) => sum + o.totale_euro, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Loading/Error States */}
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

          {/* Ordini List */}
          {!isLoading && !error && (
            <div className="space-y-4">
              {ordiniSospesi.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">
                    Nessun ordine in sospeso
                  </h3>
                  <p className="text-gray-500">
                    Crea un nuovo ordine per vederlo qui
                  </p>
                </div>
              ) : (
                ordiniSospesi.map((ordine) => (
                  <div
                    key={ordine.id}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white text-lg">
                            🏪 {ordine.fornitore_nome || ordine.fornitore}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatoColor(ordine.stato)}`}>
                            {getStatoIcon(ordine.stato)}
                            {ordine.stato.toUpperCase()}
                          </span>
                        </div>

                        <div className="text-sm text-gray-400 space-y-1">
                          <p>📅 Ordinato: {formatDate(ordine.data)}</p>
                          {ordine.data_invio_whatsapp && (
                            <p>📱 Inviato: {formatDate(ordine.data_invio_whatsapp)}</p>
                          )}
                          <p>🍷 Articoli: {ordine.dettagli?.length || 0}</p>
                          <p>💰 Totale: <span className="text-green-400 font-semibold">€{ordine.totale.toFixed(2)}</span></p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewOrdine(ordine)}
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
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick preview dei vini */}
                    {ordine.dettagli && ordine.dettagli.length > 0 && (
                      <div className="border-t border-gray-600/50 pt-3">
                        <div className="text-xs text-gray-400 mb-2">Vini ordinati:</div>
                        <div className="space-y-1">
                          {ordine.dettagli.slice(0, 3).map((dettaglio) => (
                            <div key={dettaglio.id} className="flex justify-between text-sm">
                              <span className="text-gray-300">
                                {dettaglio.nome_vino} {dettaglio.anno && `(${dettaglio.anno})`}
                              </span>
                              <span className="text-gray-400">
                                {dettaglio.quantita_ordinata} bot. × €{dettaglio.prezzo_unitario.toFixed(2)}
                              </span>
                            </div>
                          ))}
                          {ordine.dettagli.length > 3 && (
                            <div className="text-xs text-gray-500">
                              ... e altri {ordine.dettagli.length - 3} vini
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
      </main>

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
    </div>
  );
}
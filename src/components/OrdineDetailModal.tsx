import React, { useState } from 'react';
import { X, Package, Clock, CheckCircle, Edit3, Save, AlertCircle } from 'lucide-react';
import { useOrdini } from '../hooks/useOrdini';

interface OrdineDetailModalProps {
  ordine: any;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function OrdineDetailModal({ ordine, open, onClose, onUpdate }: OrdineDetailModalProps) {
  const { aggiornaStatoOrdine, confermaRicevimento } = useOrdini();
  const [isEditing, setIsEditing] = useState(false);
  const [quantitaRicevute, setQuantitaRicevute] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  if (!open || !ordine) return null;

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
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatoIcon = (stato: string) => {
    switch (stato) {
      case 'sospeso': return <Clock className="h-4 w-4" />;
      case 'inviato': return <Package className="h-4 w-4" />;
      case 'ricevuto': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleMarkAsInviato = async () => {
    const success = await aggiornaStatoOrdine(ordine.id, 'inviato');
    if (success) {
      onUpdate();
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    // Inizializza quantità ricevute con quelle ordinate
    const iniziali: Record<string, number> = {};
    ordine.dettagli?.forEach((det: any) => {
      iniziali[det.id] = det.quantita_ricevuta || det.quantita_ordinata;
    });
    setQuantitaRicevute(iniziali);
  };

  const handleSaveRicevimento = async () => {
    setIsSaving(true);
    try {
      const success = await confermaRicevimento(ordine.id, quantitaRicevute);
      if (success) {
        setIsEditing(false);
        onUpdate();
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const updateQuantitaRicevuta = (dettaglioId: string, value: number) => {
    setQuantitaRicevute(prev => ({
      ...prev,
      [dettaglioId]: Math.max(0, value)
    }));
  };

  const calcolaTotaleRicevuto = () => {
    return ordine.dettagli?.reduce((sum: number, det: any) => {
      const qta = quantitaRicevute[det.id] || det.quantita_ricevuta || 0;
      return sum + (qta * det.prezzo_unitario);
    }, 0) || 0;
  };

  // Parsing sicuro del contenuto JSONB
  const viniOrdinati = (() => {
    try {
      const contenuto = typeof ordine.contenuto === 'string' 
        ? JSON.parse(ordine.contenuto) 
        : ordine.contenuto;
      return Array.isArray(contenuto) ? contenuto : [];
    } catch {
      return [];
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-cream">Dettagli Ordine</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-2 ${getStatoColor(ordine.stato)}`}>
              {getStatoIcon(ordine.stato)}
              {ordine.stato.toUpperCase()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Informazioni Ordine */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Informazioni Generali</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Fornitore:</span>
                  <span className="text-white font-medium">{ordine.fornitore_nome || ordine.fornitore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Data Ordine:</span>
                  <span className="text-white">{formatDate(ordine.data)}</span>
                </div>
                {ordine.data_invio_whatsapp && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Data Invio:</span>
                    <span className="text-white">{formatDate(ordine.data_invio_whatsapp)}</span>
                  </div>
                )}
                {ordine.data_ricevimento && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Data Ricevimento:</span>
                    <span className="text-white">{formatDate(ordine.data_ricevimento)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">ID Ordine:</span>
                  <span className="text-white font-mono text-xs">{ordine.id.substring(0, 8)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Totali</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Articoli:</span>
                  <span className="text-white">{(() => {
                    try {
                      const contenuto = typeof ordine.contenuto === 'string' 
                        ? JSON.parse(ordine.contenuto) 
                        : ordine.contenuto;
                      return Array.isArray(contenuto) ? contenuto.length : 0;
                    } catch {
                      return 0;
                    }
                  })()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bottiglie Totali:</span>
                  <span className="text-white">
                    {(() => {
                      try {
                        const contenuto = typeof ordine.contenuto === 'string' 
                          ? JSON.parse(ordine.contenuto) 
                          : ordine.contenuto;
                        return Array.isArray(contenuto) 
                          ? contenuto.reduce((sum: number, vino: any) => sum + (vino.quantita || 0), 0)
                          : 0;
                      } catch {
                        return 0;
                      }
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Totale Ordinato:</span>
                  <span className="text-green-400 font-semibold">€{ordine.totale.toFixed(2)}</span>
                </div>
                {isEditing && (
                  <div className="flex justify-between border-t border-gray-600 pt-2">
                    <span className="text-gray-400">Totale Ricevuto:</span>
                    <span className="text-blue-400 font-semibold">€{calcolaTotaleRicevuto().toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dettagli Vini */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Vini Ordinati</h3>
              {ordine.stato === 'inviato' && !isEditing && (
                <button
                  onClick={handleStartEditing}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600/20 hover:bg-green-600/40 text-green-300 rounded-lg transition-colors text-sm"
                >
                  <Edit3 className="h-4 w-4" />
                  Conferma Ricevimento
                </button>
              )}
            </div>

            <div className="space-y-3">
              {viniOrdinati.map((vino, index) => (
                <div key={index} className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-white">
                        {vino.nome}
                      </h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Quantità ordinata</p>
                      <p className="text-white font-medium">{vino.quantita} bottiglie</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Prezzo unitario</p>
                      <p className="text-white font-medium">€{(vino.prezzo_unitario || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Subtotale</p>
                      <p className="text-green-400 font-bold">
                        €{(vino.quantita * (vino.prezzo_unitario || 0)).toFixed(2)}
                      </p>
                    </div>
                    {vino.giacenza_attuale !== undefined && (
                      <div>
                        <p className="text-gray-400">Giacenza attuale</p>
                        <p className="text-white text-sm">{vino.giacenza_attuale}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setQuantitaRicevute({});
                }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                disabled={isSaving}
              >
                Annulla
              </button>
              <button
                onClick={handleSaveRicevimento}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Salvando...' : 'Conferma Ricevimento'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Chiudi
              </button>
              {ordine.stato === 'sospeso' && (
                <button
                  onClick={handleMarkAsInviato}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Marca come Inviato
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
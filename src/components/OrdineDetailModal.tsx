
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
                  <span className="text-white font-medium">{ordine.fornitore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Data Ordine:</span>
                  <span className="text-white">{formatDate(ordine.data_ordine)}</span>
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
                  <span className="text-white">{ordine.dettagli?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bottiglie Totali:</span>
                  <span className="text-white">
                    {ordine.dettagli?.reduce((sum: number, det: any) => sum + det.quantita_ordinata, 0) || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Totale Ordinato:</span>
                  <span className="text-green-400 font-semibold">€{ordine.totale_euro.toFixed(2)}</span>
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
              {ordine.dettagli?.map((dettaglio: any) => (
                <div key={dettaglio.id} className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-white mb-1">
                        {dettaglio.nome_vino}
                      </h4>
                      {dettaglio.produttore && (
                        <p className="text-sm text-gray-400">
                          {dettaglio.produttore} {dettaglio.anno && `(${dettaglio.anno})`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400 block">Ordinato:</span>
                      <span className="text-white font-medium">
                        {dettaglio.quantita_ordinata} bottiglie
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 block">Prezzo unitario:</span>
                      <span className="text-white font-medium">
                        €{dettaglio.prezzo_unitario.toFixed(2)}
                      </span>
                    </div>

                    {isEditing ? (
                      <div>
                        <span className="text-gray-400 block">Ricevuto:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantitaRicevuta(dettaglio.id, (quantitaRicevute[dettaglio.id] || 0) - 1)}
                            className="w-6 h-6 bg-red-600/80 hover:bg-red-700 text-white rounded text-xs flex items-center justify-center"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={quantitaRicevute[dettaglio.id] || 0}
                            onChange={(e) => updateQuantitaRicevuta(dettaglio.id, parseInt(e.target.value) || 0)}
                            className="w-16 h-6 bg-gray-800 border border-gray-600 rounded text-center text-white text-xs"
                          />
                          <button
                            onClick={() => updateQuantitaRicevuta(dettaglio.id, (quantitaRicevute[dettaglio.id] || 0) + 1)}
                            className="w-6 h-6 bg-green-600/80 hover:bg-green-700 text-white rounded text-xs flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-gray-400 block">Ricevuto:</span>
                        <span className="text-white font-medium">
                          {dettaglio.quantita_ricevuta !== null ? `${dettaglio.quantita_ricevuta} bottiglie` : 'In attesa'}
                        </span>
                      </div>
                    )}

                    <div>
                      <span className="text-gray-400 block">Subtotale:</span>
                      <span className="text-green-400 font-medium">
                        €{dettaglio.subtotale.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Differenze evidenziate */}
                  {!isEditing && dettaglio.quantita_ricevuta !== null && dettaglio.quantita_ricevuta !== dettaglio.quantita_ordinata && (
                    <div className="mt-2 p-2 bg-orange-500/10 border border-orange-500/30 rounded text-xs">
                      <div className="flex items-center gap-1 text-orange-300">
                        <AlertCircle className="h-3 w-3" />
                        Differenza: {dettaglio.quantita_ricevuta - dettaglio.quantita_ordinata > 0 ? '+' : ''}
                        {dettaglio.quantita_ricevuta - dettaglio.quantita_ordinata} bottiglie
                      </div>
                    </div>
                  )}
                </div>
              )) || []}
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

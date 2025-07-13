
import React, { useState, useEffect } from 'react';
import { X, Package, Check, AlertCircle } from 'lucide-react';
import { useWines } from '../hooks/useWines';

interface RicezioneOrdineModalProps {
  ordine: any;
  open: boolean;
  onClose: () => void;
  onConfirm: (ordineId: string, quantitaRicevute: Record<string, number>) => void;
}

interface VinoRicezione {
  nome: string;
  quantitaOrdinata: number;
  quantitaRicevuta: number;
  vinoId?: string;
}

const RicezioneOrdineModal: React.FC<RicezioneOrdineModalProps> = ({
  ordine,
  open,
  onClose,
  onConfirm
}) => {
  const { wines, updateWineInventory } = useWines();
  const [viniRicezione, setViniRicezione] = useState<VinoRicezione[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (ordine && open) {
      try {
        const contenuto = typeof ordine.contenuto === 'string' 
          ? JSON.parse(ordine.contenuto) 
          : ordine.contenuto;

        if (Array.isArray(contenuto)) {
          const viniData = contenuto.map(vino => {
            // Cerca il vino corrispondente per aggiornare la giacenza
            const vinoCorrispondente = wines.find(w => 
              w.name.toLowerCase().includes(vino.nome.toLowerCase()) ||
              vino.nome.toLowerCase().includes(w.name.toLowerCase())
            );

            return {
              nome: vino.nome,
              quantitaOrdinata: vino.quantita || 0,
              quantitaRicevuta: vino.quantita || 0, // Default uguale a ordinata
              vinoId: vinoCorrispondente?.id
            };
          });
          setViniRicezione(viniData);
        }
      } catch (error) {
        console.error('Errore parsing contenuto ordine:', error);
        setViniRicezione([]);
      }
    }
  }, [ordine, open, wines]);

  const handleQuantitaChange = (index: number, nuovaQuantita: number) => {
    setViniRicezione(prev => 
      prev.map((vino, i) => 
        i === index ? { ...vino, quantitaRicevuta: Math.max(0, nuovaQuantita) } : vino
      )
    );
  };

  const handleConfermaRicezione = async () => {
    if (!ordine) return;

    setIsProcessing(true);
    
    try {
      // Aggiorna le giacenze dei vini
      for (const vino of viniRicezione) {
        if (vino.vinoId && vino.quantitaRicevuta > 0) {
          const vinoCorrente = wines.find(w => w.id === vino.vinoId);
          if (vinoCorrente) {
            const nuovaGiacenza = vinoCorrente.inventory + vino.quantitaRicevuta;
            await updateWineInventory(vino.vinoId, nuovaGiacenza);
          }
        }
      }

      // Prepara i dati delle quantità ricevute nel formato corretto
      const quantitaRicevute: Record<string, number> = {};
      viniRicezione.forEach((vino, index) => {
        quantitaRicevute[vino.nome] = vino.quantitaRicevuta;
      });

      // Chiama la funzione di conferma del parent
      onConfirm(ordine.id, quantitaRicevute);
      
    } catch (error) {
      console.error('Errore durante la ricezione ordine:', error);
      alert('Errore durante l\'aggiornamento delle giacenze. Riprova.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTotaleDifferenza = () => {
    return viniRicezione.reduce((acc, vino) => 
      acc + (vino.quantitaRicevuta - vino.quantitaOrdinata), 0
    );
  };

  const hasDiscrepanze = () => {
    return viniRicezione.some(vino => vino.quantitaRicevuta !== vino.quantitaOrdinata);
  };

  if (!open || !ordine) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-green-500" />
            <div>
              <h2 className="text-xl font-bold text-cream">Ricezione Ordine</h2>
              <p className="text-sm text-gray-400">
                {ordine.fornitore_nome || ordine.fornitore}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="mb-4">
            <p className="text-sm text-gray-300 mb-2">
              📅 Ordinato: {new Date(ordine.data).toLocaleDateString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p className="text-sm text-gray-400">
              Verifica e modifica le quantità effettivamente ricevute:
            </p>
          </div>

          {/* Lista vini */}
          <div className="space-y-4">
            {viniRicezione.map((vino, index) => (
              <div key={index} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-white text-sm mb-1">
                      {vino.nome}
                    </h3>
                    {!vino.vinoId && (
                      <div className="flex items-center gap-1 text-xs text-yellow-400">
                        <AlertCircle className="h-3 w-3" />
                        Vino non trovato in inventario
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <label className="text-xs text-gray-400 block mb-1">Ordinata</label>
                    <span className="text-sm font-medium text-blue-300">
                      {vino.quantitaOrdinata} bot.
                    </span>
                  </div>

                  <div className="text-center">
                    <label className="text-xs text-gray-400 block mb-1">Ricevuta</label>
                    <input
                      type="number"
                      value={vino.quantitaRicevuta}
                      onChange={(e) => handleQuantitaChange(index, parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-center text-sm text-cream focus:border-amber-500 focus:outline-none"
                      min="0"
                    />
                  </div>

                  <div className="text-center">
                    <label className="text-xs text-gray-400 block mb-1">Differenza</label>
                    <span className={`text-sm font-medium ${
                      vino.quantitaRicevuta > vino.quantitaOrdinata 
                        ? 'text-green-400' 
                        : vino.quantitaRicevuta < vino.quantitaOrdinata 
                          ? 'text-red-400' 
                          : 'text-gray-300'
                    }`}>
                      {vino.quantitaRicevuta > vino.quantitaOrdinata ? '+' : ''}
                      {vino.quantitaRicevuta - vino.quantitaOrdinata}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Riepilogo discrepanze */}
          {hasDiscrepanze() && (
            <div className="mt-6 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <h4 className="font-medium text-yellow-300">Discrepanze rilevate</h4>
              </div>
              <p className="text-sm text-yellow-200">
                Differenza totale: <span className="font-semibold">
                  {getTotaleDifferenza() > 0 ? '+' : ''}{getTotaleDifferenza()} bottiglie
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Annulla
          </button>
          
          <button
            onClick={handleConfermaRicezione}
            disabled={isProcessing || viniRicezione.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Elaborazione...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Conferma Ricezione
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RicezioneOrdineModal;

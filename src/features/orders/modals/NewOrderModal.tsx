import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useSuppliers from "../../../hooks/useSuppliers";

interface NewOrderModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewOrderModal({ open, onClose }: NewOrderModalProps) {
  const navigate = useNavigate();
  const { suppliers, isLoading, error } = useSuppliers();
  const [selectedFornitore, setSelectedFornitore] = useState<string>("");

  // Reset quando il modale si apre/chiude
  useEffect(() => {
    if (open) {
      setSelectedFornitore("");
    }
  }, [open]);

  const handleAvanti = () => {
    if (selectedFornitore) {
      // Trova l'ID del fornitore selezionato
      const supplier = suppliers.find(s => s.nome === selectedFornitore);
      if (supplier) {
        // Chiudi il modale e naviga alla pagina Crea Ordine
        onClose();
        navigate(`/orders/create?supplier=${supplier.id}`);
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="border border-gray-700 rounded-lg shadow-lg max-w-md w-full p-6 space-y-6" style={{
        background: '#541111'
      }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: '#fff9dc' }}>Nuovo Ordine</h2>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: '#fff9dc' }}
            aria-label="Chiudi"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Selezione fornitore */}
        <div className="space-y-4 p-4 rounded-lg" style={{ background: '#fff9dc' }}>
          <p className="text-sm" style={{ color: '#541111' }}>Seleziona un fornitore per iniziare:</p>

          <div className="relative">
            <select
              value={selectedFornitore}
              onChange={(e) => setSelectedFornitore(e.target.value)}
              disabled={isLoading}
              className="w-full p-3 rounded-lg appearance-none focus:ring-2 focus:outline-none"
              style={{
                background: '#fff9dc',
                color: '#541111',
                border: '1px solid rgba(84, 17, 17, 0.2)'
              }}
            >
              <option value="">
                {isLoading
                  ? "Caricamento fornitori..."
                  : error
                  ? `Errore: ${error}`
                  : suppliers.length === 0
                  ? "Nessun fornitore trovato"
                  : "Scegli un fornitore..."}
              </option>
              {!error &&
                suppliers.map((f) => (
                  <option key={f.id} value={f.nome}>
                    {f.nome}
                  </option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="flex justify-end pt-2 gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 font-medium rounded-lg transition-colors"
              style={{
                color: '#541111',
                border: '1px solid rgba(84, 17, 17, 0.3)'
              }}
            >
              Annulla
            </button>
            <button
              onClick={handleAvanti}
              disabled={!selectedFornitore || isLoading}
              className="px-6 py-2 font-medium rounded-lg transition-colors disabled:opacity-50"
              style={{
                background: '#541111',
                color: '#fff9dc',
                border: 'none'
              }}
            >
              Avanti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

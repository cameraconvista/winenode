import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { getFornitoriNames } from '../../services/fornitori';

interface NuovoOrdineModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAvanti: (selectedSupplier: string) => void;
}

export default function NuovoOrdineModal({ 
  isOpen, 
  onOpenChange, 
  onAvanti 
}: NuovoOrdineModalProps) {
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // Carica fornitori dalla tabella public.fornitori
  useEffect(() => {
    if (!isOpen) return;
    
    const loadSuppliers = async () => {
      setLoadingSuppliers(true);
      try {
        const fornitoriNames = await getFornitoriNames();
        setSuppliers(fornitoriNames);
      } catch (error) {
        console.error('Errore caricamento fornitori:', error);
        setSuppliers([]);
      } finally {
        setLoadingSuppliers(false);
      }
    };

    loadSuppliers();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAvanti = () => {
    if (selectedSupplier) {
      onAvanti(selectedSupplier);
    }
  };

  const handleClose = () => {
    setSelectedSupplier('');
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="w-full max-w-md rounded-lg overflow-hidden relative"
        style={{ background: '#2e0d0d', border: '1px solid #541111' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold" style={{ color: '#fff9dc' }}>
            Nuovo Ordine
          </h2>
          <button
            onClick={handleClose}
            className="transition-colors flex-shrink-0"
            style={{ color: '#fff9dc' }}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div 
          className="mx-4 md:mx-6 mb-4 md:mb-6 p-4 md:p-6 rounded-lg"
          style={{ background: '#fff2b8' }}
        >
          <p className="text-sm md:text-base mb-4" style={{ color: '#541111' }}>
            Seleziona un fornitore per iniziare:
          </p>

          {/* Supplier Dropdown */}
          <div className="relative mb-6">
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              disabled={loadingSuppliers}
              className="w-full p-3 md:p-4 rounded-lg border appearance-none bg-white text-sm md:text-base pr-10"
              style={{ 
                borderColor: '#e2d6aa',
                color: selectedSupplier ? '#541111' : '#9b9b9b',
                opacity: loadingSuppliers ? 0.6 : 1
              }}
            >
              <option value="" disabled>
                {loadingSuppliers ? 'Caricamento fornitori...' : 'Scegli un fornitore...'}
              </option>
              {!loadingSuppliers && suppliers.map((supplier) => (
                <option key={supplier} value={supplier} style={{ color: '#541111' }}>
                  {supplier}
                </option>
              ))}
            </select>
            <ChevronDown 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 pointer-events-none"
              style={{ color: '#9b9b9b' }}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 rounded-lg transition-colors text-sm md:text-base font-medium"
              style={{ 
                background: 'white', 
                color: '#541111',
                border: '1px solid #e2d6aa'
              }}
            >
              Annulla
            </button>
            <button
              onClick={handleAvanti}
              disabled={!selectedSupplier}
              className="flex-1 px-4 py-3 rounded-lg transition-colors text-sm md:text-base font-medium disabled:opacity-50"
              style={{ 
                background: selectedSupplier ? '#16a34a' : '#d1c7b8', 
                color: '#fff9dc'
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

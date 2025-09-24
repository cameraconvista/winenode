import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { WineType } from '../hooks/useWines';

interface WineDetailsModalProps {
  wine: WineType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateWine?: (id: string, updates: Partial<WineType>) => Promise<void>;
  suppliers?: string[];
}

export default function WineDetailsModal({ 
  wine, 
  open, 
  onOpenChange, 
  onUpdateWine,
  suppliers = [] 
}: WineDetailsModalProps) {
  const [formData, setFormData] = useState({
    minStock: '',
    inventory: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (wine) {
      setFormData({
        minStock: wine.minStock.toString(),
        inventory: wine.inventory.toString()
      });
    }
  }, [wine]);

  if (!open || !wine) return null;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (onUpdateWine) {
        await onUpdateWine(wine.id, {
          minStock: parseInt(formData.minStock) || 2,
          inventory: parseInt(formData.inventory) || 0
        });
      }
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
      <div className="modal-content bg-gray-900 border border-gray-700 rounded-lg w-full max-w-sm md:max-w-4xl max-h-[95vh] max-h-[95dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-700">
          <div>
            <h3 className="text-lg md:text-2xl font-bold text-cream uppercase">{wine.name}</h3>
            <div className="text-xs md:text-sm text-gray-300 mt-1">
              {wine.vintage && (
                <>
                  <span className="text-cream font-medium">{wine.vintage}</span>
                  <span className="mx-2">·</span>
                </>
              )}
              {wine.description && (
                <>
                  <span className="text-cream font-medium">{wine.description}</span>
                  <span className="mx-2">·</span>
                </>
              )}
              {wine.cost && wine.cost > 0 && (
                <>
                  <span className="text-amber-400 font-bold">€{wine.cost.toFixed(2)}</span>
                  <span className="mx-2">·</span>
                </>
              )}
              <span className="text-blue-300 font-medium">
                {wine.supplier && wine.supplier.trim() ? wine.supplier : 'BOLOGNA VINI'}
              </span>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-cream"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content - Layout responsivo */}
        <div className="p-4 md:p-6">
          <div className="max-w-md mx-auto">
            {/* Controlli */}
            <div className="space-y-4 md:space-y-6">
              {/* Giacenza */}
              <div>
                <label className="block text-base md:text-lg font-medium text-cream mb-2 md:mb-3">
                  Giacenza
                </label>
                <div className="flex items-center bg-gray-800 border border-gray-600 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = parseInt(formData.inventory) || 0;
                      if (currentValue > 0) {
                        setFormData(prev => ({ ...prev, inventory: (currentValue - 1).toString() }));
                      }
                    }}
                    className="w-10 h-10 md:w-16 md:h-16 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-gray-700 transition-colors rounded-l-lg border-r border-gray-600 text-lg md:text-2xl"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={formData.inventory}
                    onChange={(e) => setFormData(prev => ({ ...prev, inventory: e.target.value }))}
                    className="flex-1 bg-transparent px-2 py-2 md:px-4 md:py-4 text-cream text-center focus:outline-none text-lg md:text-2xl font-bold"
                    min="0"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = parseInt(formData.inventory) || 0;
                      setFormData(prev => ({ ...prev, inventory: (currentValue + 1).toString() }));
                    }}
                    className="w-10 h-10 md:w-16 md:h-16 flex items-center justify-center text-green-400 hover:text-green-300 hover:bg-gray-700 transition-colors rounded-r-lg border-l border-gray-600 text-lg md:text-2xl"
                  >
                    +
                  </button>
                </div>
              </div>

              

              {/* Soglia Minima */}
              <div>
                <label className="block text-base md:text-lg font-medium text-cream mb-2 md:mb-3">
                  <span className="flex items-center gap-2">
                    <span className="text-yellow-400">⚠️</span>
                    Soglia Minima
                  </span>
                </label>
                <div className="flex items-center bg-gray-800 border border-gray-600 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = parseInt(formData.minStock) || 0;
                      if (currentValue > 0) {
                        setFormData(prev => ({ ...prev, minStock: (currentValue - 1).toString() }));
                      }
                    }}
                    className="w-10 h-10 md:w-16 md:h-16 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-gray-700 transition-colors rounded-l-lg border-r border-gray-600 text-lg md:text-2xl"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
                    className="flex-1 bg-transparent px-2 py-2 md:px-4 md:py-4 text-cream text-center focus:outline-none text-lg md:text-2xl font-bold"
                    min="0"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = parseInt(formData.minStock) || 0;
                      setFormData(prev => ({ ...prev, minStock: (currentValue + 1).toString() }));
                    }}
                    className="w-10 h-10 md:w-16 md:h-16 flex items-center justify-center text-green-400 hover:text-green-300 hover:bg-gray-700 transition-colors rounded-r-lg border-l border-gray-600 text-lg md:text-2xl"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Prezzo di Acquisto */}
              <div>
                <label className="block text-base md:text-lg font-medium text-cream mb-2 md:mb-3">
                  Prezzo di Acquisto
                </label>
                <div className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 md:px-6 md:py-4">
                  <div className="text-gray-400 text-center text-base md:text-lg">
                    Funzionalità in arrivo
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 md:space-x-4 p-4 md:p-6 border-t border-gray-700">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 px-4 py-2 md:px-6 md:py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-base md:text-lg font-medium"
            disabled={isLoading}
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 md:px-6 md:py-3 bg-blue-600 text-cream rounded-lg hover:bg-blue-700 transition-colors text-base md:text-lg font-medium"
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  );
}
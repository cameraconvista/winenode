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
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-sm md:max-w-4xl max-h-[95vh] overflow-y-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
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
            </div>

            {/* Box Foto */}
            <div className="flex items-center justify-center">
              <div className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl p-4 md:p-8 w-full h-full min-h-[200px] md:min-h-[400px] flex flex-col items-center justify-center text-center cursor-pointer hover:border-gray-500 transition-colors">
                <div className="text-gray-400 mb-3 md:mb-4">
                  <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-gray-300 font-medium text-base md:text-lg mb-1 md:mb-2">
                  CLICCA QUI:
                </div>
                <div className="text-gray-400 text-sm md:text-base">
                  INSERISCI FOTO
                </div>
                <div className="text-gray-400 text-sm md:text-base">
                  FAI FOTOGRAFIA
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
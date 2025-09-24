import React, { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';
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
      <div className="modal-content rounded-lg w-full max-w-sm md:max-w-4xl max-h-[95vh] max-h-[95dvh] overflow-y-auto" style={{ background: '#2e0d0d', border: '1px solid #541111' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6" style={{ borderBottom: '1px solid #541111' }}>
          <div>
            <h3 className="text-lg md:text-2xl font-bold uppercase" style={{ color: '#fff9dc' }}>{wine.name}</h3>
            <div className="text-xs md:text-sm mt-1" style={{ color: '#fff9dc' }}>
              {wine.vintage && (
                <>
                  <span className="font-medium" style={{ color: '#fff9dc' }}>{wine.vintage}</span>
                  <span className="mx-2">·</span>
                </>
              )}
              {wine.description && (
                <>
                  <span className="font-medium" style={{ color: '#fff9dc' }}>{wine.description}</span>
                  <span className="mx-2">·</span>
                </>
              )}
              {wine.cost && wine.cost > 0 && (
                <>
                  <span className="font-bold" style={{ color: '#d4a300' }}>€{wine.cost.toFixed(2)}</span>
                  <span className="mx-2">·</span>
                </>
              )}
              <span className="font-medium" style={{ color: '#fff9dc' }}>
                {wine.supplier && wine.supplier.trim() ? wine.supplier : 'BOLOGNA VINI'}
              </span>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="transition-colors"
            style={{ color: '#fff9dc' }}
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
                <label className="block text-base md:text-lg font-medium mb-2 md:mb-3" style={{ color: '#541111' }}>
                  Giacenza
                </label>
                <div className="flex items-center rounded-lg" style={{ background: '#fff2b8', border: '1px solid #e2d6aa' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = parseInt(formData.inventory) || 0;
                      if (currentValue > 0) {
                        setFormData(prev => ({ ...prev, inventory: (currentValue - 1).toString() }));
                      }
                    }}
                    className="w-10 h-10 md:w-16 md:h-16 flex items-center justify-center text-red-600 hover:text-red-700 transition-colors rounded-l-lg text-lg md:text-2xl"
                    style={{ borderRight: '1px solid #e2d6aa' }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={formData.inventory}
                    onChange={(e) => setFormData(prev => ({ ...prev, inventory: e.target.value }))}
                    className="flex-1 bg-transparent px-2 py-2 md:px-4 md:py-4 text-center focus:outline-none text-lg md:text-2xl font-bold"
                    style={{ color: '#541111' }}
                    min="0"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = parseInt(formData.inventory) || 0;
                      setFormData(prev => ({ ...prev, inventory: (currentValue + 1).toString() }));
                    }}
                    className="w-10 h-10 md:w-16 md:h-16 flex items-center justify-center text-green-600 hover:text-green-700 transition-colors rounded-r-lg text-lg md:text-2xl"
                    style={{ borderLeft: '1px solid #e2d6aa' }}
                  >
                    +
                  </button>
                </div>
              </div>

              

              {/* Soglia Minima */}
              <div>
                <label className="block text-base md:text-lg font-medium mb-2 md:mb-3" style={{ color: '#541111' }}>
                  <span className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-red-500" />
                    Soglia Minima
                  </span>
                </label>
                <div className="flex items-center rounded-lg" style={{ background: '#fff2b8', border: '1px solid #e2d6aa' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = parseInt(formData.minStock) || 0;
                      if (currentValue > 0) {
                        setFormData(prev => ({ ...prev, minStock: (currentValue - 1).toString() }));
                      }
                    }}
                    className="w-10 h-10 md:w-16 md:h-16 flex items-center justify-center text-red-600 hover:text-red-700 transition-colors rounded-l-lg text-lg md:text-2xl"
                    style={{ borderRight: '1px solid #e2d6aa' }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
                    className="flex-1 bg-transparent px-2 py-2 md:px-4 md:py-4 text-center focus:outline-none text-lg md:text-2xl font-bold"
                    style={{ color: '#541111' }}
                    min="0"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = parseInt(formData.minStock) || 0;
                      setFormData(prev => ({ ...prev, minStock: (currentValue + 1).toString() }));
                    }}
                    className="w-10 h-10 md:w-16 md:h-16 flex items-center justify-center text-green-600 hover:text-green-700 transition-colors rounded-r-lg text-lg md:text-2xl"
                    style={{ borderLeft: '1px solid #e2d6aa' }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Prezzo di Acquisto */}
              <div>
                <label className="block text-base md:text-lg font-medium mb-2 md:mb-3" style={{ color: '#541111' }}>
                  Prezzo di Acquisto
                </label>
                <div className="rounded-lg px-4 py-3 md:px-6 md:py-4" style={{ background: '#fff2b8', border: '1px solid #e2d6aa' }}>
                  <div className="text-center text-base md:text-lg font-bold" style={{ color: '#541111' }}>
                    {wine.cost && wine.cost > 0 ? `€${wine.cost.toFixed(2)}` : 'Non disponibile'}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 md:space-x-4 p-4 md:p-6" style={{ borderTop: '1px solid #541111' }}>
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 px-4 py-2 md:px-6 md:py-3 rounded-lg transition-colors text-base md:text-lg font-medium"
            style={{ background: '#7a4a30', color: '#fff9dc' }}
            disabled={isLoading}
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 md:px-6 md:py-3 rounded-lg transition-colors text-base md:text-lg font-medium"
            style={{ background: '#1a7f37', color: '#fff9dc' }}
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  );
}
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
      <div className="modal-content rounded-lg w-full max-w-sm md:max-w-4xl max-h-[95vh] max-h-[95dvh] overflow-y-auto relative" style={{ background: '#2e0d0d', border: '1px solid #541111' }}>
        {/* Header */}
        <div className="p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <h3 className="text-lg md:text-2xl font-bold uppercase" style={{ color: '#fff9dc' }}>{wine.name}</h3>
              <div className="text-xs md:text-sm mt-1" style={{ color: '#fff9dc' }}>
                {wine.vintage && (
                  <>
                    <span className="font-medium" style={{ color: '#fef3c7' }}>{wine.vintage}</span>
                    <span className="mx-2" style={{ color: '#fef3c7' }}>·</span>
                  </>
                )}
                {wine.description && (
                  <>
                    <span className="font-medium" style={{ color: '#fef3c7' }}>{wine.description}</span>
                    <span className="mx-2" style={{ color: '#fef3c7' }}>·</span>
                  </>
                )}
                <span className="font-medium" style={{ color: '#fef3c7' }}>
                  {wine.supplier && wine.supplier.trim() ? wine.supplier : 'BOLOGNA VINI'}
                </span>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="transition-colors flex-shrink-0"
              style={{ color: '#fff9dc' }}
              disabled={isLoading}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content - Layout responsivo */}
        <div className="p-4 md:p-6">
          <div className="max-w-xs mx-auto">
            {/* Controlli */}
            <div className="space-y-4 md:space-y-6">
              {/* Giacenza */}
              <div>
                <label className="block text-base md:text-lg font-medium mb-2 md:mb-3 text-center" style={{ color: '#fff9dc' }}>
                  Giacenza
                </label>
                <div className="flex items-center gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = parseInt(formData.inventory) || 0;
                      if (currentValue > 0) {
                        setFormData(prev => ({ ...prev, inventory: (currentValue - 1).toString() }));
                      }
                    }}
                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-white hover:opacity-80 transition-colors text-lg md:text-2xl rounded-lg"
                    style={{ background: '#dc2626' }}
                  >
                    −
                  </button>
                  <div className="rounded-lg px-4 py-3 md:px-6 md:py-4" style={{ background: '#fff2b8', border: '1px solid #e2d6aa' }}>
                    <input
                      type="number"
                      value={formData.inventory}
                      onChange={(e) => setFormData(prev => ({ ...prev, inventory: e.target.value }))}
                      className="bg-transparent text-center focus:outline-none text-base md:text-lg font-bold w-20"
                      style={{ color: '#541111' }}
                      min="0"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = parseInt(formData.inventory) || 0;
                      setFormData(prev => ({ ...prev, inventory: (currentValue + 1).toString() }));
                    }}
                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-white hover:opacity-80 transition-colors text-lg md:text-2xl rounded-lg"
                    style={{ background: '#16a34a' }}
                  >
                    +
                  </button>
                </div>
              </div>

              

              {/* Soglia Minima */}
              <div>
                <label className="block text-base md:text-lg font-medium mb-2 md:mb-3 text-center" style={{ color: '#fff9dc' }}>
                  <span className="flex items-center justify-center gap-2">
                    <Bell className="h-4 w-4 text-red-500" />
                    Soglia Minima
                  </span>
                </label>
                <div className="flex items-center gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = parseInt(formData.minStock) || 0;
                      if (currentValue > 0) {
                        setFormData(prev => ({ ...prev, minStock: (currentValue - 1).toString() }));
                      }
                    }}
                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-white hover:opacity-80 transition-colors text-lg md:text-2xl rounded-lg"
                    style={{ background: '#dc2626' }}
                  >
                    −
                  </button>
                  <div className="rounded-lg px-4 py-3 md:px-6 md:py-4" style={{ background: '#fff2b8', border: '1px solid #e2d6aa' }}>
                    <input
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
                      className="bg-transparent text-center focus:outline-none text-base md:text-lg font-bold w-20"
                      style={{ color: '#541111' }}
                      min="0"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = parseInt(formData.minStock) || 0;
                      setFormData(prev => ({ ...prev, minStock: (currentValue + 1).toString() }));
                    }}
                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-white hover:opacity-80 transition-colors text-lg md:text-2xl rounded-lg"
                    style={{ background: '#16a34a' }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Prezzo di Acquisto */}
              <div>
                <label className="block text-base md:text-lg font-medium mb-2 md:mb-3 text-center" style={{ color: '#fff9dc' }}>
                  Prezzo di Acquisto €
                </label>
                <div className="flex justify-center">
                  <div className="rounded-lg px-6 py-3 md:px-8 md:py-4" style={{ background: '#fff2b8', border: '1px solid #e2d6aa' }}>
                    <input
                      type="text"
                      value={wine.cost !== undefined && wine.cost !== null && wine.cost > 0 ? wine.cost.toFixed(2) : '/'}
                      readOnly
                      className="bg-transparent text-center focus:outline-none text-base md:text-lg font-bold w-20"
                      style={{ color: '#541111' }}
                    />
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
            style={{ background: '#dc2626', color: '#fff9dc' }}
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
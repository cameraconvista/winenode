import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Wine } from '../../shared/schema';

interface WineDetailsModalProps {
  wine: Wine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateWine?: (id: number, updates: Partial<Wine>) => Promise<void>;
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-xl font-bold text-cream">{wine.name}</h3>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-cream"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Info box completo con tutte le informazioni del vino */}
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 space-y-3">
            {/* Nome Vino */}
            <div className="text-cream font-bold text-lg leading-tight">{wine.name}</div>

            {/* Anno */}
            {wine.vintage && (
              <div className="text-sm">
                <span className="text-gray-400">Anno: </span>
                <span className="text-cream font-medium">{wine.vintage}</span>
              </div>
            )}

            {/* Produttore */}
            {wine.description && (
              <div className="text-sm">
                <span className="text-gray-400">Produttore: </span>
                <span className="text-cream font-medium">{wine.description}</span>
              </div>
            )}

            {/* Provenienza */}
            {wine.region && (
              <div className="text-sm">
                <span className="text-gray-400">Provenienza: </span>
                <span className="text-cream font-medium">{wine.region}</span>
              </div>
            )}

            {/* Fornitore */}
            {wine.supplier && (
              <div className="text-sm">
                <span className="text-gray-400">Fornitore: </span>
                <span className="text-blue-300 font-medium">{wine.supplier}</span>
              </div>
            )}

            {/* Tipologia come badge */}
            <div className="flex flex-wrap gap-2 text-xs pt-2">
              <span className="bg-gray-700 px-3 py-1.5 rounded-full text-gray-300 font-medium">
                {wine.type || 'Tipologia N/A'}
              </span>
            </div>
          </div>

          {/* Campi modificabili: Soglia Minima e Giacenza */}
          <div className="grid grid-cols-2 gap-4">
            {/* Soglia Minima */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <span className="flex items-center gap-1">
                  <span className="text-yellow-400">⚠️</span>
                  Soglia Minima
                </span>
              </label>
              <div className="flex items-center bg-gray-800 border border-gray-600 rounded-md">
                <button
                  type="button"
                  onClick={() => {
                    const currentValue = parseInt(formData.minStock) || 0;
                    if (currentValue > 0) {
                      setFormData(prev => ({ ...prev, minStock: (currentValue - 1).toString() }));
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-gray-700 transition-colors rounded-l-md border-r border-gray-600"
                >
                  −
                </button>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
                  className="flex-1 bg-transparent px-3 py-2 text-cream text-center focus:outline-none min-w-0"
                  min="0"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    const currentValue = parseInt(formData.minStock) || 0;
                    setFormData(prev => ({ ...prev, minStock: (currentValue + 1).toString() }));
                  }}
                  className="w-10 h-10 flex items-center justify-center text-green-400 hover:text-green-300 hover:bg-gray-700 transition-colors rounded-r-md border-l border-gray-600"
                >
                  +
                </button>
              </div>
            </div>

            {/* Giacenza */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Giacenza
              </label>
              <div className="flex items-center bg-gray-800 border border-gray-600 rounded-md">
                <button
                  type="button"
                  onClick={() => {
                    const currentValue = parseInt(formData.inventory) || 0;
                    if (currentValue > 0) {
                      setFormData(prev => ({ ...prev, inventory: (currentValue - 1).toString() }));
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-gray-700 transition-colors rounded-l-md border-r border-gray-600"
                >
                  −
                </button>
                <input
                  type="number"
                  value={formData.inventory}
                  onChange={(e) => setFormData(prev => ({ ...prev, inventory: e.target.value }))}
                  className="flex-1 bg-transparent px-3 py-2 text-cream text-center focus:outline-none min-w-0"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => {
                    const currentValue = parseInt(formData.inventory) || 0;
                    setFormData(prev => ({ ...prev, inventory: (currentValue + 1).toString() }));
                  }}
                  className="w-10 h-10 flex items-center justify-center text-green-400 hover:text-green-300 hover:bg-gray-700 transition-colors rounded-r-md border-l border-gray-600"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-4 border-t border-gray-700">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
            disabled={isLoading}
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-cream rounded-md hover:bg-blue-700 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  );
}
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
    price: '',
    minStock: '',
    supplier: '',
    description: '',
    type: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (wine) {
      setFormData({
        price: wine.price || '',
        minStock: wine.minStock.toString(),
        supplier: wine.supplier || '',
        description: wine.description || '',
        type: wine.type || ''
      });
    }
  }, [wine]);

  if (!open || !wine) return null;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (onUpdateWine) {
        await onUpdateWine(wine.id, {
          price: formData.price,
          minStock: parseInt(formData.minStock) || 2,
          supplier: formData.supplier,
          description: formData.description,
          type: formData.type
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

          {/* Campo modificabile: Soglia Minima con Giacenza */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Soglia Minima * <span className="text-blue-300 font-normal">(Giacenza attuale: {wine.inventory})</span>
            </label>
            <input
              type="number"
              value={formData.minStock}
              onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-cream focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              required
            />
          </div>

          {/* Campo modificabile: Fornitore */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Fornitore
            </label>
            <select
              value={formData.supplier}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-cream focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleziona fornitore</option>
              {suppliers.map(supplier => (
                <option key={supplier} value={supplier}>{supplier}</option>
              ))}
            </select>
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
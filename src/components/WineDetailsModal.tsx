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
          {/* Info box con produttore e fornitore */}
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 space-y-2">
            <div className="text-cream font-semibold text-base leading-tight">{wine.name}</div>

            {/* Produttore e Fornitore sulla stessa riga */}
            {(wine.description || wine.supplier) && (
              <div className="text-sm text-gray-300">
                {wine.description && (
                  <span className="text-gray-300">{wine.description}</span>
                )}
                {wine.description && wine.supplier && (
                  <span className="mx-2 text-gray-500">•</span>
                )}
                {wine.supplier && (
                  <span className="text-blue-300 font-medium">{wine.supplier}</span>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-xs">
              <span className="bg-gray-700 px-2 py-1 rounded text-gray-300">
                {wine.type || 'Tipologia N/A'}
              </span>

              {wine.region && (
                <span className="bg-gray-700 px-2 py-1 rounded text-gray-300">
                  {wine.region}
                </span>
              )}

              {wine.vintage && (
                <span className="bg-gray-700 px-2 py-1 rounded text-gray-300">
                  {wine.vintage}
                </span>
              )}
            </div>
          </div>

          {/* Campo modificabile: Soglia Minima */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Soglia Minima *
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
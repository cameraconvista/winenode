import React, { useState, useEffect } from 'react';
import { X, Filter, ChevronDown, Search, Calendar, Bell } from 'lucide-react';
import { getFornitoriNames } from '../services/fornitori';

interface FilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: {
    wineType: string
    supplier: string
    showAlertsOnly: boolean
  }
  onFiltersChange: (filters: any) => void
  wines: Array<{ type?: string }>
}

export default function FilterModal({ 
  open, 
  onOpenChange, 
  filters, 
  onFiltersChange, 
  wines 
}: FilterModalProps) {
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // Carica fornitori dalla tabella public.fornitori
  useEffect(() => {
    if (!open) return;
    
    const loadSuppliers = async () => {
      setLoadingSuppliers(true);
      try {
        // Cleanup cache localStorage se presente
        localStorage.removeItem('cachedSuppliers');
        localStorage.removeItem('filters');
        
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
  }, [open]);

  if (!open) return null

  // Extract unique wine types from actual wine data
  const wineTypes = Array.from(new Set(
    wines
      .map(wine => wine.type?.toLowerCase())
      .filter(Boolean)
  )).sort()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="border border-gray-700 rounded-lg shadow-lg max-w-md w-full p-6" style={{
        background: '#541111',
        maxHeight: '85vh',
        overflowY: 'auto'
      }}>
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold" style={{ color: '#fff9dc' }}>Filtri</h3>
            <button
              onClick={() => onOpenChange(false)}
              className="transition-colors"
              style={{ color: '#fff9dc' }}
              aria-label="Chiudi"
            >
              <X className="h-6 w-6" />
            </button>
        </div>

        <div className="space-y-4 p-4 rounded-lg" style={{ background: '#fff9dc' }}>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#541111' }}>
                Tipo
              </label>
              <select
                value={filters.wineType}
                onChange={(e) => onFiltersChange({ ...filters, wineType: e.target.value })}
                className="w-full p-3 rounded-lg appearance-none focus:ring-2 focus:outline-none"
                style={{
                  background: '#fff9dc',
                  color: '#541111',
                  border: '1px solid rgba(84, 17, 17, 0.2)'
                }}
              >
                <option value="">Tutti i tipi</option>
                {wineTypes.map(type => (
                  <option key={type} value={type} className="capitalize">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#541111' }}>
                Fornitore
              </label>
              <select
                value={filters.supplier}
                onChange={(e) => onFiltersChange({ ...filters, supplier: e.target.value })}
                disabled={loadingSuppliers}
                className="w-full p-3 rounded-lg appearance-none focus:ring-2 focus:outline-none"
                style={{
                  background: '#fff9dc',
                  color: '#541111',
                  border: '1px solid rgba(84, 17, 17, 0.2)',
                  opacity: loadingSuppliers ? 0.6 : 1
                }}
              >
                <option value="">
                  {loadingSuppliers ? 'Caricamento fornitori...' : 'Tutti i fornitori'}
                </option>
                {!loadingSuppliers && suppliers.map(supplier => (
                  <option key={supplier} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </select>
            </div>

            <label htmlFor="alerts-checkbox" className="flex items-center gap-3 pt-2 cursor-pointer p-2 rounded hover:bg-black/5">
              <input
                type="checkbox"
                id="alerts-checkbox"
                checked={filters.showAlertsOnly}
                onChange={(e) => onFiltersChange({ ...filters, showAlertsOnly: e.target.checked })}
                className="h-4 w-4 rounded focus:ring-2"
                style={{
                  accentColor: '#541111',
                  border: '1px solid rgba(84, 17, 17, 0.3)'
                }}
              />
              <span className="text-sm select-none flex items-center gap-2" style={{ color: '#541111' }}>
                <Bell className="h-4 w-4" style={{ color: '#dc2626' }} />
                Solo scorte basse
              </span>
            </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => onFiltersChange({ wineType: '', supplier: '', showAlertsOnly: false })}
            className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors"
            style={{ 
              background: '#dc2626', 
              color: '#fff9dc'
            }}
          >
            Reset
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors"
            style={{ 
              background: '#16a34a', 
              color: '#fff9dc'
            }}
          >
            Applica
          </button>
        </div>
      </div>
    </div>
  )
}
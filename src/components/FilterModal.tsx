import React, { useState, useEffect } from 'react';
import { X, Filter, ChevronDown, Search, Calendar } from 'lucide-react';

interface FilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: {
    wineType: string
    supplier: string
    showAlertsOnly: boolean
  }
  onFiltersChange: (filters: any) => void
  suppliers: string[]
  wines: Array<{ type?: string }>
}

export default function FilterModal({ 
  open, 
  onOpenChange, 
  filters, 
  onFiltersChange, 
  suppliers,
  wines 
}: FilterModalProps) {
  if (!open) return null

  // Extract unique wine types from actual wine data
  const wineTypes = Array.from(new Set(
    wines
      .map(wine => wine.type?.toLowerCase())
      .filter(Boolean)
  )).sort()

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed top-24 left-1/2 transform -translate-x-1/2 w-[85%] max-w-[280px] mx-4 sm:w-[75%] sm:max-w-[240px]">
        <div className="modal-content bg-gray-800/95 border border-gray-600/50 rounded-lg p-3 sm:p-2 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-cream">🔍 Filtri</h3>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-cream p-0.5 rounded-full hover:bg-gray-700/50 transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-0.5">
                🍷 Tipo
              </label>
              <select
                value={filters.wineType}
                onChange={(e) => onFiltersChange({ ...filters, wineType: e.target.value })}
                className="w-full px-2 py-1 text-xs bg-gray-700/90 border border-gray-600/50 rounded-md text-cream focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
              >
                <option value="">Tutti i tipi</option>
                {wineTypes.map(type => (
                  <option key={type} value={type} className="capitalize">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-0.5">
                🏢 Fornitore
              </label>
              <select
                value={filters.supplier}
                onChange={(e) => onFiltersChange({ ...filters, supplier: e.target.value })}
                className="w-full px-2 py-1 text-xs bg-gray-700/90 border border-gray-600/50 rounded-md text-cream focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
              >
                <option value="">Tutti i fornitori</option>
                {suppliers
                  .filter(supplier => supplier && supplier.trim()) // Remove empty suppliers
                  .sort()
                  .map(supplier => (
                    <option key={supplier} value={supplier}>
                      {supplier}
                    </option>
                  ))}
              </select>
            </div>

            <label htmlFor="alerts-checkbox" className="flex items-center gap-2 pt-0.5 cursor-pointer p-1 -m-1 rounded hover:bg-gray-700/30">
              <input
                type="checkbox"
                id="alerts-checkbox"
                checked={filters.showAlertsOnly}
                onChange={(e) => onFiltersChange({ ...filters, showAlertsOnly: e.target.checked })}
                className="h-3.5 w-3.5 text-amber-500 bg-gray-700 border border-gray-600 rounded focus:ring-1 focus:ring-amber-400 focus:bg-amber-500 checked:bg-amber-500 checked:border-amber-500"
              />
              <span className="text-xs text-gray-300 select-none">
                ⚠️ Solo scorte basse
              </span>
            </label>
          </div>

          <div className="mt-2 flex gap-1.5">
            <button
              onClick={() => onFiltersChange({ wineType: '', supplier: '', showAlertsOnly: false })}
              className="flex-1 px-2 py-1 text-xs bg-gray-700/80 text-cream rounded-md hover:bg-gray-600 transition-colors border border-gray-600/50"
            >
              🗑️ Reset
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 px-2 py-1 text-xs bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors shadow-lg"
            >
              ✅ Applica
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
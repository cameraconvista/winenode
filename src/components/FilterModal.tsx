import React, { useState, useEffect } from 'react';
import { X, Filter, ChevronDown, Search, Calendar, RotateCcw, Bell, Truck } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="border border-gray-700 rounded-lg shadow-lg max-w-md w-full p-6" style={{
        background: '#541111',
        maxHeight: '85vh',
        overflowY: 'auto'
      }}>
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold" style={{ color: '#fff9dc' }}>🔍 Filtri</h3>
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
                🍷 Tipo
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
              <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: '#541111' }}>
                <Truck className="h-4 w-4" style={{ color: '#b45309' }} />
                Fornitore
              </label>
              <select
                value={filters.supplier}
                onChange={(e) => onFiltersChange({ ...filters, supplier: e.target.value })}
                className="w-full p-3 rounded-lg appearance-none focus:ring-2 focus:outline-none"
                style={{
                  background: '#fff9dc',
                  color: '#541111',
                  border: '1px solid rgba(84, 17, 17, 0.2)'
                }}
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
            className="flex-1 px-4 py-2 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            style={{
              background: '#541111',
              color: '#fff9dc',
              border: 'none'
            }}
          >
            <div className="w-4 h-4 bg-gradient-to-b from-red-500 to-red-700 rounded shadow-sm flex items-center justify-center border border-red-800">
              <X className="h-3 w-3 text-white font-bold stroke-2" />
            </div>
            Reset
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 px-4 py-2 font-medium rounded-lg transition-colors"
            style={{
              background: '#541111',
              color: '#fff9dc',
              border: 'none'
            }}
          >
            ✅ Applica
          </button>
        </div>
      </div>
    </div>
  )
}
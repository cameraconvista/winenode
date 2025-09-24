import React from 'react';

interface Supplier {
  id: string;
  nome: string;
}

interface SupplierSelectProps {
  suppliers: Supplier[];
  selectedSupplier: string;
  onSupplierChange: (supplier: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function SupplierSelect({
  suppliers,
  selectedSupplier,
  onSupplierChange,
  isLoading = false,
  error = null
}: SupplierSelectProps) {
  return (
    <div className="relative">
      <select
        value={selectedSupplier}
        onChange={(e) => onSupplierChange(e.target.value)}
        disabled={isLoading}
        className="w-full p-3 rounded-lg appearance-none focus:ring-2 focus:outline-none"
        style={{
          background: '#fff9dc',
          color: '#541111',
          border: '1px solid rgba(84, 17, 17, 0.2)'
        }}
      >
        <option value="">
          {isLoading
            ? "Caricamento fornitori..."
            : error
            ? `Errore: ${error}`
            : suppliers.length === 0
            ? "Nessun fornitore trovato"
            : "Scegli un fornitore..."}
        </option>
        {!error &&
          suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.nome}>
              {supplier.nome}
            </option>
          ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

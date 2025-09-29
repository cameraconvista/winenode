import React, { memo } from 'react';

interface SupplierInputProps {
  fornitore: string;
  setFornitore: (fornitore: string) => void;
}

export const SupplierInput = memo(function SupplierInput({
  fornitore,
  setFornitore
}: SupplierInputProps) {
  return (
    <div className="mb-4">
      <div className="text-sm text-gray-400 mb-2">
        FORNITORE (opzionale)
      </div>
      <div 
        className="flex items-center gap-3 p-2 border border-[#4a2a2a]"
        style={{
          borderRadius: "12px",
          backgroundColor: "rgba(50, 0, 0, 0.6)"
        }}
      >
        <input
          type="text"
          className="flex-1 bg-transparent text-white border-none outline-none"
          style={{
            padding: "8px 0",
            fontSize: "16px",
            paddingLeft: "8px"
          }}
          value={fornitore}
          onChange={(e) => setFornitore(e.target.value)}
          placeholder="Nome fornitore..."
        />
      </div>
    </div>
  );
});

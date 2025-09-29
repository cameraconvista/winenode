import React, { memo } from 'react';
import { Upload, RotateCcw } from 'lucide-react';

interface ActionsBarProps {
  onRichiediConferma: (sostituisci: boolean) => void;
}

export const ActionsBar = memo(function ActionsBar({
  onRichiediConferma
}: ActionsBarProps) {
  return (
    <div className="flex items-center pt-2 gap-3">
      <button
        className="flex items-center justify-center gap-2 text-white hover:opacity-90 transition-opacity"
        style={{
          borderRadius: "12px",
          padding: "14px 20px",
          fontWeight: "600",
          fontSize: "16px",
          flex: "1",
          backgroundColor: "#166534"
        }}
        onClick={() => onRichiediConferma(false)}
      >
        <Upload className="w-4 h-4" />
        Aggiungi a lista esistente
      </button>
      <button
        className="flex items-center justify-center gap-2 text-white hover:bg-[#455a6b] transition-colors"
        style={{
          borderRadius: "12px",
          padding: "14px 20px",
          fontWeight: "600",
          fontSize: "16px",
          flex: "1",
          backgroundColor: "#526D82"
        }}
        onClick={() => onRichiediConferma(true)}
      >
        <RotateCcw className="w-4 h-4" />
        Sostituisci lista esistente
      </button>
    </div>
  );
});

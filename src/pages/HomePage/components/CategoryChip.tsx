import React, { memo } from 'react';
import { useAutoSizeText } from '../../../hooks/useAutoSizeText';

interface CategoryChipProps {
  activeTab: string;
  chipDisplayText: string;
  onTabChange: (category: string) => void;
}

export const CategoryChip = memo(function CategoryChip({
  activeTab,
  chipDisplayText,
  onTabChange
}: CategoryChipProps) {
  const { elementRef: chipTextRef } = useAutoSizeText({
    text: chipDisplayText,
    minFontSize: 12,
    maxFontSize: 20,
    paddingHorizontal: 32, // 16px * 2 dal CSS
    caretWidth: 0, // nessun caret visibile
    marginSafety: 6
  });

  return (
    <button
      onClick={() => {/* Toggle dropdown logic */}}
      className="nav-btn btn-tutti"
      title="Seleziona categoria"
      aria-label={`Filtro attivo: ${activeTab}`}
    >
      <span 
        ref={chipTextRef}
        className="label"
        style={{ 
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'block',
          width: '100%'
        }}
      >
        {chipDisplayText}
      </span>
      <select
        value={activeTab}
        onChange={(e) => onTabChange(e.target.value)}
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          opacity: 0, 
          cursor: 'pointer' 
        }}
      >
        <option value="TUTTI I VINI">TUTTI</option>
        <option value="BOLLICINE ITALIANE">Bollicine IT</option>
        <option value="BOLLICINE FRANCESI">Bollicine FR</option>
        <option value="BIANCHI">Bianchi</option>
        <option value="ROSSI">Rossi</option>
        <option value="ROSATI">Rosati</option>
        <option value="VINI DOLCI">Vini Dolci</option>
      </select>
    </button>
  );
});

import React, { memo } from 'react';

interface CategorySelectorProps {
  selectedTipologia: string;
  setSelectedTipologia: (tipologia: string) => void;
  onAddCategory: () => void;
}

export const CategorySelector = memo(function CategorySelector({
  selectedTipologia,
  setSelectedTipologia,
  onAddCategory
}: CategorySelectorProps) {
  return (
    <div className="mb-4">
      <div className="text-sm text-gray-400 mb-2">
        Seleziona TIPOLOGIA vino (obbligatorio)
      </div>
      <div 
        className="flex items-center gap-3 p-2 border border-[#4a2a2a]"
        style={{
          borderRadius: "12px",
          backgroundColor: "rgba(50, 0, 0, 0.6)"
        }}
      >
        <select
          className="flex-1 bg-transparent text-white border-none outline-none"
          style={{
            padding: "8px 0",
            fontSize: "16px",
            appearance: "none",
            backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 4 5\"><path fill=\"%23ffffff\" d=\"M2 0L0 2h4zm0 5L0 3h4z\"/></svg>')",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "8px center",
            backgroundSize: "12px",
            paddingLeft: "30px"
          }}
          value={selectedTipologia}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedTipologia(value);
            console.log('🔄 Tipologia selezionata:', value);
          }}
        >
          <option value="" style={{ color: '#6b7280' }}>seleziona...</option>
          <option value="Bianco">Bianco</option>
          <option value="Rosso">Rosso</option>
          <option value="Bollicine">Bollicine</option>
          <option value="Rosato">Rosato</option>
          <option value="Dolce">Dolce</option>
        </select>

        <button
          onClick={onAddCategory}
          className="flex items-center justify-center text-white hover:bg-red-700 transition-colors border border-[#2c1b1b]"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            backgroundColor: "rgba(80, 0, 0, 0.9)",
            fontSize: "18px",
            fontWeight: "bold"
          }}
          title="Aggiungi categoria"
        >
          +
        </button>
      </div>
    </div>
  );
});

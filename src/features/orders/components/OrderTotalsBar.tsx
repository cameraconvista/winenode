import React from 'react';

interface OrderTotalsBarProps {
  selectedWinesCount: number;
  totalBottles: number;
}

export default function OrderTotalsBar({
  selectedWinesCount,
  totalBottles
}: OrderTotalsBarProps) {
  if (selectedWinesCount === 0) return null;

  return (
    <div className="px-4 pt-2">
      <p className="text-xs text-center opacity-70" style={{ color: '#541111' }}>
        {selectedWinesCount} vini selezionati • {totalBottles} bottiglie totali
      </p>
    </div>
  );
}

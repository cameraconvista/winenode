import React, { memo } from 'react';

interface ThresholdInputsProps {
  sogliaMinima: string;
  setSogliaMinima: (soglia: string) => void;
  giacenza: string;
  setGiacenza: (giacenza: string) => void;
}

export const ThresholdInputs = memo(function ThresholdInputs({
  sogliaMinima,
  setSogliaMinima,
  giacenza,
  setGiacenza
}: ThresholdInputsProps) {
  return (
    <div className="flex gap-3 mb-4">
      <div className="flex-1">
        <div className="text-sm text-gray-400 mb-2">
          Soglia Minima
        </div>
        <input
          type="number"
          value={sogliaMinima}
          onChange={(e) => setSogliaMinima(e.target.value)}
          min="0"
          className="w-full p-3 border border-[#4a2a2a] text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{
            borderRadius: "12px",
            backgroundColor: "rgba(50, 0, 0, 0.6)"
          }}
          placeholder="2"
        />
      </div>
      <div className="flex-1">
        <div className="text-sm text-gray-400 mb-2">
          Giacenza
        </div>
        <input
          type="number"
          value={giacenza}
          onChange={(e) => setGiacenza(e.target.value)}
          min="0"
          className="w-full p-3 border border-[#4a2a2a] text-white bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{
            borderRadius: "12px",
            backgroundColor: "rgba(50, 0, 0, 0.6)"
          }}
          placeholder="0"
        />
      </div>
    </div>
  );
});

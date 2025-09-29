import React, { memo } from 'react';

interface TextInputAreaProps {
  testo: string;
  setTesto: (text: string) => void;
  conteggioRighe: number;
  onOttimizzaTesto: () => void;
}

export const TextInputArea = memo(function TextInputArea({
  testo,
  setTesto,
  conteggioRighe,
  onOttimizzaTesto
}: TextInputAreaProps) {
  return (
    <>
      <div className="mb-2">
        <div className="text-sm text-gray-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Incolla qui dentro la lista vini e clicca qui</span>
            <button
              onClick={onOttimizzaTesto}
              className="text-yellow-500 hover:text-yellow-600 inline-flex items-center"
              title="Ottimizza testo"
            >
              <svg 
                className="w-6 h-6" 
                viewBox="0 0 24 24" 
                fill="none"
              >
                <g>
                  {/* Stella grande centrale */}
                  <path 
                    d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z" 
                    fill="#FFD700" 
                    stroke="#FFA500" 
                    strokeWidth="0.5"
                  />
                  {/* Stella piccola in alto a destra */}
                  <path 
                    d="M18 5L18.5 6.5L20 7L18.5 7.5L18 9L17.5 7.5L16 7L17.5 6.5L18 5Z" 
                    fill="#FFD700"
                  />
                  {/* Stella piccola in basso a sinistra */}
                  <path 
                    d="M6 18L6.5 19.5L8 20L6.5 20.5L6 22L5.5 20.5L4 20L5.5 19.5L6 18Z" 
                    fill="#FFD700"
                  />
                </g>
              </svg>
              <span className="text-white font-bold">AI</span>
            </button>
          </div>
          <div className="text-green-400 text-sm mr-4">
            {conteggioRighe}
          </div>
        </div>
      </div>

      <div className="relative mb-4">
        <textarea
          id="elenco-vini"
          rows={10}
          placeholder="Es: Soave Classico DOC Inama, Veneto"
          className="text-sm border border-[#4a2a2a]"
          style={{
            borderRadius: "12px",
            padding: "12px",
            backgroundColor: "rgba(50, 0, 0, 0.6)",
            color: "white",
            width: "100%"
          }}
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
        />
      </div>
    </>
  );
});

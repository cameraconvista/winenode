import React, { useState } from 'react';
import { Eye, Check, Trash2, Plus, Minus } from 'lucide-react';
import { Ordine, OrdineDettaglio } from '../../contexts/OrdiniContext';

interface OrdineRicevutoCardProps {
  ordine: Ordine;
  onVisualizza: (ordineId: string) => void;
  onConfermaRicezione: (ordineId: string) => void;
  onElimina: (ordineId: string) => void;
  onAggiornaQuantita: (ordineId: string, dettagli: OrdineDettaglio[]) => void;
}

export default function OrdineRicevutoCard({
  ordine,
  onVisualizza,
  onConfermaRicezione,
  onElimina,
  onAggiornaQuantita
}: OrdineRicevutoCardProps) {
  const [dettagliModificati, setDettagliModificati] = useState<OrdineDettaglio[]>(
    ordine.dettagli || []
  );
  const [isModified, setIsModified] = useState(false);

  const handleQuantityChange = (index: number, delta: number) => {
    const nuoviDettagli = [...dettagliModificati];
    const nuovaQuantita = Math.max(0, nuoviDettagli[index].quantity + delta);
    
    nuoviDettagli[index] = {
      ...nuoviDettagli[index],
      quantity: nuovaQuantita,
      totalPrice: nuovaQuantita * nuoviDettagli[index].unitPrice
    };
    
    setDettagliModificati(nuoviDettagli);
    setIsModified(true);
    
    // Aggiorna immediatamente il context
    onAggiornaQuantita(ordine.id, nuoviDettagli);
  };

  const totalBottiglie = dettagliModificati.reduce((acc, item) => 
    acc + (item.quantity * (item.unit === 'cartoni' ? 6 : 1)), 0
  );

  const totalPrezzo = dettagliModificati.reduce((acc, item) => 
    acc + item.totalPrice, 0
  );

  return (
    <div
      className="p-4 rounded-lg border"
      style={{ background: '#fff2b8', borderColor: '#e2d6aa' }}
    >
      {/* Header con fornitore e badge */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏢</span>
          <h4 className="font-bold text-base" style={{ color: '#541111' }}>
            {ordine.fornitore}
          </h4>
        </div>
        <span 
          className="px-2 py-1 rounded text-xs font-medium"
          style={{ background: '#16a34a', color: '#fff9dc' }}
        >
          RICEVUTO
        </span>
      </div>

      {/* Dettagli ordine */}
      <div className="grid grid-cols-3 gap-4 mb-3 text-xs" style={{ color: '#7a4a30' }}>
        <div>
          <span className="block font-medium">📅 Ordinato:</span>
          <span>{ordine.data}</span>
        </div>
        <div>
          <span className="block font-medium">📦 Articoli:</span>
          <span>{totalBottiglie}</span>
        </div>
        <div>
          <span className="block font-medium">💰 Totale:</span>
          <span className="font-bold" style={{ color: '#16a34a' }}>
            €{totalPrezzo.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Lista vini modificabili */}
      {dettagliModificati.length > 0 && (
        <div className="mb-4 p-3 rounded border-t" style={{ borderColor: '#e2d6aa', background: '#ffeaa0' }}>
          <h5 className="text-xs font-medium mb-2" style={{ color: '#541111' }}>
            Modifica quantità ricevute:
          </h5>
          <div className="space-y-2">
            {dettagliModificati.map((dettaglio, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex-1">
                  <span className="font-medium" style={{ color: '#541111' }}>
                    {dettaglio.wineName}
                  </span>
                  <div style={{ color: '#7a4a30' }}>
                    {dettaglio.unit} - €{dettaglio.unitPrice.toFixed(2)} cad.
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(index, -1)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                    style={{ background: '#dc2626' }}
                    disabled={dettaglio.quantity <= 0}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  
                  <span 
                    className="px-2 py-1 rounded text-xs font-medium min-w-[40px] text-center"
                    style={{ background: 'white', color: '#541111', border: '1px solid #e2d6aa' }}
                  >
                    {dettaglio.quantity}
                  </span>
                  
                  <button
                    onClick={() => handleQuantityChange(index, 1)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                    style={{ background: '#16a34a' }}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pulsanti azione */}
      <div className="flex gap-2 pt-2 border-t" style={{ borderColor: '#e2d6aa' }}>
        <button
          onClick={() => onVisualizza(ordine.id)}
          className="flex items-center gap-1 px-3 py-2 rounded text-xs font-medium transition-colors"
          style={{ background: '#541111', color: '#fff9dc' }}
        >
          <Eye className="h-3 w-3" />
          Visualizza
        </button>
        <button
          onClick={() => onConfermaRicezione(ordine.id)}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded text-xs font-medium transition-colors"
          style={{ background: '#16a34a', color: '#fff9dc' }}
        >
          <Check className="h-3 w-3" />
          Conferma Ricezione
        </button>
        <button
          onClick={() => onElimina(ordine.id)}
          className="flex items-center gap-1 px-3 py-2 rounded text-xs font-medium transition-colors"
          style={{ background: '#dc2626', color: '#fff9dc' }}
        >
          <Trash2 className="h-3 w-3" />
          Elimina
        </button>
      </div>
    </div>
  );
}

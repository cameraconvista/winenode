import React from 'react';
import { OrdineDetail } from '../types';

interface OrdineDetailsListProps {
  ordineDetails: OrdineDetail[];
  totalOrdine: number;
  totalBottiglie: number;
}

export const OrdineDetailsList: React.FC<OrdineDetailsListProps> = ({
  ordineDetails,
  totalOrdine,
  totalBottiglie
}) => {
  if (ordineDetails.length === 0) {
    return (
      <div 
        className="p-4 rounded-lg text-center"
        style={{ background: '#541111', border: '1px solid #8b7355' }}
      >
        <p style={{ color: '#fff9dc' }}>Nessun vino selezionato</p>
      </div>
    );
  }

  return (
    <>
      {/* Lista Ordini */}
      <div className="mb-6">
        <div className="space-y-2" style={{ marginTop: '16px' }}>
          {ordineDetails.map((detail, index) => (
            <div
              key={`${detail.wineId}-${index}`}
              className="p-4 rounded-lg border"
              style={{ background: '#fff2b8', borderColor: '#e2d6aa' }}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm" style={{ color: '#541111' }}>
                    {detail.wine?.name || 'Vino non trovato'}
                  </h4>
                  <p className="text-xs" style={{ color: '#7a4a30' }}>
                    {detail.wine?.description} {detail.wine?.vintage && `(${detail.wine.vintage})`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium" style={{ color: '#541111' }}>
                    €{detail.totalPrice.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs" style={{ color: '#7a4a30' }}>
                <span>
                  {detail.quantity} {detail.unit} 
                  {detail.unit === 'cartoni' && ` (${detail.totalQuantityBottiglie} bottiglie)`}
                </span>
                <span>
                  €{detail.unitPrice.toFixed(2)} per bottiglia
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totale Ordine */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-lg font-semibold" style={{ color: '#541111' }}>
            Totale Ordine:
          </span>
          <span className="text-lg font-bold" style={{ color: '#541111' }}>
            €{totalOrdine.toFixed(2)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-base" style={{ color: '#7a4a30' }}>
            Totale Bottiglie:
          </span>
          <span className="text-base font-medium" style={{ color: '#7a4a30' }}>
            {totalBottiglie}
          </span>
        </div>
      </div>
    </>
  );
};

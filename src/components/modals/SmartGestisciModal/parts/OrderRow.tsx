import React from 'react';
import { DettaglioOrdine } from '../types';

interface OrderRowProps {
  dettaglio: DettaglioOrdine;
  index: number;
  currentQuantity: number;
  producer: string | null;
  onQuantityClick: (index: number) => void;
}

export function OrderRow({ dettaglio, index, currentQuantity, producer, onQuantityClick }: OrderRowProps) {
  return (
    <div className="rounded-lg border py-3 px-4" style={{ background: '#fff2b8', borderColor: '#e2d6aa' }}>
      {/* Layout: titolo a sinistra, quantità a destra */}
      <div className="flex items-start justify-between">
        {/* Nome vino + produttore */}
        <div className="flex-1 pr-3">
          <h4 className="font-medium text-sm leading-tight" 
              style={{ 
                color: '#541111',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
            {dettaglio.wineName}
          </h4>
          {producer && (
            <p className="text-xs mt-1" style={{ color: '#7a4a30' }}>
              {producer}
            </p>
          )}
        </div>
        
        {/* Box quantità a destra - più compatto */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div
            onClick={() => onQuantityClick(index)}
            className="px-3 py-2 rounded border cursor-pointer transition-all duration-200 hover:bg-gray-50"
            style={{ 
              borderColor: '#e2d6aa',
              background: 'white',
              minWidth: '44px',
              minHeight: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span className="text-base font-bold" style={{ color: '#541111' }}>
              {currentQuantity}
            </span>
          </div>
          <span className="text-xs mt-1" style={{ color: '#7a4a30' }}>
            {dettaglio.unit}
          </span>
        </div>
      </div>
    </div>
  );
}

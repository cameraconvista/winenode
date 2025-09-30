import React from 'react';
import { DettaglioOrdine } from '../types';
import { OrderRow } from './OrderRow';

interface OrderListProps {
  dettagli: DettaglioOrdine[];
  modifiedQuantities: Record<number, number>;
  getWineProducer: (wineName: string) => string | null;
  onQuantityClick: (index: number) => void;
}

export function OrderList({ dettagli, modifiedQuantities, getWineProducer, onQuantityClick }: OrderListProps) {
  return (
    <main className="mobile-content">
      <div className="wine-list-container"
        style={{
          height: '100%',
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'none',
          touchAction: 'pan-y',
          scrollBehavior: 'smooth',
          paddingTop: 'calc(var(--header-height, 88px) + 20px)'
        }}
      >
        {/* Lista righe scrollabile */}
        <div className="px-3 py-4 space-y-2" style={{ 
          paddingBottom: 'calc(140px + env(safe-area-inset-bottom, 0px))' // Spazio per footer + navbar
        }}>
          {dettagli.map((dettaglio, index) => {
            const currentQuantity = modifiedQuantities[index] ?? dettaglio.quantity;
            const producer = getWineProducer(dettaglio.wineName);
            
            return (
              <OrderRow
                key={index}
                dettaglio={dettaglio}
                index={index}
                currentQuantity={currentQuantity}
                producer={producer}
                onQuantityClick={onQuantityClick}
              />
            );
          })}
        </div>
      </div>
    </main>
  );
}

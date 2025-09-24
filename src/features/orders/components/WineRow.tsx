import React from 'react';
import { Bell } from 'lucide-react';
import QuantityControl from './QuantityControl';
import { useWineRowData } from '../hooks/useWineRowData';

interface Wine {
  id: string | number;
  name: string;
  description?: string;
  vintage?: string;
  inventory: number;
  minStock: number;
}

interface WineRowProps {
  wine: Wine;
}

export default function WineRow({ wine }: WineRowProps) {
  const wineId = React.useMemo(() => Number(wine.id), [wine.id]);
  const { quantity, unit, handleQuantityChange, handleUnitChange } = useWineRowData(wineId);
  const isLowStock = wine.inventory <= wine.minStock;

  return (
    <div
      className="p-4 rounded-lg"
      style={{
        background: isLowStock ? '#fef2f2' : '#fff3bf',
        border: `1px solid ${isLowStock ? '#fca5a5' : 'rgba(84, 17, 17, 0.2)'}`,
        borderLeft: `4px solid ${isLowStock ? '#ef4444' : '#f59e0b'}`
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-base" style={{ color: '#541111' }}>
            {wine.name}
          </h4>
          {wine.description && (
            <p className="text-sm opacity-80" style={{ color: '#541111' }}>
              {wine.description} {wine.vintage && `(${wine.vintage})`}
            </p>
          )}
        </div>
        
        <div className="text-right ml-4">
          <p className={`text-sm font-bold`} style={{ 
            color: isLowStock ? '#dc2626' : '#541111' 
          }}>
            Giacenza: {wine.inventory}
          </p>
          {isLowStock && (
            <div className="flex items-center gap-1 mt-1">
              <Bell className="h-3 w-3 text-red-600" />
              <span className="text-xs text-red-600">Sotto soglia</span>
            </div>
          )}
        </div>
      </div>

      <QuantityControl
        quantity={quantity}
        mode={unit}
        onQuantityChange={handleQuantityChange}
        onModeChange={handleUnitChange}
      />
    </div>
  );
}

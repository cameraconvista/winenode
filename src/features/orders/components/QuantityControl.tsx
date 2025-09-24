import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface QuantityControlProps {
  quantity: number;
  mode: 'bottiglie' | 'cartoni';
  onQuantityChange: (delta: number) => void;
  onModeChange: (mode: 'bottiglie' | 'cartoni') => void;
}

export default function QuantityControl({
  quantity,
  mode,
  onQuantityChange,
  onModeChange
}: QuantityControlProps) {
  const displayQuantity = mode === 'cartoni' ? Math.floor(quantity / 6) : quantity;

  return (
    <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'rgba(84, 17, 17, 0.1)' }}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onQuantityChange(-1)}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
          style={{ 
            minWidth: '44px', 
            minHeight: '44px',
            width: '44px',
            height: '44px'
          }}
          aria-label="Diminuisci quantità"
        >
          <Minus className="h-4 w-4" />
        </button>
        
        <div className="text-center min-w-16">
          <div className="text-lg font-bold" style={{ color: '#541111' }}>
            {displayQuantity}
          </div>
          <div className="text-xs opacity-70" style={{ color: '#541111' }}>
            {mode === 'cartoni' ? 'cartoni' : 'bottiglie'}
          </div>
        </div>
        
        <button
          onClick={() => onQuantityChange(1)}
          className="bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors"
          style={{ 
            minWidth: '44px', 
            minHeight: '44px',
            width: '44px',
            height: '44px'
          }}
          aria-label="Aumenta quantità"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Toggle bottiglie/cartoni */}
      <div 
        className="flex rounded-lg p-1" 
        style={{ background: 'rgba(84, 17, 17, 0.1)' }}
        role="radiogroup"
        aria-label="Unità di misura"
      >
        <button
          onClick={() => onModeChange('bottiglie')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors`}
          style={{
            background: mode === 'bottiglie' ? '#541111' : 'transparent',
            color: mode === 'bottiglie' ? '#fff9dc' : '#541111'
          }}
          aria-pressed={mode === 'bottiglie'}
          role="radio"
          aria-checked={mode === 'bottiglie'}
        >
          Bottiglie
        </button>
        <button
          onClick={() => onModeChange('cartoni')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors`}
          style={{
            background: mode === 'cartoni' ? '#541111' : 'transparent',
            color: mode === 'cartoni' ? '#fff9dc' : '#541111'
          }}
          aria-pressed={mode === 'cartoni'}
          role="radio"
          aria-checked={mode === 'cartoni'}
        >
          Cartoni
        </button>
      </div>
    </div>
  );
}

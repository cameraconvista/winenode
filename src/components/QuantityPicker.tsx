import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';

interface QuantityPickerProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export default function QuantityPicker({
  value,
  onChange,
  min = 0,
  max = 999,
  disabled = false
}: QuantityPickerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startValueRef = useRef(value);

  // Genera array di valori visibili (3 sopra e 3 sotto il valore corrente)
  const visibleValues = Array.from({ length: 7 }, (_, i) => {
    const val = value - 3 + i;
    return Math.max(min, Math.min(max, val));
  });

  // Gestione touch/mouse events
  const handleStart = (clientY: number) => {
    if (disabled) return;
    setIsDragging(true);
    startYRef.current = clientY;
    startValueRef.current = value;
  };

  const handleMove = useCallback((clientY: number) => {
    if (!isDragging || disabled) return;

    const deltaY = startYRef.current - clientY;
    const steps = Math.round(deltaY / 30); // 30px per step (più compatto per inline)
    const newValue = Math.max(min, Math.min(max, startValueRef.current + steps));
    
    if (newValue !== value) {
      onChange(newValue);
    }
  }, [isDragging, disabled, min, max, value, onChange]);

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Event handlers per mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientY);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientY);
  }, [handleMove]);

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, []);

  // Event handlers per touch
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handleStart(e.touches[0].clientY);
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientY);
  }, [handleMove]);

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, []);

  // Aggiungi/rimuovi event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const handleIncrement = () => {
    if (disabled || value >= max) return;
    onChange(Math.min(max, value + 1));
  };

  const handleDecrement = () => {
    if (disabled || value <= min) return;
    onChange(Math.max(min, value - 1));
  };

  return (
    <div className="flex items-center gap-2">
      {/* Pulsante decremento */}
      <button
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs transition-colors"
        style={{ 
          background: disabled || value <= min ? '#ccc' : '#dc2626',
          cursor: disabled || value <= min ? 'not-allowed' : 'pointer'
        }}
      >
        <Minus className="h-3 w-3" />
      </button>

      {/* Picker wheel compatto */}
      <div
        ref={pickerRef}
        className="relative h-20 w-16 flex items-center justify-center cursor-grab select-none overflow-hidden"
        style={{ 
          touchAction: 'none',
          background: 'white',
          border: '1px solid #e2d6aa',
          borderRadius: '4px'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {visibleValues.map((val, index) => {
            const isCenter = index === 3; // Centro dell'array (7 elementi, centro = indice 3)
            return (
              <div
                key={`${val}-${index}`}
                className="flex items-center justify-center text-xs font-medium transition-all duration-200"
                style={{
                  height: '20px',
                  color: isCenter ? '#541111' : '#7a4a30',
                  fontSize: isCenter ? '14px' : '12px',
                  fontWeight: isCenter ? 'bold' : 'normal',
                  opacity: isCenter ? 1 : 0.6,
                  transform: isCenter ? 'scale(1.1)' : 'scale(1)'
                }}
              >
                {val}
              </div>
            );
          })}
        </div>

        {/* Indicatore centrale */}
        <div 
          className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 border-t border-b pointer-events-none"
          style={{ 
            borderColor: '#d4a300',
            height: '20px',
            background: 'rgba(212, 163, 0, 0.1)'
          }}
        />
      </div>

      {/* Pulsante incremento */}
      <button
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs transition-colors"
        style={{ 
          background: disabled || value >= max ? '#ccc' : '#16a34a',
          cursor: disabled || value >= max ? 'not-allowed' : 'pointer'
        }}
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

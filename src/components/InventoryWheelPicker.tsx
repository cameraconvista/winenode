import { useState, useRef, useEffect, useCallback } from 'react';

interface InventoryWheelPickerProps {
  value: number;
  onValueChange: (value: number) => void;
  onClose: () => void;
  min?: number;
  max?: number;
  isActive: boolean;
  isAnimating?: boolean;
}

export default function InventoryWheelPicker({
  value,
  onValueChange,
  onClose,
  min = 0,
  max = 999,
  isActive,
  isAnimating = false
}: InventoryWheelPickerProps) {
  const [currentValue, setCurrentValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startValueRef = useRef(value);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Genera array di valori visibili (5 sopra e 5 sotto il valore corrente)
  const visibleValues = Array.from({ length: 11 }, (_, i) => {
    const val = currentValue - 5 + i;
    return Math.max(min, Math.min(max, val));
  });

  // Debounced update per sync backend
  const debouncedUpdate = useCallback((newValue: number) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      onValueChange(newValue);
    }, 250);
  }, [onValueChange]);

  // Gestione touch/mouse events
  const handleStart = (clientY: number) => {
    setIsDragging(true);
    startYRef.current = clientY;
    startValueRef.current = currentValue;
  };

  const handleMove = (clientY: number) => {
    if (!isDragging) return;

    const deltaY = startYRef.current - clientY;
    const steps = Math.round(deltaY / 30); // 30px per step
    const newValue = Math.max(min, Math.min(max, startValueRef.current + steps));
    
    if (newValue !== currentValue) {
      setCurrentValue(newValue);
      debouncedUpdate(newValue);
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleMove(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleEnd();
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleStart(e.clientY);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientY);
  }, [isDragging, currentValue]);

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, []);

  // Global mouse events quando si sta dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Click fuori per chiudere
  useEffect(() => {
    if (!isActive) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isActive, onClose]);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  if (!isActive) {
    // Stato inattivo: mostra solo il numero
    return (
      <span 
        className={`text-app-text font-bold text-sm sm:text-base cursor-pointer min-w-[44px] text-center py-2 px-2 transition-all duration-200 ${
          isAnimating ? 'animate-pulse bg-app-warn/20 rounded' : ''
        }`}
        style={{ minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {value || 0}
      </span>
    );
  }

  // Stato attivo: mostra il wheel picker
  return (
    <div
      ref={containerRef}
      className="relative min-w-[44px] h-[44px] flex items-center justify-center cursor-grab select-none"
      style={{ 
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      aria-label={`Giacenza, valore ${currentValue}`}
      role="spinbutton"
      aria-valuenow={currentValue}
      aria-valuemin={min}
      aria-valuemax={max}
    >
      {/* Overlay semitrasparenti sopra e sotto */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[14px] bg-gradient-to-b from-white/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-[14px] bg-gradient-to-t from-white/80 to-transparent"></div>
      </div>

      {/* Slot centrale evidenziato */}
      <div className="absolute top-1/2 left-0 right-0 h-[16px] -translate-y-1/2 bg-app-accent/10 border-y border-app-accent/20"></div>

      {/* Lista valori scrollabile */}
      <div className="flex flex-col items-center justify-center h-full overflow-hidden">
        {visibleValues.map((val, index) => {
          const isCenter = index === 5; // Elemento centrale
          const opacity = isCenter ? 1 : Math.max(0.3, 1 - Math.abs(index - 5) * 0.2);
          
          return (
            <div
              key={`${val}-${index}`}
              className={`text-center transition-all duration-100 ${
                isCenter ? 'text-app-text font-bold' : 'text-app-muted font-normal'
              }`}
              style={{
                opacity,
                fontSize: isCenter ? '14px' : '12px',
                lineHeight: '16px',
                transform: `scale(${isCenter ? 1 : 0.9})`
              }}
            >
              {val}
            </div>
          );
        })}
      </div>
    </div>
  );
}

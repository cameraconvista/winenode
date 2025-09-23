import { useState, useRef, useEffect, useCallback } from 'react';

interface InventoryModalProps {
  isOpen: boolean;
  initialValue: number;
  onConfirm: (value: number) => void;
  onCancel: () => void;
  min?: number;
  max?: number;
}

export default function InventoryModal({
  isOpen,
  initialValue,
  onConfirm,
  onCancel,
  min = 0,
  max = 999
}: InventoryModalProps) {
  const [currentValue, setCurrentValue] = useState(initialValue);
  const [isDragging, setIsDragging] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startValueRef = useRef(initialValue);

  // Reset valore quando si apre la modale
  useEffect(() => {
    if (isOpen) {
      setCurrentValue(initialValue);
    }
  }, [isOpen, initialValue]);

  // Genera array di valori visibili (7 sopra e 7 sotto il valore corrente)
  const visibleValues = Array.from({ length: 15 }, (_, i) => {
    const val = currentValue - 7 + i;
    return Math.max(min, Math.min(max, val));
  });

  // Gestione touch/mouse events
  const handleStart = (clientY: number) => {
    setIsDragging(true);
    startYRef.current = clientY;
    startValueRef.current = currentValue;
  };

  const handleMove = (clientY: number) => {
    if (!isDragging) return;

    const deltaY = startYRef.current - clientY;
    const steps = Math.round(deltaY / 40); // 40px per step (più ampio per modale)
    const newValue = Math.max(min, Math.min(max, startValueRef.current + steps));
    
    if (newValue !== currentValue) {
      setCurrentValue(newValue);
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

  // Blocca scroll del body quando la modale è aperta
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Gestione ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay scuro */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modale centrata */}
      <div className="relative bg-white rounded-2xl shadow-2xl mx-4 w-full max-w-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 text-center">
            Modifica giacenza
          </h3>
        </div>

        {/* Picker area */}
        <div className="px-6 py-8">
          <div
            ref={pickerRef}
            className="relative h-64 flex items-center justify-center cursor-grab select-none"
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
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white via-white/80 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
            </div>

            {/* Slot centrale evidenziato */}
            <div className="absolute top-1/2 left-4 right-4 h-12 -translate-y-1/2 bg-blue-50 border-y-2 border-blue-200 rounded-lg"></div>

            {/* Lista valori scrollabile */}
            <div className="flex flex-col items-center justify-center h-full overflow-hidden">
              {visibleValues.map((val, index) => {
                const isCenter = index === 7; // Elemento centrale
                const distance = Math.abs(index - 7);
                const opacity = isCenter ? 1 : Math.max(0.2, 1 - distance * 0.15);
                const scale = isCenter ? 1 : Math.max(0.7, 1 - distance * 0.05);
                
                return (
                  <div
                    key={`${val}-${index}`}
                    className={`text-center transition-all duration-150 ${
                      isCenter ? 'text-gray-900 font-bold' : 'text-gray-400 font-normal'
                    }`}
                    style={{
                      opacity,
                      fontSize: isCenter ? '32px' : '24px',
                      lineHeight: '40px',
                      transform: `scale(${scale})`,
                      height: '40px'
                    }}
                  >
                    {val}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pulsanti */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={() => onConfirm(currentValue)}
            className="flex-1 px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors"
          >
            Conferma
          </button>
        </div>
      </div>
    </div>
  );
}

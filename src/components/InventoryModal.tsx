import { useState, useRef, useEffect, useCallback } from 'react';
import { isFeatureEnabled } from '../config/featureFlags';
import { ORDINI_LABELS } from '../constants/ordiniLabels';

interface InventoryModalProps {
  isOpen: boolean;
  initialValue: number;
  onConfirm: (value: number) => void;
  onCancel: () => void;
  min?: number;
  max?: number;
  originalValue?: number; // Valore originario da evidenziare in rosso
  useFullScreen?: boolean; // Per distinguere Home (piccolo) da Gestisci Ordini (full-screen)
}

export default function InventoryModal({
  isOpen,
  initialValue,
  onConfirm,
  onCancel,
  min = 0,
  max = 999,
  originalValue,
  useFullScreen = false
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

  // Genera array di valori visibili
  const visibleValues = (() => {
    if (isFeatureEnabled('QTY_PICKER_0_100')) {
      // Range fisso 0-100: mostra 7 sopra e 7 sotto il valore corrente
      return Array.from({ length: 15 }, (_, i) => {
        const val = currentValue - 7 + i;
        return Math.max(0, Math.min(100, val));
      });
    } else {
      // Range dinamico originale: usa min/max passati come props
      return Array.from({ length: 15 }, (_, i) => {
        const val = currentValue - 7 + i;
        return Math.max(min, Math.min(max, val));
      });
    }
  })();

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
    
    let newValue;
    if (isFeatureEnabled('QTY_PICKER_0_100')) {
      // Range fisso 0-100
      newValue = Math.max(0, Math.min(100, startValueRef.current + steps));
    } else {
      // Range dinamico originale
      newValue = Math.max(min, Math.min(max, startValueRef.current + steps));
    }
    
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
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header full-screen come Home */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#e2d6aa', background: '#fff9dc' }}>
        {/* Logo WineNode */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#d4a300' }}>
            <span className="text-sm font-bold" style={{ color: '#541111' }}>W</span>
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#541111' }}>
              {ORDINI_LABELS.qtyModal.header.title}
            </h1>
            <p className="text-xs" style={{ color: '#7a4a30' }}>
              {ORDINI_LABELS.qtyModal.header.subtitle}
            </p>
          </div>
        </div>
        
        {/* Pulsante chiusura */}
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
          style={{ color: '#7a4a30' }}
        >
          ✕
        </button>
      </div>

      {/* Picker area */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
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
          <div className="absolute top-1/2 left-4 right-4 h-12 -translate-y-1/2 rounded-lg" style={{ 
            background: 'rgba(212, 163, 0, 0.1)', 
            borderTop: '2px solid #d4a300', 
            borderBottom: '2px solid #d4a300' 
          }}></div>

          {/* Lista valori scrollabile */}
          <div className="flex flex-col items-center justify-center h-full overflow-hidden">
            {visibleValues.map((val, index) => {
              const isCenter = index === 7; // Elemento centrale
              const distance = Math.abs(index - 7);
              const opacity = isCenter ? 1 : Math.max(0.2, 1 - distance * 0.15);
              const scale = isCenter ? 1 : Math.max(0.7, 1 - distance * 0.05);
              const isOriginalValue = originalValue !== undefined && val === originalValue;
              
              return (
                <div
                  key={`${val}-${index}`}
                  className={`text-center transition-all duration-150 ${
                    isCenter ? 'font-bold' : 'font-normal'
                  }`}
                  style={{
                    opacity,
                    fontSize: isCenter ? '32px' : '24px',
                    lineHeight: '40px',
                    transform: `scale(${scale})`,
                    height: '40px',
                    color: isOriginalValue ? '#dc2626' : (isCenter ? '#541111' : '#7a4a30')
                  }}
                >
                  {val}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pulsanti fissi in basso */}
      <div className="p-6 border-t flex gap-3" style={{ borderColor: '#e2d6aa' }}>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 rounded-xl font-medium transition-colors"
          style={{ 
            background: '#6b7280', 
            color: '#fff9dc' 
          }}
        >
          Annulla
        </button>
        
        <button
          onClick={() => onConfirm(currentValue)}
          className="flex-1 px-4 py-3 rounded-xl font-medium transition-colors"
          style={{ 
            background: '#16a34a', 
            color: '#fff9dc' 
          }}
        >
          Conferma
        </button>
      </div>
    </div>
  );
}

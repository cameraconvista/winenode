import React from 'react';
import { Delete, Check } from 'lucide-react';

interface PinPadProps {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  canSubmit?: boolean;
  isValidPin?: boolean;
}

export default function PinPad({ 
  onDigit, 
  onDelete, 
  onSubmit, 
  disabled = false,
  canSubmit = false,
  isValidPin = false
}: PinPadProps) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto p-4">
      {/* Digits 1-9 */}
      {digits.slice(0, 9).map((digit) => (
        <button
          key={digit}
          type="button"
          onClick={() => onDigit(digit)}
          disabled={disabled}
          className="h-14 w-14 rounded-full border-2 font-bold text-xl transition-all duration-150 active:scale-98 active:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center touch-manipulation"
          style={{
            backgroundColor: '#fff9dc',
            color: '#541111',
            borderColor: 'rgba(84, 17, 17, 0.4)',
            fontSize: '18px',
            minHeight: '56px',
            minWidth: '56px'
          }}
          aria-label={`Numero ${digit}`}
        >
          {digit}
        </button>
      ))}
      
      {/* Bottom row: Delete, 0, Submit */}
      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        className="h-14 w-14 rounded-full border-2 font-bold text-xl transition-all duration-150 active:scale-98 active:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center touch-manipulation"
        style={{
          backgroundColor: '#fff9dc',
          color: '#541111',
          borderColor: 'rgba(84, 17, 17, 0.4)',
          fontSize: '18px',
          minHeight: '56px',
          minWidth: '56px'
        }}
        aria-label="Cancella"
      >
        C
      </button>
      
      <button
        type="button"
        onClick={() => onDigit('0')}
        disabled={disabled}
        className="h-14 w-14 rounded-full border-2 font-bold text-xl transition-all duration-150 active:scale-98 active:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center touch-manipulation"
        style={{
          backgroundColor: '#fff9dc',
          color: '#541111',
          borderColor: 'rgba(84, 17, 17, 0.4)',
          fontSize: '18px',
          minHeight: '56px',
          minWidth: '56px'
        }}
        aria-label="Numero 0"
      >
        0
      </button>
      
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || !canSubmit}
        className="h-14 w-14 rounded-full border-2 font-bold transition-all duration-150 active:scale-98 active:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center touch-manipulation"
        style={{
          backgroundColor: isValidPin && canSubmit && !disabled ? '#22c55e' : '#fff9dc',
          color: isValidPin && canSubmit && !disabled ? '#ffffff' : '#541111',
          borderColor: isValidPin && canSubmit && !disabled ? '#16a34a' : 'rgba(84, 17, 17, 0.4)',
          minHeight: '56px',
          minWidth: '56px'
        }}
        aria-label="Conferma PIN"
        aria-disabled={disabled || !canSubmit}
      >
        <Check size={20} />
      </button>
    </div>
  );
}

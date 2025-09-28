import React from 'react';
import { Delete, Check } from 'lucide-react';

interface PinPadProps {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  canSubmit?: boolean;
}

export default function PinPad({ 
  onDigit, 
  onDelete, 
  onSubmit, 
  disabled = false,
  canSubmit = false 
}: PinPadProps) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
      {/* Digits 1-9 */}
      {digits.slice(0, 9).map((digit) => (
        <button
          key={digit}
          onClick={() => onDigit(digit)}
          disabled={disabled}
          className="h-12 w-12 rounded-lg border border-opacity-30 font-semibold text-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: '#fff9dc',
            color: '#541111',
            borderColor: 'rgba(84, 17, 17, 0.3)'
          }}
        >
          {digit}
        </button>
      ))}
      
      {/* Bottom row: Delete, 0, Submit */}
      <button
        onClick={onDelete}
        disabled={disabled}
        className="h-12 w-12 rounded-lg border border-opacity-30 font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        style={{
          backgroundColor: '#fff9dc',
          color: '#541111',
          borderColor: 'rgba(84, 17, 17, 0.3)'
        }}
      >
        <Delete size={18} />
      </button>
      
      <button
        onClick={() => onDigit('0')}
        disabled={disabled}
        className="h-12 w-12 rounded-lg border border-opacity-30 font-semibold text-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: '#fff9dc',
          color: '#541111',
          borderColor: 'rgba(84, 17, 17, 0.3)'
        }}
      >
        0
      </button>
      
      <button
        onClick={onSubmit}
        disabled={disabled || !canSubmit}
        className="h-12 w-12 rounded-lg border border-opacity-30 font-semibold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        style={{
          backgroundColor: canSubmit && !disabled ? '#541111' : '#fff9dc',
          color: canSubmit && !disabled ? '#fff9dc' : '#541111',
          borderColor: 'rgba(84, 17, 17, 0.3)'
        }}
      >
        <Check size={18} />
      </button>
    </div>
  );
}

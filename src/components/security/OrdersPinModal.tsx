import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import PinPad from './PinPad';

interface OrdersPinModalProps {
  open: boolean;
  onClose: () => void;
  onValidPin: () => void;
  onInvalidPin: () => void;
  validatePin: (pin: string) => boolean;
  isLocked: boolean;
  lockoutCountdown: number;
  attempts: number;
}

export default function OrdersPinModal({
  open,
  onClose,
  onValidPin,
  onInvalidPin,
  validatePin,
  isLocked,
  lockoutCountdown,
  attempts
}: OrdersPinModalProps) {
  const [pinBuffer, setPinBuffer] = useState('');
  const [showError, setShowError] = useState(false);

  // Reset buffer quando il modale si apre/chiude
  useEffect(() => {
    if (open) {
      setPinBuffer('');
      setShowError(false);
    }
  }, [open]);

  // Focus trap e ESC handler
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  const handleDigit = (digit: string) => {
    if (pinBuffer.length < 4) {
      setPinBuffer(prev => prev + digit);
    }
  };

  const handleDelete = () => {
    setPinBuffer(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (pinBuffer.length === 4) {
      const isValid = validatePin(pinBuffer);
      if (isValid) {
        onValidPin();
      } else {
        setShowError(true);
        setPinBuffer('');
        onInvalidPin();
        
        // Rimuovi errore dopo 2 secondi
        setTimeout(() => setShowError(false), 2000);
      }
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-modal-title"
    >
      <div 
        className="w-full max-w-md mx-4 rounded-lg shadow-lg p-6"
        style={{ backgroundColor: '#541111' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 
            id="pin-modal-title"
            className="text-xl font-bold"
            style={{ color: '#fff9dc' }}
          >
            Accesso Ordini
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors hover:bg-opacity-20 hover:bg-white"
            aria-label="Chiudi"
          >
            <X size={24} style={{ color: '#fff9dc' }} />
          </button>
        </div>

        {/* PIN Display */}
        <div className="mb-6">
          <div className="text-center mb-4">
            <p className="text-sm mb-2" style={{ color: '#fff9dc' }}>
              Inserisci il PIN per accedere agli ordini
            </p>
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded-full border-2"
                  style={{
                    backgroundColor: index < pinBuffer.length ? '#fff9dc' : 'transparent',
                    borderColor: '#fff9dc'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {showError && (
            <div 
              className={`text-center text-sm mb-2 transition-all duration-300 ${
                showError ? 'animate-pulse' : ''
              }`}
              style={{ color: '#ff6b6b' }}
            >
              PIN errato. Tentativi: {attempts}/3
            </div>
          )}

          {/* Lockout Message */}
          {isLocked && (
            <div className="text-center text-sm mb-2" style={{ color: '#ff6b6b' }}>
              Troppi tentativi. Riprova tra {lockoutCountdown}s
            </div>
          )}
        </div>

        {/* PIN Pad */}
        <PinPad
          onDigit={handleDigit}
          onDelete={handleDelete}
          onSubmit={handleSubmit}
          disabled={isLocked}
          canSubmit={pinBuffer.length === 4}
        />

        {/* Info */}
        <div className="mt-4 text-center">
          <p className="text-xs opacity-70" style={{ color: '#fff9dc' }}>
            Premi ESC o clicca fuori per chiudere
          </p>
        </div>
      </div>
    </div>
  );
}

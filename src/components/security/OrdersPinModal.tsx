import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import PinPad from './PinPad';
import './PinModal.css';

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

  // Focus trap, ESC handler e body scroll lock
  useEffect(() => {
    if (!open) return;

    // Lock body scroll
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = originalStyle;
    };
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 pin-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-modal-title"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingTop: 'env(safe-area-inset-top)'
      }}
    >
      <div 
        className="w-full max-w-sm mx-auto rounded-2xl shadow-2xl p-6 relative"
        style={{ 
          backgroundColor: '#541111',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
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
            type="button"
            onClick={onClose}
            className="p-2 rounded-full transition-colors hover:bg-opacity-20 hover:bg-white touch-manipulation"
            style={{ minHeight: '44px', minWidth: '44px' }}
            aria-label="Chiudi"
          >
            <X size={24} style={{ color: '#fff9dc' }} />
          </button>
        </div>

        {/* PIN Display */}
        <div className="mb-6">
          <div className="text-center mb-4">
            <p className="text-base mb-4" style={{ color: '#fff9dc', fontSize: '16px' }}>
              Inserisci il PIN per accedere agli ordini
            </p>
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                    showError ? 'animate-pulse' : ''
                  }`}
                  style={{
                    backgroundColor: index < pinBuffer.length ? '#fff9dc' : 'transparent',
                    borderColor: '#fff9dc',
                    transform: showError ? 'scale(1.1)' : 'scale(1)'
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
        <div className="mt-6 text-center">
          <p className="text-sm opacity-70" style={{ color: '#fff9dc', fontSize: '14px' }}>
            Premi ESC o clicca fuori per chiudere
          </p>
        </div>
      </div>
    </div>
  );
}

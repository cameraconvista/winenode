import React, { useState } from 'react';
import { MessageCircle, Copy, X } from 'lucide-react';
import { buildWhatsAppMessage, buildWhatsAppUrl, buildWhatsAppMobileUrl, buildWhatsAppWebUrl, OrderDetail } from '../../utils/buildWhatsAppMessage';

interface WhatsAppOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderDetails: OrderDetail[];
  supplierName?: string;
}

export default function WhatsAppOrderModal({
  isOpen,
  onClose,
  orderDetails,
  supplierName
}: WhatsAppOrderModalProps) {
  // ✅ TUTTI GLI HOOK A TOP-LEVEL - SEMPRE CHIAMATI NELLO STESSO ORDINE
  const [copySuccess, setCopySuccess] = useState(false);

  // Genera il messaggio WhatsApp (sempre, anche se modale chiusa)
  const message = buildWhatsAppMessage(orderDetails);

  // Handler per apertura WhatsApp - Mobile First
  const handleOpenWhatsApp = () => {
    const mobileUrl = buildWhatsAppMobileUrl(message);
    const waUrl = buildWhatsAppUrl(message);
    const webUrl = buildWhatsAppWebUrl(message);
    
    // Sequenza mobile-first con fallback
    try {
      // 1. Prova app mobile nativa (iOS/Android)
      window.open(mobileUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      try {
        // 2. Fallback wa.me (universale)
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      } catch (fallbackError) {
        try {
          // 3. Fallback web WhatsApp (desktop)
          window.open(webUrl, '_blank', 'noopener,noreferrer');
        } catch (webError) {
          console.warn('Impossibile aprire WhatsApp:', error, fallbackError, webError);
        }
      }
    }
    
    // Log success dopo apertura (non bloccante)
    setTimeout(() => {
      console.log('✅ WhatsApp aperto con messaggio precompilato');
    }, 0);
  };

  // Handler per copia testo
  const handleCopyText = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message);
      } else {
        // Fallback per browser non supportati
        const textArea = document.createElement('textarea');
        textArea.value = message;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.warn('Impossibile copiare il testo:', error);
    }
  };

  // ✅ Hook ESC SEMPRE CHIAMATO - Guard interna per attivazione
  React.useEffect(() => {
    // Guard interna: attiva solo quando modale è aperta
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // ✅ RENDER CONDIZIONALE DOPO TUTTI GLI HOOK
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div 
        className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
        style={{ 
          background: '#fff9dc',
          borderColor: '#e2d6aa'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center gap-3 p-6 border-b"
          style={{ borderColor: '#e2d6aa' }}
        >
          <MessageCircle 
            className="h-6 w-6" 
            style={{ color: '#541111' }}
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold" style={{ color: '#541111' }}>
              Invia ordine via WhatsApp
            </h3>
            {supplierName && (
              <p className="text-sm" style={{ color: '#7a4a30' }}>
                Fornitore: {supplierName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors hover:bg-black/5"
          >
            <X className="h-5 w-5" style={{ color: '#7a4a30' }} />
          </button>
        </div>

        {/* Body - Preview Messaggio */}
        <div className="p-6">
          <label className="block text-sm font-medium mb-2" style={{ color: '#541111' }}>
            Anteprima messaggio:
          </label>
          <textarea
            value={message}
            readOnly
            className="w-full h-40 p-3 border rounded-lg resize-none font-mono text-sm"
            style={{
              background: 'white',
              borderColor: '#e2d6aa',
              color: '#541111'
            }}
          />
          <p className="text-xs mt-2" style={{ color: '#7a4a30' }}>
            Il messaggio non include prezzi. Potrai scegliere il destinatario in WhatsApp.
          </p>
        </div>

        {/* Footer - Pulsanti */}
        <div 
          className="p-6 border-t flex flex-col gap-3"
          style={{ borderColor: '#e2d6aa' }}
        >
          {/* Pulsante Apri WhatsApp */}
          <button
            onClick={handleOpenWhatsApp}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors"
            style={{ 
              background: '#16a34a', 
              color: '#fff9dc',
              minHeight: '44px'
            }}
          >
            <MessageCircle className="h-4 w-4" />
            Apri WhatsApp
          </button>
          
          <div className="flex gap-3">
            {/* Pulsante Copia Testo */}
            <button
              onClick={handleCopyText}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors"
              style={{ 
                background: 'white', 
                color: '#541111',
                border: '1px solid #e2d6aa',
                minHeight: '44px'
              }}
            >
              <Copy className="h-4 w-4" />
              {copySuccess ? 'Copiato!' : 'Copia testo'}
            </button>
            
            {/* Pulsante Annulla */}
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center px-4 py-2 rounded-xl font-medium transition-colors"
              style={{ 
                background: 'white', 
                color: '#7a4a30',
                border: '1px solid #e2d6aa',
                minHeight: '44px'
              }}
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

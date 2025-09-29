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
  const handleOpenWhatsApp = async () => {
    console.log('🔄 Tentativo apertura WhatsApp...');
    console.log('📝 Messaggio:', message);
    
    const mobileUrl = buildWhatsAppMobileUrl(message);
    const waUrl = buildWhatsAppUrl(message);
    const webUrl = buildWhatsAppWebUrl(message);
    
    console.log('🔗 URL generati:', { mobileUrl, waUrl, webUrl });
    
    // Strategia mobile-first ottimizzata
    try {
      // 1. Primo tentativo: app WhatsApp nativa (whatsapp://)
      console.log('📱 Tentativo app WhatsApp nativa...');
      window.location.href = mobileUrl;
      console.log('✅ Redirect app nativa avviato');
    } catch (error) {
      console.log('❌ App nativa fallita, provo wa.me...');
      try {
        // 2. Fallback: wa.me (universale mobile)
        console.log('🌐 Tentativo wa.me universale...');
        window.location.href = waUrl;
        console.log('✅ Redirect wa.me avviato');
      } catch (fallbackError) {
        console.warn('❌ Entrambi i tentativi falliti:', error, fallbackError);
        // Copia automaticamente il testo come fallback
        try {
          await navigator.clipboard.writeText(message);
          alert('WhatsApp non disponibile. Il messaggio è stato copiato negli appunti. Aprire WhatsApp e incollare il messaggio.');
        } catch (clipboardError) {
          alert('Impossibile aprire WhatsApp automaticamente. Copiare il testo sopra e incollarlo manualmente in WhatsApp.');
        }
      }
    }
  };

  // Handler per copia testo
  const handleCopyText = async () => {
    console.log('🔄 Tentativo copia testo...');
    console.log('📝 Testo da copiare:', message);
    
    try {
      // Strategia mobile-first per copia testo
      if (navigator.clipboard && window.isSecureContext) {
        console.log('📋 Usando Clipboard API moderna...');
        await navigator.clipboard.writeText(message);
        console.log('✅ Testo copiato con Clipboard API');
      } else {
        console.log('📋 Usando fallback mobile-friendly...');
        // Fallback ottimizzato per mobile
        const textArea = document.createElement('textarea');
        textArea.value = message;
        textArea.style.position = 'fixed';
        textArea.style.left = '0';
        textArea.style.top = '0';
        textArea.style.width = '1px';
        textArea.style.height = '1px';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        textArea.setAttribute('readonly', '');
        
        document.body.appendChild(textArea);
        
        // Per iOS Safari
        textArea.contentEditable = 'true';
        textArea.readOnly = false;
        
        const range = document.createRange();
        range.selectNodeContents(textArea);
        
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        textArea.setSelectionRange(0, 999999);
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) {
          throw new Error('execCommand copy failed');
        }
        console.log('✅ Testo copiato con fallback mobile');
      }
      
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
      console.log('✅ Stato copySuccess impostato');
    } catch (error) {
      console.warn('❌ Impossibile copiare il testo:', error);
      alert('Impossibile copiare automaticamente. Tenere premuto sul testo sopra e selezionare "Copia".');
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
  if (!isOpen) {
    console.log('❌ WhatsAppOrderModal: isOpen = false, non renderizzato');
    return null;
  }
  
  console.log('✅ WhatsAppOrderModal: renderizzato con orderDetails:', orderDetails);

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
            onTouchStart={(e) => {
              // Facilita la selezione su mobile
              const textarea = e.currentTarget;
              setTimeout(() => {
                textarea.select();
                textarea.setSelectionRange(0, textarea.value.length);
              }, 100);
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
            onClick={(e) => {
              console.log('🔄 Click su pulsante Apri WhatsApp');
              e.preventDefault();
              e.stopPropagation();
              handleOpenWhatsApp();
            }}
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
              onClick={(e) => {
                console.log('🔄 Click su pulsante Copia Testo');
                e.preventDefault();
                e.stopPropagation();
                handleCopyText();
              }}
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

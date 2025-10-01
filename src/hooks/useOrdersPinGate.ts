import { useState, useEffect } from 'react';

// Configurazione PIN
const REQUIRED_PIN = "1909";
const ORDERS_AUTH_KEY = "ordersAuthSession";

export function useOrdersPinGate() {
  const [isOrdersUnlocked, setIsOrdersUnlocked] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Ripristina lo stato di autenticazione all'avvio
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(ORDERS_AUTH_KEY);
      if (saved) {
        const authSession = JSON.parse(saved);
        
        // Verifica che la sessione sia valida (max 24h)
        const maxAge = 24 * 60 * 60 * 1000; // 24 ore
        const isExpired = Date.now() - authSession.timestamp > maxAge;
        
        if (!isExpired && authSession.authenticated) {
          console.log('🔓 Ripristino autenticazione ordini dalla sessione');
          setIsOrdersUnlocked(true);
        } else {
          // Rimuovi sessione scaduta
          sessionStorage.removeItem(ORDERS_AUTH_KEY);
          console.log('🕐 Sessione autenticazione ordini scaduta, rimossa');
        }
      }
    } catch (error) {
      console.warn('⚠️ Errore ripristino sessione autenticazione ordini:', error);
      sessionStorage.removeItem(ORDERS_AUTH_KEY);
    }
  }, []);

  // Salva lo stato di autenticazione quando cambia
  useEffect(() => {
    if (isOrdersUnlocked) {
      try {
        const authSession = {
          authenticated: true,
          timestamp: Date.now(),
          userAgent: navigator.userAgent
        };
        
        sessionStorage.setItem(ORDERS_AUTH_KEY, JSON.stringify(authSession));
        console.log('💾 Sessione autenticazione ordini salvata');
      } catch (error) {
        console.warn('⚠️ Errore salvataggio sessione autenticazione ordini:', error);
      }
    } else {
      // Rimuovi sessione quando si fa logout o scade
      try {
        sessionStorage.removeItem(ORDERS_AUTH_KEY);
        console.log('🚪 Sessione autenticazione ordini rimossa');
      } catch (error) {
        console.warn('⚠️ Errore rimozione sessione autenticazione ordini:', error);
      }
    }
  }, [isOrdersUnlocked]);

  const openPinModal = () => {
    setIsPinModalOpen(true);
  };

  const closePinModal = () => {
    setIsPinModalOpen(false);
  };

  const validatePin = (input: string): boolean => {
    if (input === REQUIRED_PIN) {
      setIsOrdersUnlocked(true);
      return true;
    } else {
      return false;
    }
  };

  const unlock = () => {
    setIsOrdersUnlocked(true);
    closePinModal();
  };

  const logout = () => {
    console.log('🚪 Logout esplicito dalla sezione ordini');
    setIsOrdersUnlocked(false);
  };

  return {
    isOrdersUnlocked,
    isPinModalOpen,
    openPinModal,
    closePinModal,
    validatePin,
    unlock,
    logout
  };
}

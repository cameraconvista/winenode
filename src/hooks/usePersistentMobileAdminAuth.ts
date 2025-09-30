import { useEffect } from 'react';

interface User {
  id: string;
  role: string;
  email?: string;
  [key: string]: any;
}

interface UsePersistentMobileAdminAuthProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

/**
 * Hook per mantenere l'autenticazione admin persistente solo su dispositivi mobili
 * 
 * Funzionamento:
 * - Salva la sessione admin in sessionStorage quando l'utente è admin su mobile
 * - Ripristina la sessione all'avvio se disponibile
 * - La sessione si perde alla chiusura dell'app (comportamento desiderato)
 * 
 * Vincoli:
 * - Applicato solo se role === 'admin' e dispositivo mobile
 * - Non interferisce con login standard desktop o utenti non admin
 * - Usa sessionStorage (non localStorage) per sicurezza
 */
export function usePersistentMobileAdminAuth({ user, setUser }: UsePersistentMobileAdminAuthProps) {
  
  // Rileva se è un dispositivo mobile
  const isMobileDevice = () => {
    return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Salva la sessione admin se su mobile
  useEffect(() => {
    if (user?.role === 'admin' && isMobileDevice()) {
      try {
        const adminSession = {
          id: user.id,
          role: user.role,
          email: user.email,
          timestamp: Date.now(),
          userAgent: navigator.userAgent
        };
        
        sessionStorage.setItem('adminSession', JSON.stringify(adminSession));
        console.log('📱 Sessione admin mobile salvata');
      } catch (error) {
        console.warn('⚠️ Errore salvataggio sessione admin:', error);
      }
    }
  }, [user]);

  // Ripristina la sessione all'avvio se disponibile
  useEffect(() => {
    if (!user && isMobileDevice()) {
      try {
        const saved = sessionStorage.getItem('adminSession');
        if (saved) {
          const adminSession = JSON.parse(saved);
          
          // Verifica che la sessione sia valida (max 24h)
          const maxAge = 24 * 60 * 60 * 1000; // 24 ore
          const isExpired = Date.now() - adminSession.timestamp > maxAge;
          
          if (!isExpired && adminSession.role === 'admin') {
            console.log('📱 Ripristino sessione admin mobile');
            setUser({
              id: adminSession.id,
              role: adminSession.role,
              email: adminSession.email
            });
          } else {
            // Rimuovi sessione scaduta
            sessionStorage.removeItem('adminSession');
            console.log('🕐 Sessione admin scaduta, rimossa');
          }
        }
      } catch (error) {
        console.warn('⚠️ Errore ripristino sessione admin:', error);
        sessionStorage.removeItem('adminSession');
      }
    }
  }, [user, setUser]);

  // Pulizia sessione al logout
  useEffect(() => {
    if (!user) {
      try {
        sessionStorage.removeItem('adminSession');
        console.log('🚪 Sessione admin rimossa al logout');
      } catch (error) {
        console.warn('⚠️ Errore rimozione sessione:', error);
      }
    }
  }, [user]);

  return {
    isMobileDevice: isMobileDevice(),
    hasPersistedSession: !!sessionStorage.getItem('adminSession')
  };
}

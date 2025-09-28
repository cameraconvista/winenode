import { useState } from 'react';

// Configurazione PIN
const REQUIRED_PIN = "1909";
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 10; // secondi

export function useOrdersPinGate() {
  const [isOrdersUnlocked, setIsOrdersUnlocked] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutCountdown, setLockoutCountdown] = useState(0);

  const openPinModal = () => {
    setIsPinModalOpen(true);
  };

  const closePinModal = () => {
    setIsPinModalOpen(false);
  };

  const validatePin = (input: string): boolean => {
    if (input === REQUIRED_PIN) {
      setIsOrdersUnlocked(true);
      setAttempts(0);
      setIsLocked(false);
      return true;
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        setLockoutCountdown(LOCKOUT_DURATION);
        
        // Countdown timer
        const timer = setInterval(() => {
          setLockoutCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setIsLocked(false);
              setAttempts(0);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      
      return false;
    }
  };

  const unlock = () => {
    setIsOrdersUnlocked(true);
    closePinModal();
  };

  return {
    isOrdersUnlocked,
    isPinModalOpen,
    isLocked,
    lockoutCountdown,
    attempts,
    openPinModal,
    closePinModal,
    validatePin,
    unlock
  };
}

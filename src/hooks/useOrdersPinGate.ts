import { useState } from 'react';

// Configurazione PIN
const REQUIRED_PIN = "1909";

export function useOrdersPinGate() {
  const [isOrdersUnlocked, setIsOrdersUnlocked] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

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

  return {
    isOrdersUnlocked,
    isPinModalOpen,
    openPinModal,
    closePinModal,
    validatePin,
    unlock
  };
}

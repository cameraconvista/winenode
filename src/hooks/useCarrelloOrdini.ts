import { useState } from 'react';

interface UseCarrelloOrdiniProps {
  onNuovoOrdine?: () => void;
}

export function useCarrelloOrdini({ onNuovoOrdine }: UseCarrelloOrdiniProps = {}) {
  const [isCarrelloModalOpen, setIsCarrelloModalOpen] = useState(false);

  const openCarrelloModal = () => {
    setIsCarrelloModalOpen(true);
  };

  const closeCarrelloModal = () => {
    setIsCarrelloModalOpen(false);
  };

  const handleNuovoOrdine = () => {
    console.log('🔄 Nuovo Ordine clicked - Aprendo modale selezione fornitore');
    closeCarrelloModal(); // Chiude il modale carrello
    
    // Callback per aprire il modale Nuovo Ordine
    if (onNuovoOrdine) {
      onNuovoOrdine();
    }
  };

  const handleGestisciOrdini = () => {
    console.log('⚙️ Gestisci Ordini clicked - TODO: Implementare logica');
    // TODO: Implementare navigazione o apertura modale Gestisci Ordini
    closeCarrelloModal();
  };

  return {
    isCarrelloModalOpen,
    openCarrelloModal,
    closeCarrelloModal,
    handleNuovoOrdine,
    handleGestisciOrdini
  };
}

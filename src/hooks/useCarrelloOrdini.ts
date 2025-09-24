import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseCarrelloOrdiniProps {
  onNuovoOrdine?: () => void;
}

export function useCarrelloOrdini({ onNuovoOrdine }: UseCarrelloOrdiniProps = {}) {
  const navigate = useNavigate();
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
    console.log('⚙️ Gestisci Ordini clicked - Navigando alla pagina Gestisci Ordini');
    closeCarrelloModal();
    navigate('/orders/manage');
  };

  return {
    isCarrelloModalOpen,
    openCarrelloModal,
    closeCarrelloModal,
    handleNuovoOrdine,
    handleGestisciOrdini
  };
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useNuovoOrdine() {
  const navigate = useNavigate();
  const [isNuovoOrdineModalOpen, setIsNuovoOrdineModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');

  const openNuovoOrdineModal = () => {
    setIsNuovoOrdineModalOpen(true);
  };

  const closeNuovoOrdineModal = () => {
    setIsNuovoOrdineModalOpen(false);
    setSelectedSupplier('');
  };

  const handleAvanti = (supplier: string) => {
    setSelectedSupplier(supplier);
    console.log('🚀 Fornitore selezionato:', supplier);
    console.log('📋 Navigando alla pagina Crea Ordine per fornitore:', supplier);
    
    // Chiudi modale e naviga alla pagina Crea Ordine
    closeNuovoOrdineModal();
    navigate(`/orders/create/${encodeURIComponent(supplier)}`);
  };

  return {
    isNuovoOrdineModalOpen,
    selectedSupplier,
    openNuovoOrdineModal,
    closeNuovoOrdineModal,
    handleAvanti
  };
}

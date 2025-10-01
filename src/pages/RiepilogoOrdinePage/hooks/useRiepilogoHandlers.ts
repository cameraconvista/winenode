import { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useOrdini } from '../../../contexts/OrdiniContext';
import { RiepilogoHandlers, OrdineDetail } from '../types';

interface UseRiepilogoHandlersProps {
  ordineDetails: OrdineDetail[];
  totalOrdine: number;
  totalBottiglie: number;
  isConfirming: boolean;
  setIsConfirming: (confirming: boolean) => void;
  setIsWhatsAppModalOpen: (open: boolean) => void;
}

export const useRiepilogoHandlers = ({
  ordineDetails,
  totalOrdine,
  totalBottiglie,
  isConfirming,
  setIsConfirming,
  setIsWhatsAppModalOpen
}: UseRiepilogoHandlersProps): RiepilogoHandlers => {
  const { supplier } = useParams<{ supplier: string }>();
  const navigate = useNavigate();
  const { aggiungiOrdine } = useOrdini();

  const handleModificaOrdine = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleConferma = useCallback(async () => {
    if (isConfirming) return; // Previeni doppio click
    
    setIsConfirming(true);
    
    try {
      const fornitore = decodeURIComponent(supplier || '');
      
      console.log('🚀 Confermando ordine:', {
        fornitore,
        ordineDetails,
        totalBottiglie,
        totalOrdine
      });

      // Crea nuovo ordine
      const nuovoOrdine = {
        fornitore,
        totale: totalOrdine,
        bottiglie: totalBottiglie,
        data: new Date().toLocaleDateString('it-IT'),
        stato: 'sospeso' as const, // Stato valido per database: 'sospeso','inviato','ricevuto','archiviato'
        tipo: 'inviato' as const,
        dettagli: ordineDetails.map(detail => ({
          wineId: detail.wineId,
          wineName: detail.wine?.name || 'Vino sconosciuto',
          quantity: detail.quantity,
          unit: detail.unit,
          unitPrice: detail.unitPrice,
          totalPrice: detail.totalPrice
        }))
      };

      // Salva ordine (operazione asincrona)
      await aggiungiOrdine(nuovoOrdine);
      
      // Mostra toast di conferma
      toast.success("Ordine confermato");
      
      // Apri modale WhatsApp dopo successo
      setIsWhatsAppModalOpen(true);
      
    } catch (error) {
      console.error('❌ Errore durante la conferma ordine:', error);
      toast.error("Errore durante la conferma. Riprova");
    } finally {
      setIsConfirming(false);
    }
  }, [
    isConfirming,
    setIsConfirming,
    supplier,
    ordineDetails,
    totalBottiglie,
    totalOrdine,
    aggiungiOrdine,
    setIsWhatsAppModalOpen
  ]);

  const handleWhatsAppModalClose = useCallback(() => {
    setIsWhatsAppModalOpen(false);
    // Naviga alla pagina Gestisci Ordini tab Creati dopo chiusura modale
    navigate('/orders/manage?tab=inviati');
  }, [setIsWhatsAppModalOpen, navigate]);

  return {
    handleModificaOrdine,
    handleConferma,
    handleWhatsAppModalClose
  };
};

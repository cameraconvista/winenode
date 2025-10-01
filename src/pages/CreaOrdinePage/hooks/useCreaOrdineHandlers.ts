import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseCreaOrdineHandlersProps {
  supplier?: string;
  ordineItems: any[];
  totalBottiglie: number;
}

export const useCreaOrdineHandlers = ({ supplier, ordineItems, totalBottiglie }: UseCreaOrdineHandlersProps) => {
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleNavigateToSummary = useCallback(() => {
    console.log('🔘 Click Conferma Ordine - totalBottiglie:', totalBottiglie);
    console.log('🔘 ordineItems:', ordineItems);
    if (totalBottiglie > 0) {
      console.log('✅ Navigando a riepilogo ordine...');
      navigate(`/orders/summary/${supplier}`, {
        state: {
          ordineItems,
          totalBottiglie
        }
      });
    } else {
      console.log('⚠️ Nessun vino selezionato');
    }
  }, [navigate, supplier, ordineItems, totalBottiglie]);

  return {
    handleBack,
    handleNavigateToSummary
  };
};

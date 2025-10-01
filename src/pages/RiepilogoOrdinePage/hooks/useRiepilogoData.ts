import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import useWines from '../../../hooks/useWines';
import { LocationState, OrdineDetail, RiepilogoData } from '../types';
import { OrderDetail } from '../../../utils/buildWhatsAppMessage';

export const useRiepilogoData = (): RiepilogoData => {
  const location = useLocation();
  const { wines } = useWines();

  const state = location.state as LocationState;
  const ordineItems = state?.ordineItems || [];

  const ordineDetails = useMemo((): OrdineDetail[] => {
    return ordineItems.map(item => {
      const wine = wines.find(w => w.id === item.wineId);
      const unitPrice = wine?.cost || 0;
      const multiplier = item.unit === 'cartoni' ? 6 : 1;
      const totalQuantityBottiglie = item.quantity * multiplier;
      const totalPrice = totalQuantityBottiglie * unitPrice;

      return {
        ...item,
        wine,
        unitPrice,
        totalQuantityBottiglie,
        totalPrice
      };
    });
  }, [ordineItems, wines]);

  const totalOrdine = useMemo(() => {
    return ordineDetails.reduce((sum, detail) => sum + detail.totalPrice, 0);
  }, [ordineDetails]);

  const whatsAppOrderDetails = useMemo((): OrderDetail[] => {
    return ordineDetails.map(detail => ({
      wineName: detail.wine?.name || 'Vino sconosciuto',
      vintage: detail.wine?.vintage,
      quantity: detail.quantity,
      unit: detail.unit
    }));
  }, [ordineDetails]);

  return {
    ordineDetails,
    totalOrdine,
    whatsAppOrderDetails
  };
};

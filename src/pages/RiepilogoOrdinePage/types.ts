import { OrdineItem } from '../../hooks/useCreaOrdine';
import { WineType } from '../../hooks/useWines';
import { OrderDetail } from '../../utils/buildWhatsAppMessage';

export interface LocationState {
  ordineItems: OrdineItem[];
  totalBottiglie: number;
}

export interface OrdineDetail extends OrdineItem {
  wine: WineType | undefined;
  unitPrice: number;
  totalQuantityBottiglie: number;
  totalPrice: number;
}

export interface RiepilogoState {
  isWhatsAppModalOpen: boolean;
  isConfirming: boolean;
}

export interface RiepilogoHandlers {
  handleModificaOrdine: () => void;
  handleConferma: () => Promise<void>;
  handleWhatsAppModalClose: () => void;
}

export interface RiepilogoData {
  ordineDetails: OrdineDetail[];
  totalOrdine: number;
  whatsAppOrderDetails: OrderDetail[];
}

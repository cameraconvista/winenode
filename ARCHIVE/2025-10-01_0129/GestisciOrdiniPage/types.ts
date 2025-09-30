import { Ordine } from '../../contexts/OrdiniContext';
import { OrderDetail } from '../../utils/buildWhatsAppMessage';

export type TabType = 'inviati' | 'archiviati';

export interface TabsState {
  active: TabType;
  expanded: Set<string>;
  managing: Set<string>;
}

export interface ModalsState {
  showConfermaEliminazione: boolean;
  showQuantityModal: boolean;
  showSmartModal: boolean;
  showConfirmArchive: boolean;
  showWhatsAppModal: boolean;
}

export interface QuantityEditingState {
  ordineId: string;
  dettaglioIndex: number;
  currentValue: number;
  originalValue: number;
}

export interface OrderToDelete {
  id: string;
  ordine: Ordine;
  tipo: 'inviato' | 'archiviato';
}

export interface PendingArchiveOrder {
  ordineId: string;
  quantities: Record<number, number>;
}

export interface WhatsAppState {
  orderDetails: OrderDetail[];
  supplierName: string;
}

export interface OrdersPageState {
  tabs: TabsState;
  modals: ModalsState;
  modifiedQuantities: Record<string, Record<number, number>>;
  draftQuantities: Record<string, Record<number, number>>;
  editingQuantity: QuantityEditingState | null;
  smartModalOrdine: Ordine | null;
  pendingArchiveOrder: PendingArchiveOrder | null;
  ordineToDelete: OrderToDelete | null;
  whatsApp: WhatsAppState;
}

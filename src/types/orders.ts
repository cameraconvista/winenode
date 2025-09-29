// refactor: tipi comuni per evitare import circolari
import { Ordine, OrdineDettaglio } from '../services/ordiniService';

export type { Ordine, OrdineDettaglio };

export type TabType = 'creati' | 'archiviati';

export interface QuantityEditState {
  ordineId: string;
  dettaglioIndex: number;
  currentValue: number;
  originalValue: number;
}

export interface ArchivePendingState {
  ordineId: string;
  quantities: Record<number, number>;
}

export interface OrdersState {
  activeTab: TabType;
  expandedOrders: Set<string>;
  managingOrders: Set<string>;
  modifiedQuantities: Record<string, Record<number, number>>;
  draftQuantities: Record<string, Record<number, number>>;
}

export interface ModalsState {
  showQuantityModal: boolean;
  editingQuantity: QuantityEditState | null;
  showSmartModal: boolean;
  smartModalOrdine: Ordine | null;
  showConfirmArchive: boolean;
  pendingArchiveOrder: ArchivePendingState | null;
  showWhatsAppModal: boolean;
  whatsAppOrderDetails: any[];
  whatsAppSupplierName: string;
}

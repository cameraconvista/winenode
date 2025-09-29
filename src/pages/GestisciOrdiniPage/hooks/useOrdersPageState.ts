import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Ordine } from '../../../contexts/OrdiniContext';
import { OrderDetail } from '../../../utils/buildWhatsAppMessage';
import { 
  TabType, 
  TabsState, 
  ModalsState, 
  QuantityEditingState,
  OrderToDelete,
  PendingArchiveOrder,
  WhatsAppState,
  OrdersPageState 
} from '../types';

export const useOrdersPageState = (): OrdersPageState => {
  const [searchParams] = useSearchParams();
  
  // Stati consolidati per tabs
  const [tabs, setTabs] = useState<TabsState>({
    active: 'inviati' as TabType,
    expanded: new Set<string>(),
    managing: new Set<string>()
  });

  // Stati consolidati per modali
  const [modals, setModals] = useState<ModalsState>({
    showConfermaEliminazione: false,
    showQuantityModal: false,
    showSmartModal: false,
    showConfirmArchive: false,
    showWhatsAppModal: false
  });

  // Stati per gestione quantità
  const [modifiedQuantities, setModifiedQuantities] = useState<Record<string, Record<number, number>>>({});
  const [draftQuantities, setDraftQuantities] = useState<Record<string, Record<number, number>>>({});
  const [editingQuantity, setEditingQuantity] = useState<QuantityEditingState | null>(null);

  // Stati per modali specifici
  const [smartModalOrdine, setSmartModalOrdine] = useState<Ordine | null>(null);
  const [pendingArchiveOrder, setPendingArchiveOrder] = useState<PendingArchiveOrder | null>(null);
  const [ordineToDelete, setOrdineToDelete] = useState<OrderToDelete | null>(null);

  // Stati per WhatsApp
  const [whatsApp, setWhatsApp] = useState<WhatsAppState>({
    orderDetails: [],
    supplierName: ''
  });

  // Gestisci tab da URL query
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabType;
    if (tabFromUrl && ['inviati', 'archiviati'].includes(tabFromUrl)) {
      setTabs(prev => ({ ...prev, active: tabFromUrl }));
    }
  }, [searchParams]);

  return {
    tabs,
    modals,
    modifiedQuantities,
    draftQuantities,
    editingQuantity,
    smartModalOrdine,
    pendingArchiveOrder,
    ordineToDelete,
    whatsApp,
    // Setters per handlers
    setTabs: setTabs as any,
    setModals: setModals as any,
    setModifiedQuantities,
    setDraftQuantities,
    setEditingQuantity,
    setSmartModalOrdine,
    setPendingArchiveOrder,
    setOrdineToDelete,
    setWhatsApp: setWhatsApp as any
  } as OrdersPageState & {
    setTabs: React.Dispatch<React.SetStateAction<TabsState>>;
    setModals: React.Dispatch<React.SetStateAction<ModalsState>>;
    setModifiedQuantities: React.Dispatch<React.SetStateAction<Record<string, Record<number, number>>>>;
    setDraftQuantities: React.Dispatch<React.SetStateAction<Record<string, Record<number, number>>>>;
    setEditingQuantity: React.Dispatch<React.SetStateAction<QuantityEditingState | null>>;
    setSmartModalOrdine: React.Dispatch<React.SetStateAction<Ordine | null>>;
    setPendingArchiveOrder: React.Dispatch<React.SetStateAction<PendingArchiveOrder | null>>;
    setOrdineToDelete: React.Dispatch<React.SetStateAction<OrderToDelete | null>>;
    setWhatsApp: React.Dispatch<React.SetStateAction<WhatsAppState>>;
  };
};

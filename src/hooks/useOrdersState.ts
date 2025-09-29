// refactor: stato locale per gestione ordini (client-side only)
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TabType, OrdersState, ModalsState, QuantityEditState, ArchivePendingState, Ordine } from '../types/orders';
import { OrderDetail } from '../utils/buildWhatsAppMessage';

export function useOrdersState() {
  const [searchParams] = useSearchParams();
  
  // Stati principali
  const [activeTab, setActiveTab] = useState<TabType>('inviati');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [managingOrders, setManagingOrders] = useState<Set<string>>(new Set());
  const [modifiedQuantities, setModifiedQuantities] = useState<Record<string, Record<number, number>>>({});
  const [draftQuantities, setDraftQuantities] = useState<Record<string, Record<number, number>>>({});

  // Stati modali
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [editingQuantity, setEditingQuantity] = useState<QuantityEditState | null>(null);
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [smartModalOrdine, setSmartModalOrdine] = useState<Ordine | null>(null);
  const [showConfirmArchive, setShowConfirmArchive] = useState(false);
  const [pendingArchiveOrder, setPendingArchiveOrder] = useState<ArchivePendingState | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppOrderDetails, setWhatsAppOrderDetails] = useState<OrderDetail[]>([]);
  const [whatsAppSupplierName, setWhatsAppSupplierName] = useState<string>('');

  // Inizializzazione tab da URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'archiviati' || tab === 'storico') {
      setActiveTab('archiviati');
    } else {
      setActiveTab('inviati');
    }
  }, [searchParams]);

  // Stato aggregato per performance
  const ordersState: OrdersState = useMemo(() => ({
    activeTab,
    expandedOrders,
    managingOrders,
    modifiedQuantities,
    draftQuantities
  }), [activeTab, expandedOrders, managingOrders, modifiedQuantities, draftQuantities]);

  const modalsState: ModalsState = useMemo(() => ({
    showQuantityModal,
    editingQuantity,
    showSmartModal,
    smartModalOrdine,
    showConfirmArchive,
    pendingArchiveOrder,
    showWhatsAppModal,
    whatsAppOrderDetails,
    whatsAppSupplierName
  }), [
    showQuantityModal,
    editingQuantity,
    showSmartModal,
    smartModalOrdine,
    showConfirmArchive,
    pendingArchiveOrder,
    showWhatsAppModal,
    whatsAppOrderDetails,
    whatsAppSupplierName
  ]);

  // Azioni per stato ordini
  const ordersActions = useMemo(() => ({
    setActiveTab,
    setExpandedOrders,
    setManagingOrders,
    setModifiedQuantities,
    setDraftQuantities
  }), []);

  // Azioni per modali
  const modalsActions = useMemo(() => ({
    setShowQuantityModal,
    setEditingQuantity,
    setShowSmartModal,
    setSmartModalOrdine,
    setShowConfirmArchive,
    setPendingArchiveOrder,
    setShowWhatsAppModal,
    setWhatsAppOrderDetails,
    setWhatsAppSupplierName
  }), []);

  return {
    ordersState,
    modalsState,
    ordersActions,
    modalsActions
  };
}

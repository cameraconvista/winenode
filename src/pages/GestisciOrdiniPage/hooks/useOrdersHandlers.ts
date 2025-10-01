/**
 * @deprecated Use specialized handlers instead
 * Re-export for backward compatibility
 */
import React, { useEffect } from 'react';
import { useNavigationHandlers } from './handlers/useNavigationHandlers';
import { useOrderActionsHandlers } from './handlers/useOrderActionsHandlers';
import { useQuantityHandlers } from './handlers/useQuantityHandlers';
import { useModalHandlers } from './handlers/useModalHandlers';
import { OrdersPageState } from '../types';
import { Ordine } from '../../../contexts/OrdiniContext';

interface UseOrdersHandlersProps {
  pageState: OrdersPageState;
  setTabs: React.Dispatch<React.SetStateAction<any>>;
  setModals: React.Dispatch<React.SetStateAction<any>>;
  setModifiedQuantities: React.Dispatch<React.SetStateAction<Record<string, Record<number, number>>>>;
  setDraftQuantities: React.Dispatch<React.SetStateAction<Record<string, Record<number, number>>>>;
  setEditingQuantity: React.Dispatch<React.SetStateAction<any>>;
  setSmartModalOrdine: React.Dispatch<React.SetStateAction<Ordine | null>>;
  setPendingArchiveOrder: React.Dispatch<React.SetStateAction<any>>;
  setOrdineToDelete: React.Dispatch<React.SetStateAction<any>>;
  setWhatsApp: React.Dispatch<React.SetStateAction<any>>;
}

export const useOrdersHandlers = (props: UseOrdersHandlersProps) => {
  const navigationHandlers = useNavigationHandlers({
    setTabs: props.setTabs
  });

  const orderActionsHandlers = useOrderActionsHandlers({
    setModals: props.setModals,
    setOrdineToDelete: props.setOrdineToDelete
  });

  const quantityHandlers = useQuantityHandlers({
    pageState: props.pageState,
    setModals: props.setModals,
    setModifiedQuantities: props.setModifiedQuantities,
    setDraftQuantities: props.setDraftQuantities,
    setEditingQuantity: props.setEditingQuantity
  });

  const modalHandlers = useModalHandlers({
    pageState: props.pageState,
    setModals: props.setModals,
    setSmartModalOrdine: props.setSmartModalOrdine,
    setPendingArchiveOrder: props.setPendingArchiveOrder,
    setOrdineToDelete: props.setOrdineToDelete,
    setWhatsApp: props.setWhatsApp,
    setTabs: props.setTabs,
    setDraftQuantities: props.setDraftQuantities
  });

  return {
    ...navigationHandlers,
    ...orderActionsHandlers,
    ...quantityHandlers,
    ...modalHandlers
  };
};

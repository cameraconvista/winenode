/**
 * Hook centralizzati per i contesti degli ordini
 * Sede unica per evitare duplicazioni e migliorare manutenibilità
 */

// Re-export degli hook principali
export { useOrdersData, useOrdersInviati, useOrdersStorico, useOrdersLoading } from '../OrdersDataContext';
export { useQuantityManagement } from '../QuantityManagementContext';
export { useOrdersActions } from '../../ordersActions';

// Re-export degli hook specializzati per azioni
export { useOrdersActionsHandlers } from '../../ordersActions/OrdersActionsHandlers';
export { useOrdersActionsConfirm } from '../../ordersActions/OrdersActionsConfirm';
export { useOrdersActionsLoader } from '../../ordersActions/OrdersActionsLoader';
export { useOrdersActionsAudit } from '../../ordersActions/OrdersActionsAudit';
export { useOrdersActionsState } from '../../ordersActions/OrdersActionsState';

// Re-export dei tipi per compatibilità
export type { OrdersActionsContextType } from '../../ordersActions/types';

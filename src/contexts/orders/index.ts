// Re-export dei context modulari
export { OrdersDataProvider, useOrdersData, useOrdersInviati, useOrdersStorico, useOrdersLoading } from './OrdersDataContext';
export { QuantityManagementProvider, useQuantityManagement } from './QuantityManagementContext';
export { OrdersActionsProvider, useOrdersActions } from './OrdersActionsContext';

// Re-export tipi per compatibilità
export type { Ordine, OrdineDettaglio } from '../../services/ordiniService';

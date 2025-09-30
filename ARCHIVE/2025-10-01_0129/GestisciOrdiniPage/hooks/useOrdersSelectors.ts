import { useMemo, useCallback } from 'react';
import { useOrdini } from '../../../contexts/OrdiniContext';
import { ORDINI_LABELS } from '../../../constants/ordiniLabels';
import { TabType, OrdersPageState } from '../types';

export const useOrdersSelectors = (pageState: OrdersPageState) => {
  const { ordiniInviati, ordiniStorico } = useOrdini();

  // PERF: Selettore dati tab corrente
  const currentTabData = useMemo(() => {
    switch (pageState.tabs.active) {
      case 'inviati':
        return ordiniInviati;
      case 'archiviati':
        return ordiniStorico;
      default:
        return [];
    }
  }, [pageState.tabs.active, ordiniInviati, ordiniStorico]);

  // PERF: Messaggio empty state
  const emptyMessage = useMemo(() => {
    switch (pageState.tabs.active) {
      case 'inviati':
        return {
          title: ORDINI_LABELS.emptyState.creati.title,
          subtitle: ORDINI_LABELS.emptyState.creati.subtitle
        };
      case 'archiviati':
        return {
          title: ORDINI_LABELS.emptyState.archiviati.title,
          subtitle: ORDINI_LABELS.emptyState.archiviati.subtitle
        };
      default:
        return {
          title: ORDINI_LABELS.emptyState.default.title,
          subtitle: ORDINI_LABELS.emptyState.default.subtitle
        };
    }
  }, [pageState.tabs.active]);

  // PERF: Funzione helper per conteggi tab
  const getTabCount = useCallback((tab: TabType) => {
    switch (tab) {
      case 'inviati':
        return ordiniInviati.length;
      case 'archiviati':
        return ordiniStorico.length;
      default:
        return 0;
    }
  }, [ordiniInviati.length, ordiniStorico.length]);

  // PERF: Messaggio eliminazione
  const getMessaggioEliminazione = useMemo(() => {
    if (!pageState.ordineToDelete) return '';
    
    switch (pageState.ordineToDelete.tipo) {
      case 'inviato':
        return ORDINI_LABELS.eliminazione.creato;
      case 'archiviato':
        return ORDINI_LABELS.eliminazione.archiviato;
      default:
        return '';
    }
  }, [pageState.ordineToDelete]);

  return {
    currentTabData,
    emptyMessage,
    getTabCount,
    getMessaggioEliminazione
  };
};

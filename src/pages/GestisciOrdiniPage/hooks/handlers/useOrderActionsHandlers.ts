import { useCallback } from 'react';
import { useOrdini, Ordine } from '../../../../contexts/OrdiniContext';

interface UseOrderActionsHandlersProps {
  setModals: React.Dispatch<React.SetStateAction<any>>;
  setOrdineToDelete: React.Dispatch<React.SetStateAction<any>>;
}

export const useOrderActionsHandlers = ({
  setModals,
  setOrdineToDelete
}: UseOrderActionsHandlersProps) => {
  const { confermaRicezioneOrdine } = useOrdini();

  const handleVisualizza = useCallback((ordineId: string) => {
    // TODO: Implementare visualizzazione dettagli ordine
  }, []);

  const handleConfermaOrdine = useCallback(async (ordineId: string) => {
    await confermaRicezioneOrdine(ordineId);
  }, [confermaRicezioneOrdine]);

  const handleEliminaOrdineCreato = useCallback((ordineId: string, ordine: Ordine) => {
    setOrdineToDelete({ id: ordineId, ordine, tipo: 'inviato' });
    setModals(prev => ({ ...prev, showConfermaEliminazione: true }));
  }, [setOrdineToDelete, setModals]);

  const handleEliminaOrdineArchiviato = useCallback((ordineId: string, ordine: Ordine) => {
    setOrdineToDelete({ id: ordineId, ordine, tipo: 'archiviato' });
    setModals(prev => ({ ...prev, showConfermaEliminazione: true }));
  }, [setOrdineToDelete, setModals]);

  return {
    handleVisualizza,
    handleConfermaOrdine,
    handleEliminaOrdineCreato,
    handleEliminaOrdineArchiviato
  };
};

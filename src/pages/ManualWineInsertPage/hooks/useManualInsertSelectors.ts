import { useMemo } from 'react';

export function useManualInsertSelectors(righeRiconosciute: number) {
  // Memoizza conteggio righe per performance
  const conteggioRighe = useMemo(() => {
    return righeRiconosciute;
  }, [righeRiconosciute]);

  return {
    conteggioRighe
  };
}

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface OrdineDettaglio {
  wineId: string;
  wineName: string;
  quantity: number;
  unit: 'bottiglie' | 'cartoni';
  unitPrice: number;
  totalPrice: number;
}

export interface Ordine {
  id: string;
  fornitore: string;
  totale: number;
  bottiglie: number;
  data: string;
  stato: 'in_corso' | 'completato' | 'annullato';
  tipo: 'inviato' | 'ricevuto';
  dettagli?: OrdineDettaglio[];
}

interface OrdiniContextType {
  ordiniInviati: Ordine[];
  ordiniRicevuti: Ordine[];
  ordiniStorico: Ordine[];
  loading: boolean;
  aggiungiOrdine: (ordine: Omit<Ordine, 'id'>) => void;
  aggiornaStatoOrdine: (ordineId: string, nuovoStato: Ordine['stato']) => void;
}

const OrdiniContext = createContext<OrdiniContextType | undefined>(undefined);

export function OrdiniProvider({ children }: { children: ReactNode }) {
  const [ordiniInviati, setOrdiniInviati] = useState<Ordine[]>([]);
  const [ordiniRicevuti, setOrdiniRicevuti] = useState<Ordine[]>([]);
  const [ordiniStorico, setOrdiniStorico] = useState<Ordine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simula caricamento dati
    const loadOrdini = async () => {
      setLoading(true);
      
      // TODO: Sostituire con chiamate API reali
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Dati mock per testing - da sostituire con API reali
      const mockOrdiniRicevuti: Ordine[] = [
        {
          id: 'ORD-001',
          fornitore: 'BOLOGNA VINI',
          totale: 245.50,
          bottiglie: 24,
          data: '20/09/2025',
          stato: 'completato',
          tipo: 'ricevuto'
        },
        {
          id: 'ORD-002',
          fornitore: 'CANTINA SOCIALE',
          totale: 180.00,
          bottiglie: 18,
          data: '22/09/2025',
          stato: 'in_corso',
          tipo: 'ricevuto'
        },
        {
          id: 'ORD-003',
          fornitore: 'VINI DEL SUD',
          totale: 320.75,
          bottiglie: 36,
          data: '23/09/2025',
          stato: 'completato',
          tipo: 'ricevuto'
        },
        {
          id: 'ORD-004',
          fornitore: 'PROSECCO & CO',
          totale: 156.25,
          bottiglie: 12,
          data: '24/09/2025',
          stato: 'in_corso',
          tipo: 'ricevuto'
        }
      ];

      const mockOrdiniStorico: Ordine[] = [
        {
          id: 'ORD-OLD-001',
          fornitore: 'VINI ANTICHI',
          totale: 89.50,
          bottiglie: 6,
          data: '15/08/2025',
          stato: 'completato',
          tipo: 'inviato'
        }
      ];

      setOrdiniInviati([]); // Nessun ordine inviato per ora
      setOrdiniRicevuti(mockOrdiniRicevuti);
      setOrdiniStorico(mockOrdiniStorico);
      setLoading(false);
    };

    loadOrdini();
  }, []);

  const aggiungiOrdine = (ordine: Omit<Ordine, 'id'>) => {
    const nuovoOrdine: Ordine = {
      ...ordine,
      id: `ORD-${Date.now()}`
    };

    console.log('🔄 Aggiungendo ordine al context:', nuovoOrdine);

    if (ordine.tipo === 'inviato') {
      setOrdiniInviati(prev => {
        const nuovaLista = [nuovoOrdine, ...prev];
        console.log('📦 Ordini inviati aggiornati:', nuovaLista);
        return nuovaLista;
      });
    } else {
      setOrdiniRicevuti(prev => [nuovoOrdine, ...prev]);
    }
  };

  const aggiornaStatoOrdine = (ordineId: string, nuovoStato: Ordine['stato']) => {
    const aggiorna = (ordini: Ordine[]) =>
      ordini.map(ordine =>
        ordine.id === ordineId ? { ...ordine, stato: nuovoStato } : ordine
      );

    setOrdiniInviati(aggiorna);
    setOrdiniRicevuti(aggiorna);
    setOrdiniStorico(aggiorna);
  };

  return (
    <OrdiniContext.Provider value={{
      ordiniInviati,
      ordiniRicevuti,
      ordiniStorico,
      loading,
      aggiungiOrdine,
      aggiornaStatoOrdine
    }}>
      {children}
    </OrdiniContext.Provider>
  );
}

export function useOrdini() {
  const context = useContext(OrdiniContext);
  if (context === undefined) {
    throw new Error('useOrdini must be used within an OrdiniProvider');
  }
  return context;
}

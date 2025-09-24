import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabaseOrdini } from '../hooks/useSupabaseOrdini';

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
  data: string;
  stato: 'in_corso' | 'completato' | 'annullato';
  dettagli?: OrdineDettaglio[];
  // Campi calcolati per compatibilità UI
  bottiglie?: number; // Calcolato dalla somma dei dettagli
  tipo?: 'inviato' | 'ricevuto'; // Derivato dallo stato
}

interface OrdiniContextType {
  ordiniInviati: Ordine[];
  ordiniRicevuti: Ordine[];
  ordiniStorico: Ordine[];
  loading: boolean;
  aggiungiOrdine: (ordine: Omit<Ordine, 'id'>) => Promise<void>;
  aggiornaStatoOrdine: (ordineId: string, nuovoStato: Ordine['stato']) => Promise<void>;
  spostaOrdineInviatiARicevuti: (ordineId: string) => void;
  aggiornaQuantitaOrdine: (ordineId: string, dettagli: OrdineDettaglio[]) => void;
  confermaRicezioneOrdine: (ordineId: string) => Promise<void>;
  eliminaOrdineInviato: (ordineId: string) => Promise<void>;
  eliminaOrdineRicevuto: (ordineId: string) => Promise<void>;
  eliminaOrdineStorico: (ordineId: string) => Promise<void>;
}

const OrdiniContext = createContext<OrdiniContextType | undefined>(undefined);

export function OrdiniProvider({ children }: { children: ReactNode }) {
  const [ordiniInviati, setOrdiniInviati] = useState<Ordine[]>([]);
  const [ordiniRicevuti, setOrdiniRicevuti] = useState<Ordine[]>([]);
  const [ordiniStorico, setOrdiniStorico] = useState<Ordine[]>([]);
  const [loading, setLoading] = useState(true);

  const supabaseOrdini = useSupabaseOrdini();

  useEffect(() => {
    const loadOrdiniFromSupabase = async () => {
      console.log('🔄 Caricando ordini da Supabase...');
      try {
        const { inviati, ricevuti, storico } = await supabaseOrdini.loadOrdini();
        
        setOrdiniInviati(inviati);
        setOrdiniRicevuti(ricevuti);
        setOrdiniStorico(storico);
        
        console.log('✅ Ordini caricati:', {
          inviati: inviati.length,
          ricevuti: ricevuti.length,
          storico: storico.length
        });
      } catch (error) {
        console.error('❌ Errore caricamento ordini nel context:', error);
        // Anche in caso di errore, non bloccare l'UI
        setOrdiniInviati([]);
        setOrdiniRicevuti([]);
        setOrdiniStorico([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrdiniFromSupabase();
  }, []);

  const aggiungiOrdine = async (ordine: Omit<Ordine, 'id'>) => {
    console.log('💾 Salvando ordine in Supabase:', ordine);

    const ordineId = await supabaseOrdini.salvaOrdine(ordine);
    
    if (ordineId) {
      const nuovoOrdine: Ordine = {
        ...ordine,
        id: ordineId
      };

      // Gli ordini appena creati sono sempre "inviati" per default
      if (ordine.stato !== 'completato') {
        setOrdiniInviati(prev => [nuovoOrdine, ...prev]);
      } else {
        setOrdiniStorico(prev => [nuovoOrdine, ...prev]);
      }
      
      console.log('✅ Ordine salvato e aggiunto al context:', ordineId);
    } else {
      console.error('❌ Errore salvataggio ordine');
    }
  };

  const aggiornaStatoOrdine = async (ordineId: string, nuovoStato: Ordine['stato']) => {
    console.log('🔄 Aggiornando stato ordine in Supabase:', ordineId, '→', nuovoStato);
    
    const success = await supabaseOrdini.aggiornaStatoOrdine(ordineId, nuovoStato);
    
    if (success) {
      const aggiorna = (ordini: Ordine[]) =>
        ordini.map(ordine =>
          ordine.id === ordineId ? { ...ordine, stato: nuovoStato } : ordine
        );

      setOrdiniInviati(aggiorna);
      setOrdiniRicevuti(aggiorna);
      setOrdiniStorico(aggiorna);
      
      console.log('✅ Stato ordine aggiornato nel context');
    }
  };

  const spostaOrdineInviatiARicevuti = (ordineId: string) => {
    console.log('🔄 Spostando ordine da Inviati a Ricevuti:', ordineId);
    
    setOrdiniInviati(prev => {
      const ordine = prev.find(o => o.id === ordineId);
      if (!ordine) return prev;
      
      // Sposta l'ordine nei ricevuti
      const ordineRicevuto: Ordine = {
        ...ordine,
        tipo: 'ricevuto',
        stato: 'in_corso'
      };
      
      setOrdiniRicevuti(prevRicevuti => [ordineRicevuto, ...prevRicevuti]);
      
      // Rimuovi dai inviati
      return prev.filter(o => o.id !== ordineId);
    });
  };

  const aggiornaQuantitaOrdine = (ordineId: string, dettagli: OrdineDettaglio[]) => {
    console.log('📝 Aggiornando quantità ordine:', ordineId, dettagli);
    
    const nuoveTotali = dettagli.reduce((acc, item) => ({
      bottiglie: acc.bottiglie + (item.quantity * (item.unit === 'cartoni' ? 6 : 1)),
      totale: acc.totale + item.totalPrice
    }), { bottiglie: 0, totale: 0 });

    setOrdiniRicevuti(prev =>
      prev.map(ordine =>
        ordine.id === ordineId
          ? {
              ...ordine,
              dettagli,
              bottiglie: nuoveTotali.bottiglie,
              totale: nuoveTotali.totale
            }
          : ordine
      )
    );
  };

  const confermaRicezioneOrdine = async (ordineId: string) => {
    console.log('✅ Confermando ricezione ordine:', ordineId);
    
    setOrdiniRicevuti(prev => {
      const ordine = prev.find(o => o.id === ordineId);
      if (!ordine) return prev;
      
      // TODO: Qui implementare aggiornamento giacenze
      // Per ora simuliamo l'aggiornamento
      console.log('📦 Aggiornando giacenze per ordine:', ordine);
      
      // Sposta l'ordine nello storico
      const ordineCompletato: Ordine = {
        ...ordine,
        stato: 'completato'
      };
      
      setOrdiniStorico(prevStorico => [ordineCompletato, ...prevStorico]);
      
      // Rimuovi dai ricevuti
      return prev.filter(o => o.id !== ordineId);
    });
  };

  const eliminaOrdineInviato = async (ordineId: string) => {
    console.log('🗑️ Eliminando ordine inviato da Supabase:', ordineId);
    
    const success = await supabaseOrdini.eliminaOrdine(ordineId);
    
    if (success) {
      setOrdiniInviati(prev => {
        const ordine = prev.find(o => o.id === ordineId);
        if (ordine) {
          console.log('📋 Ordine inviato eliminato:', ordine.fornitore, '- €' + ordine.totale.toFixed(2));
        }
        return prev.filter(o => o.id !== ordineId);
      });
    }
  };

  const eliminaOrdineRicevuto = async (ordineId: string) => {
    console.log('🗑️ Eliminando ordine ricevuto da Supabase:', ordineId);
    
    const success = await supabaseOrdini.eliminaOrdine(ordineId);
    
    if (success) {
      setOrdiniRicevuti(prev => {
        const ordine = prev.find(o => o.id === ordineId);
        if (ordine) {
          console.log('📋 Ordine ricevuto eliminato:', ordine.fornitore, '- €' + ordine.totale.toFixed(2));
        }
        return prev.filter(o => o.id !== ordineId);
      });
    }
  };

  const eliminaOrdineStorico = async (ordineId: string) => {
    console.log('🗑️ Eliminando ordine storico da Supabase:', ordineId);
    
    const success = await supabaseOrdini.eliminaOrdine(ordineId);
    
    if (success) {
      setOrdiniStorico(prev => {
        const ordine = prev.find(o => o.id === ordineId);
        if (ordine) {
          console.log('📋 Ordine storico eliminato:', ordine.fornitore, '- €' + ordine.totale.toFixed(2));
        }
        return prev.filter(o => o.id !== ordineId);
      });
    }
  };

  return (
    <OrdiniContext.Provider value={{
      ordiniInviati,
      ordiniRicevuti,
      ordiniStorico,
      loading,
      aggiungiOrdine,
      aggiornaStatoOrdine,
      spostaOrdineInviatiARicevuti,
      aggiornaQuantitaOrdine,
      confermaRicezioneOrdine,
      eliminaOrdineInviato,
      eliminaOrdineRicevuto,
      eliminaOrdineStorico
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

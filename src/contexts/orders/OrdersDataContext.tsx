import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabaseOrdini } from '../../hooks/useSupabaseOrdini';
import { Ordine } from '../../services/ordiniService';

interface OrdersDataContextType {
  ordiniInviati: Ordine[];
  ordiniStorico: Ordine[];
  loading: boolean;
  processingOrders: Set<string>;
  // Internal setters per actions context
  setOrdiniInviati: React.Dispatch<React.SetStateAction<Ordine[]>>;
  setOrdiniStorico: React.Dispatch<React.SetStateAction<Ordine[]>>;
  setProcessingOrders: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const OrdersDataContext = createContext<OrdersDataContextType | undefined>(undefined);

export function OrdersDataProvider({ children }: { children: ReactNode }) {
  const [ordiniInviati, setOrdiniInviati] = useState<Ordine[]>([]);
  const [ordiniStorico, setOrdiniStorico] = useState<Ordine[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());
  
  const supabaseOrdini = useSupabaseOrdini();

  useEffect(() => {
    const loadOrdiniFromSupabase = async () => {
      try {
        setLoading(true);
        console.log('🔄 Caricando ordini da Supabase...');
        const { inviati, storico } = await supabaseOrdini.loadOrdini();
        
        setOrdiniInviati(inviati);
        setOrdiniStorico(storico);
        
        console.log('✅ Ordini caricati:', {
          inviati: inviati.length,
          storico: storico.length
        });
      } catch (error) {
        console.error('❌ Errore caricamento ordini nel context:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrdiniFromSupabase();
  }, []);

  return (
    <OrdersDataContext.Provider value={{
      ordiniInviati,
      ordiniStorico,
      loading,
      processingOrders,
      setOrdiniInviati,
      setOrdiniStorico,
      setProcessingOrders
    }}>
      {children}
    </OrdersDataContext.Provider>
  );
}

export function useOrdersData() {
  const context = useContext(OrdersDataContext);
  if (context === undefined) {
    throw new Error('useOrdersData must be used within an OrdersDataProvider');
  }
  return context;
}

// Selectors per compatibilità
export function useOrdersInviati() {
  const { ordiniInviati } = useOrdersData();
  return ordiniInviati;
}

export function useOrdersStorico() {
  const { ordiniStorico } = useOrdersData();
  return ordiniStorico;
}

export function useOrdersLoading() {
  const { loading } = useOrdersData();
  return loading;
}

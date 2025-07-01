import { useState, useEffect } from 'react';
import { supabase, authManager } from '../lib/supabase';

export interface Supplier {
  id: string;
  fornitore: string;
  telefono: string;
  contatto_email: string;
  min_ordine_importo: number;
  note: string;
  updated_at: string;
}

const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const isValid = await authManager.validateSession();
      if (!isValid) {
        console.log('⚠️ Sessione non valida, fornitori vuoti');
        setSuppliers([]);
        setIsLoading(false);
        return;
      }

      const userId = authManager.getUserId();
      if (!userId) {
        console.warn('⚠️ Utente non autenticato');
        setSuppliers([]);
        setIsLoading(false);
        return;
      }

      console.log('🔍 Caricamento fornitori dalla tabella vini per user:', userId);

      // ✅ RIPRISTINO LOGICA ORIGINALE: leggiamo i fornitori dalla colonna fornitore della tabella vini
      const { data: wines, error } = await supabase
        .from('vini')
        .select('fornitore')
        .eq('user_id', userId)
        .not('fornitore', 'is', null)
        .not('fornitore', 'eq', '');

      if (error) {
        console.error('❌ Errore caricamento fornitori dai vini:', error.message);
        setError(error.message);
        setSuppliers([]);
      } else {
        // Estrai fornitori unici dalla colonna fornitore dei vini
        const allSuppliers = wines?.map(wine => wine.fornitore?.trim()).filter(Boolean) || [];
        console.log('🔍 Tutti i fornitori grezzi dai vini:', allSuppliers);
        
        const uniqueSuppliers = Array.from(new Set(allSuppliers)).sort();
        console.log('🔍 Fornitori unici dopo filtro:', uniqueSuppliers);

        // Crea oggetti Supplier dai nomi dei fornitori estratti dai vini
        const suppliersData: Supplier[] = uniqueSuppliers.map((supplierName, index) => ({
          id: `wine-supplier-${index}`, // ID artificiale per compatibilità
          fornitore: supplierName,
          telefono: '', // Campi vuoti per compatibilità con l'interfaccia
          contatto_email: '',
          min_ordine_importo: 0,
          note: '',
          updated_at: new Date().toISOString()
        }));

        console.log('✅ Fornitori estratti dai vini:', suppliersData.length, suppliersData.map(s => s.fornitore));
        setSuppliers(suppliersData);
      }
    } catch (error) {
      console.error('❌ Errore inatteso:', error);
      setError(error instanceof Error ? error.message : 'Errore sconosciuto');
      setSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const refreshSuppliers = () => {
    setIsLoading(true);
    fetchSuppliers();
  };

  // ✅ DISABILITIAMO le funzioni di modifica perché ora i fornitori derivano dai vini
  const addSupplier = async (): Promise<boolean> => {
    console.warn('⚠️ addSupplier disabilitato: i fornitori ora derivano dalla tabella vini');
    return false;
  };

  const updateSupplier = async (): Promise<boolean> => {
    console.warn('⚠️ updateSupplier disabilitato: i fornitori ora derivano dalla tabella vini');
    return false;
  };

  return {
    suppliers,
    isLoading,
    error,
    refreshSuppliers,
    addSupplier,
    updateSupplier
  };
};

export default useSuppliers;
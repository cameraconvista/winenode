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

      const loadSuppliers = async () => {
    if (!supabase || !authManager.isAuthenticated()) {
      setSuppliers([]);
      setIsLoading(false);
      return;
    }

    const userId = authManager.getUserId();
    if (!userId) {
      setError('ID utente non disponibile');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('🔍 Caricamento fornitori dalla tabella fornitori per user:', userId);

      // Carica direttamente dalla tabella fornitori
      const { data: fornitori, error } = await supabase!
        .from('fornitori')
        .select('*')
        .eq('user_id', userId)
        .order('fornitore', { ascending: true });

      if (error) {
        console.error('❌ Errore caricamento fornitori:', error.message);
        // Se la tabella fornitori è vuota o ha errori, prova a estrarli dai vini come fallback
        if (error.code === 'PGRST116' || error.message.includes('relation "fornitori" does not exist')) {
          console.log('⚠️ Tabella fornitori non disponibile, fallback a estrazione da vini');
          await loadSuppliersFromWines(userId);
          return;
        }
        setError(error.message);
        setSuppliers([]);
      } else if (!fornitori || fornitori.length === 0) {
        console.log('⚠️ Tabella fornitori vuota, provo a popolarla dai vini...');
        await loadSuppliersFromWines(userId);
      } else {
        console.log('✅ Fornitori caricati dalla tabella dedicata:', fornitori.length);
        setSuppliers(fornitori);
      }
    } catch (error) {
      console.error('❌ Errore inatteso:', error);
      setError(error instanceof Error ? error.message : 'Errore sconosciuto');
      setSuppliers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Funzione di fallback per estrarre fornitori dai vini
  const loadSuppliersFromWines = async (userId: string) => {
    try {
      console.log('🔄 Estrazione fornitori dai vini...');

      const { data: wines, error } = await supabase!
        .from('vini')
        .select('fornitore')
        .eq('user_id', userId)
        .not('fornitore', 'is', null)
        .not('fornitore', 'eq', '');

      if (error) throw error;

      const allSuppliers = wines?.map(wine => wine.fornitore?.trim()).filter(Boolean) || [];
      const uniqueSuppliers = Array.from(new Set(allSuppliers)).sort();

      console.log('🔍 Fornitori unici estratti dai vini:', uniqueSuppliers.length, uniqueSuppliers);

      // Crea oggetti Supplier temporanei
      const suppliersData: Supplier[] = uniqueSuppliers.map((supplierName, index) => ({
        id: `temp-${index}`,
        fornitore: supplierName,
        telefono: '',
        contatto_email: '',
        min_ordine_importo: 0,
        note: 'Estratto automaticamente dai vini',
        updated_at: new Date().toISOString()
      }));

      setSuppliers(suppliersData);

      // Suggerisci di popolare la tabella fornitori
      console.log('💡 Suggerimento: Esegui lo script populate-fornitori.js per popolare la tabella fornitori');
    } catch (error) {
      console.error('❌ Errore nell\'estrazione dai vini:', error);
      setSuppliers([]);
    }
  };

      await loadSuppliers();
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
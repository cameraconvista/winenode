
import { useState, useEffect } from 'react';
import { supabase, authManager } from '../lib/supabase';

export interface Supplier {
  id: string;
  nome: string;
  user_id: string;
  created_at: string;
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

      console.log('🔍 Caricamento fornitori dalla tabella fornitori per user:', userId);

      // Prima prova a caricare dalla tabella fornitori
      const { data: fornitori, error: fornitoriError } = await supabase!
        .from('fornitori')
        .select('*')
        .eq('user_id', userId)
        .order('nome', { ascending: true });

      if (fornitoriError) {
        console.error('❌ Errore caricamento fornitori:', fornitoriError.message);
        setError(fornitoriError.message);
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

      if (uniqueSuppliers.length > 0) {
        // Inserisci i fornitori nella tabella fornitori
        const fornitoriData = uniqueSuppliers.map(nome => ({
          nome: nome.toUpperCase(),
          user_id: userId
        }));

        const { data: insertedFornitori, error: insertError } = await supabase!
          .from('fornitori')
          .insert(fornitoriData)
          .select();

        if (insertError) {
          console.error('❌ Errore inserimento fornitori:', insertError);
          // Crea oggetti Supplier temporanei come fallback
          const tempSuppliers: Supplier[] = uniqueSuppliers.map((supplierName, index) => ({
            id: `temp-${index}`,
            nome: supplierName.toUpperCase(),
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          setSuppliers(tempSuppliers);
        } else {
          console.log('✅ Fornitori inseriti nella tabella:', insertedFornitori.length);
          setSuppliers(insertedFornitori);
        }
      } else {
        setSuppliers([]);
      }
    } catch (error) {
      console.error('❌ Errore nell\'estrazione dai vini:', error);
      setSuppliers([]);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const refreshSuppliers = () => {
    fetchSuppliers();
  };

  const addSupplier = async (nome: string): Promise<boolean> => {
    try {
      if (!authManager.isAuthenticated()) {
        console.error('❌ Utente non autenticato');
        return false;
      }

      const userId = authManager.getUserId();
      if (!userId) {
        console.error('❌ ID utente non disponibile');
        return false;
      }

      const { data, error } = await supabase!
        .from('fornitori')
        .insert({
          nome: nome.toUpperCase(),
          user_id: userId
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Errore inserimento fornitore:', error);
        return false;
      }

      console.log('✅ Fornitore aggiunto:', data);
      await refreshSuppliers();
      return true;
    } catch (error) {
      console.error('❌ Errore addSupplier:', error);
      return false;
    }
  };

  const updateSupplier = async (id: string, nome: string): Promise<boolean> => {
    try {
      if (!authManager.isAuthenticated()) {
        console.error('❌ Utente non autenticato');
        return false;
      }

      const { data, error } = await supabase!
        .from('fornitori')
        .update({
          nome: nome.toUpperCase(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Errore aggiornamento fornitore:', error);
        return false;
      }

      console.log('✅ Fornitore aggiornato:', data);
      await refreshSuppliers();
      return true;
    } catch (error) {
      console.error('❌ Errore updateSupplier:', error);
      return false;
    }
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


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
        // Se la tabella non esiste, prova a popolarla dai vini
        if (fornitoriError.code === '42P01') {
          console.log('⚠️ Tabella fornitori non trovata, estrazione dai vini...');
          await loadSuppliersFromWines(userId);
        } else {
          setError(fornitoriError.message);
          setSuppliers([]);
        }
      } else if (!fornitori || fornitori.length === 0) {
        console.log('⚠️ Tabella fornitori vuota, popolo dai vini...');
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

      // Prova prima dalla tabella 'giacenze' (nome moderno)
      let { data: wines, error } = await supabase!
        .from('giacenze')
        .select('supplier')
        .eq('user_id', userId)
        .not('supplier', 'is', null)
        .not('supplier', 'eq', '');

      // Se giacenze è vuota o ha errori, prova dalla tabella 'vini' (nome legacy)
      if (error || !wines || wines.length === 0) {
        console.log('🔄 Provo dalla tabella vini (legacy)...');
        const { data: winesLegacy, error: errorLegacy } = await supabase!
          .from('vini')
          .select('fornitore')
          .eq('user_id', userId)
          .not('fornitore', 'is', null)
          .not('fornitore', 'eq', '');

        if (errorLegacy) throw errorLegacy;
        
        // Converti il formato da vini a giacenze
        wines = winesLegacy?.map(wine => ({ supplier: wine.fornitore })) || [];
      }

      const allSuppliers = wines?.map(wine => wine.supplier?.trim()).filter(Boolean) || [];
      const uniqueSuppliers = Array.from(new Set(allSuppliers)).sort();

      console.log('🔍 Fornitori unici estratti:', uniqueSuppliers.length, uniqueSuppliers);

      if (uniqueSuppliers.length > 0) {
        // Inserisci i fornitori nella tabella fornitori
        const fornitoriData = uniqueSuppliers.map(nome => ({
          nome: nome.toUpperCase(),
          user_id: userId
        }));

        console.log('💾 Inserimento fornitori in tabella:', fornitoriData);

        const { data: insertedFornitori, error: insertError } = await supabase!
          .from('fornitori')
          .insert(fornitoriData)
          .select();

        if (insertError) {
          console.error('❌ Errore inserimento fornitori:', insertError);
          
          // Se l'errore è di duplicato, prova a recuperare i fornitori esistenti
          if (insertError.code === '23505') {
            console.log('🔄 Fornitori già esistenti, recupero dalla tabella...');
            const { data: existingFornitori, error: fetchError } = await supabase!
              .from('fornitori')
              .select('*')
              .eq('user_id', userId)
              .order('nome', { ascending: true });

            if (!fetchError && existingFornitori) {
              setSuppliers(existingFornitori);
              return;
            }
          }
          
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
          console.log('✅ Fornitori inseriti nella tabella:', insertedFornitori?.length || 0);
          setSuppliers(insertedFornitori || []);
        }
      } else {
        console.log('⚠️ Nessun fornitore trovato nei vini');
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

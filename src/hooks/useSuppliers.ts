import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

      // Query diretta DB senza filtri user_id (RLS disabilitata)
      const { data: fornitori, error: fornitoriError } = await supabase
        .from('fornitori')
        .select('*')
        .order('nome', { ascending: true });

      if (fornitoriError) {
        if (fornitoriError.code === '42P01') {
          await loadSuppliersFromWines();
        } else {
          throw fornitoriError;
        }
      } else {
        setSuppliers(fornitori || []);
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
  const loadSuppliersFromWines = async () => {
    try {
      console.log('🔄 Estrazione fornitori dai vini...');

      // Prova prima dalla tabella 'giacenze' (nome moderno)
      let { data: wines, error } = await supabase!
        .from('giacenze')
        .select('supplier')
        .not('supplier', 'is', null)
        .not('supplier', 'eq', '');

      // Se giacenze è vuota o ha errori, prova dalla tabella 'vini' (nome legacy)
      if (error || !wines || wines.length === 0) {
        const { data: viniData, error: viniError } = await supabase
          .from('vini')
          .select('fornitore')
          .not('fornitore', 'is', null)
          .not('fornitore', 'eq', '');

        if (viniError) throw viniError;

        // Converti il formato da vini a giacenze
        wines = viniData?.map(wine => ({ supplier: wine.fornitore })) || [];
      }

      const allSuppliers = wines?.map(wine => wine.supplier?.trim()).filter(Boolean) || [];
      const uniqueSuppliers = Array.from(new Set(allSuppliers)).sort();

      console.log('🔍 Fornitori unici estratti:', uniqueSuppliers.length, uniqueSuppliers);

      if (uniqueSuppliers.length > 0) {
        // Inserisci i fornitori nella tabella fornitori
        const fornitoriData = uniqueSuppliers.map(nome => ({
          nome: nome.toUpperCase()
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
            const { data: existingFornitori, error: selectError } = await supabase
              .from('fornitori')
              .select('*')
              .order('nome', { ascending: true });

            if (!selectError && existingFornitori) {
              setSuppliers(existingFornitori);
              return;
            }
          }

          // Crea oggetti Supplier temporanei come fallback
          const fornitoriWithIds = uniqueSuppliers.map((nome, index) => ({
            id: `temp-${index}`,
            nome: nome.toUpperCase(),
            user_id: 'service-user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          setSuppliers(fornitoriWithIds);
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
      const { data, error } = await supabase
        .from('fornitori')
        .insert({
          nome: nome.toUpperCase()
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
      const { data, error } = await supabase
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
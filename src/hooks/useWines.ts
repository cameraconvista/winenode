import { useState, useEffect, useCallback } from 'react';
import { supabase, authManager } from '../lib/supabase';

// ✅ Debounce utility per evitare aggiornamenti troppo rapidi
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

export interface WineType {
  id: string; // ✅ Cambiato da number a string per UUID
  name: string;
  type: string;
  supplier: string;
  inventory: number;
  minStock: number;
  price: string;
  cost?: number;
  vintage: string | null;
  region: string | null;
  description: string | null;
}

const useWines = () => {
  const [wines, setWines] = useState<WineType[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWines = async () => {
    try {
      setLoading(true);
      const isValid = await authManager.validateSession();
      const userId = authManager.getUserId();
      if (!isValid || !userId) throw new Error('Utente non autenticato');

      const { data, error } = await supabase
        .from('vini')
        .select(`*, giacenza(giacenzaa, vino_id, user_id)`)
        .eq('user_id', userId)
        .order('id', { ascending: true });

      if (error) throw error;

      const winesData: WineType[] = (data || []).map((wine: any) => {
        let inventory = 0;
        if (Array.isArray(wine.giacenza) && wine.giacenza.length > 0) {
          inventory = wine.giacenza[0]?.giacenzaa || 0;
        } else if (typeof wine.giacenza === 'object' && wine.giacenza?.giacenzaa) {
          inventory = wine.giacenza.giacenzaa;
        }

        const wineData = {
          id: wine.id,
          name: wine.nome_vino || '',
          type: wine.tipologia || '',
          supplier: wine.fornitore || '',
          inventory,
          minStock: wine.min_stock || 2,
          price: wine.vendita?.toString() || '',
          cost: wine.costo,
          vintage: wine.anno || null,
          region: wine.provenienza || null,
          description: wine.produttore || null
        };
        
        // Debug log per verificare tipologia
        console.log(`🍷 Vino "${wineData.name}" - Tipologia: "${wineData.type}"`);
        
        return wineData;
      });

      const uniqueSuppliers = Array.from(new Set(winesData.map(w => w.supplier).filter(Boolean))).sort();

      setWines(winesData);
      setSuppliers(uniqueSuppliers);
      setError(null);
    } catch (err: any) {
      console.error('❌ Errore caricamento vini:', err.message);
      setError(err.message);
      setWines([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateWineInventory = async (id: string, newInventory: number): Promise<boolean> => {
    const userId = authManager.getUserId();
    if (!userId) {
      console.error('❌ User ID non disponibile');
      return false;
    }

    try {
      console.log('📡 Invio aggiornamento giacenza a Supabase:', { vino_id: id, giacenzaa: newInventory, user_id: userId });
      
      const { data, error } = await supabase
        .from('giacenza')
        .upsert({
          vino_id: id,
          giacenzaa: newInventory,
          user_id: userId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'vino_id,user_id' // ✅ Specifica la chiave di conflitto
        })
        .select();

      if (error) {
        console.error('❌ Errore Supabase:', error);
        throw error;
      }

      console.log('✅ Risposta Supabase:', data);

      // Aggiorna lo stato locale solo dopo successo di Supabase
      setWines(prev =>
        prev.map(w => (w.id === id ? { ...w, inventory: newInventory } : w))
      );
      
      return true;
    } catch (err: any) {
      console.error('❌ Errore completo aggiornamento giacenza:', {
        error: err,
        message: err.message,
        details: err.details,
        vino_id: id,
        giacenzaa: newInventory,
        user_id: userId
      });
      return false;
    }
  };

  const updateWine = async (id: string, updates: Partial<WineType>): Promise<boolean> => {
    const userId = authManager.getUserId();
    try {
      const updatesDb: any = {};
      if (updates.name !== undefined) updatesDb.nome_vino = updates.name;
      if (updates.type !== undefined) updatesDb.tipologia = updates.type;
      if (updates.supplier !== undefined) updatesDb.fornitore = updates.supplier;
      if (updates.minStock !== undefined) updatesDb.min_stock = updates.minStock;
      if (updates.price !== undefined) updatesDb.vendita = parseFloat(updates.price);
      if (updates.cost !== undefined) updatesDb.costo = updates.cost;
      if (updates.vintage !== undefined) updatesDb.anno = updates.vintage;
      if (updates.region !== undefined) updatesDb.provenienza = updates.region;
      if (updates.description !== undefined) updatesDb.produttore = updates.description;

      if (Object.keys(updatesDb).length > 0) {
        const { error } = await supabase
          .from('vini')
          .update(updatesDb)
          .eq('id', id)
          .eq('user_id', userId);
        if (error) throw error;
      }

      if (updates.inventory !== undefined) {
        const { error } = await supabase
          .from('giacenza')
          .upsert({
            vino_id: id,
            giacenzaa: updates.inventory,
            user_id: userId,
            updated_at: new Date().toISOString()
          });
        if (error) throw error;
      }

      setWines(prev =>
        prev.map(w => (w.id === id ? { ...w, ...updates } : w))
      );
      return true;
    } catch (err: any) {
      console.error('❌ Errore aggiornamento vino:', err.message);
      return false;
    }
  };

  // ✅ Versione debounced per aggiornamenti rapidi
  const debouncedUpdateInventory = useCallback(
    debounce(updateWineInventory, 500), // 500ms di debounce
    []
  );

  useEffect(() => {
    fetchWines();
  }, []);

  return {
    wines,
    suppliers,
    loading,
    error,
    refreshWines: fetchWines,
    updateWineInventory,
    updateWine,
    debouncedUpdateInventory // ✅ Funzione debounced per UI rapida
  };
};

export default useWines;
export { useWines };

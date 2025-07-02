import { useState, useEffect } from 'react';
import { supabase, authManager } from '../lib/supabase';

export interface WineType {
  id: string;
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
  ordineMinimo?: number;
  unitaOrdine?: 'bottiglie' | 'cartoni';
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

      // Prima recupera i vini
      const { data: viniData, error: viniError } = await supabase
        .from('vini')
        .select('*')
        .eq('user_id', userId)
        .order('nome_vino', { ascending: true });

      if (viniError) throw viniError;

      // Poi recupera le giacenze
      const { data: giacenzeData, error: giacenzeError } = await supabase
        .from('giacenza')
        .select('*')
        .eq('user_id', userId);

      if (giacenzeError) throw giacenzeError;

      // Crea una mappa delle giacenze per vino_id
      const giacenzeMap = new Map();
      (giacenzeData || []).forEach((g: any) => {
        giacenzeMap.set(g.vino_id, g);
      });

      const mappedWines: WineType[] = (viniData || []).map((wine: any) => {
        const giacenzaData = giacenzeMap.get(wine.id);
        return {
          id: wine.id,
          name: wine.nome_vino || '',
          type: wine.tipologia || '',
          supplier: wine.fornitore || '',
          inventory: giacenzaData?.giacenza ?? 0,
          minStock: giacenzaData?.min_stock ?? 2,
          price: wine.vendita?.toString() || '',
          cost: wine.costo || 0,
          vintage: wine.anno?.toString() || '',
          region: wine.provenienza || '',
          description: wine.produttore || '',
          ordineMinimo: wine.ordine_minimo || 12,
          unitaOrdine: wine.unita_ordine || 'bottiglie'
        };
      });

      const uniqueSuppliers = Array.from(new Set(mappedWines.map(w => w.supplier).filter(Boolean))).sort();

      setWines(mappedWines);
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
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('giacenza')
        .upsert({
          vino_id: id,
          giacenza: newInventory,
          user_id: userId,
          updated_at: new Date().toISOString()
        }, { onConflict: 'vino_id,user_id' });

      if (error) throw error;

      setWines(prev =>
        prev.map(w => (w.id === id ? { ...w, inventory: newInventory } : w))
      );

      return true;
    } catch (err: any) {
      console.error('❌ Errore aggiornamento giacenza:', err.message);
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
      if (updates.ordineMinimo !== undefined) updatesDb.ordine_minimo = updates.ordineMinimo;
      if (updates.unitaOrdine !== undefined) updatesDb.unita_ordine = updates.unitaOrdine;

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
            giacenza: updates.inventory,
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
    updateWine
  };
};

export default useWines;
export { useWines };
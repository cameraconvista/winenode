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
    setLoading(true);
    try {
      const isValid = await authManager.validateSession();
      const userId = authManager.getUserId();
      if (!isValid || !userId) throw new Error('Utente non autenticato');

      const [{ data: viniData, error: viniError }, { data: giacenzeData, error: giacenzeError }] = await Promise.all([
        supabase.from('vini').select('*').eq('user_id', userId).order('nome_vino', { ascending: true }),
        supabase.from('giacenza').select('*').eq('user_id', userId)
      ]);

      if (viniError) throw viniError;
      if (giacenzeError) throw giacenzeError;

      const giacenzeMap = new Map(giacenzeData?.map((g: any) => [g.vino_id, g]));

      const mappedWines: WineType[] = (viniData || []).map((wine: any) => {
        const g = giacenzeMap.get(wine.id);
        return {
          id: wine.id,
          name: wine.nome_vino || '',
          type: wine.tipologia || '',
          supplier: wine.fornitore || '',
          inventory: g?.giacenza ?? 0,
          minStock: g?.min_stock ?? 2,
          price: wine.vendita?.toString() || '',
          cost: wine.costo || 0,
          vintage: wine.anno?.toString() || '',
          region: wine.provenienza || '',
          description: wine.produttore || '',
          ordineMinimo: wine.ordine_minimo || 12,
          unitaOrdine: wine.unita_ordine || 'bottiglie'
        };
      });

      const uniqueSuppliers = [...new Set(mappedWines.map(w => w.supplier).filter(Boolean))].sort();
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
      const { error } = await supabase.from('giacenza').upsert({
        vino_id: id,
        giacenza: newInventory,
        user_id: userId,
        updated_at: new Date().toISOString()
      }, { onConflict: 'vino_id,user_id' });

      if (error) throw error;
      setWines(prev => prev.map(w => (w.id === id ? { ...w, inventory: newInventory } : w)));
      return true;
    } catch (err: any) {
      console.error('❌ Errore aggiornamento giacenza:', err.message);
      return false;
    }
  };

  const updateWine = async (id: string, updates: Partial<WineType>): Promise<boolean> => {
    const userId = authManager.getUserId();
    if (!userId) return false;

    try {
      const updatesDb: any = {
        ...(updates.name !== undefined && { nome_vino: updates.name }),
        ...(updates.type !== undefined && { tipologia: updates.type }),
        ...(updates.supplier !== undefined && { fornitore: updates.supplier }),
        ...(updates.minStock !== undefined && { min_stock: updates.minStock }),
        ...(updates.price !== undefined && { vendita: parseFloat(updates.price) }),
        ...(updates.cost !== undefined && { costo: updates.cost }),
        ...(updates.vintage !== undefined && { anno: updates.vintage }),
        ...(updates.region !== undefined && { provenienza: updates.region }),
        ...(updates.description !== undefined && { produttore: updates.description }),
        ...(updates.ordineMinimo !== undefined && { ordine_minimo: updates.ordineMinimo }),
        ...(updates.unitaOrdine !== undefined && { unita_ordine: updates.unitaOrdine })
      };

      if (Object.keys(updatesDb).length > 0) {
        const { error } = await supabase.from('vini').update(updatesDb).eq('id', id).eq('user_id', userId);
        if (error) throw error;
      }

      if (updates.inventory !== undefined) {
        const { error } = await supabase.from('giacenza').upsert({
          vino_id: id,
          giacenza: updates.inventory,
          user_id: userId,
          updated_at: new Date().toISOString()
        });
        if (error) throw error;
      }

      setWines(prev => prev.map(w => (w.id === id ? { ...w, ...updates } : w)));
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

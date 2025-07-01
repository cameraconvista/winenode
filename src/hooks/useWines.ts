
import { useState, useEffect } from 'react';
import { supabase, authManager } from '../lib/supabase';

export interface WineType {
  id: number;
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

export const useWines = () => {
  const [wines, setWines] = useState<WineType[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWines = async () => {
    try {
      setLoading(true);
      setError(null);

      const isValid = await authManager.validateSession();
      if (!isValid) {
        console.log('⚠️ Sessione non valida, vini vuoti');
        setWines([]);
        setSuppliers([]);
        setLoading(false);
        return;
      }

      const userId = authManager.getUserId();
      if (!userId) {
        console.warn('⚠️ Utente non autenticato');
        setWines([]);
        setSuppliers([]);
        setLoading(false);
        return;
      }

      console.log('🔍 Caricamento vini per user:', userId);

      // Query con JOIN per ottenere vini e giacenza dalla tabella giacenza
      const { data, error } = await supabase
        .from('vini')
        .select(`
          *,
          giacenza(
            giacenzaa,
            vino_id,
            user_id
          )
        `)
        .eq('user_id', userId)
        .order('id', { ascending: true });

      console.log('🔍 Query JOIN eseguita, risultato:', { data: data?.slice(0, 2), error });

      if (error) {
        console.error('❌ Errore caricamento vini con JOIN:', error.message);
        
        // Fallback: carica i vini senza giacenza e poi carica le giacenze separatamente
        console.log('🔄 Tentativo fallback: caricamento separato vini e giacenze');
        
        const { data: viniData, error: viniError } = await supabase
          .from('vini')
          .select('*')
          .eq('user_id', userId)
          .order('id', { ascending: true });

        if (viniError) {
          console.error('❌ Errore caricamento vini (fallback):', viniError.message);
          setError(viniError.message);
          setWines([]);
          setSuppliers([]);
          return;
        }

        // Carica tutte le giacenze per questo utente
        const { data: giacenzeData, error: giacenzeError } = await supabase
          .from('giacenza')
          .select('vino_id, giacenzaa')
          .eq('user_id', userId);

        console.log('🔍 Dati giacenze separate:', giacenzeData);

        if (giacenzeError) {
          console.error('❌ Errore caricamento giacenze:', giacenzeError.message);
        }

        // Combina i dati manualmente
        const winesData: WineType[] = (viniData || []).map(wine => {
          const giacenza = giacenzeData?.find(g => g.vino_id === wine.id);
          const inventory = giacenza ? giacenza.giacenzaa : 0;
          
          console.log(`🔍 Vino ${wine.nome_vino} (ID: ${wine.id}) -> Giacenza: ${inventory}`);

          return {
            id: wine.id,
            name: wine.nome_vino || '',
            type: wine.tipologia || '',
            supplier: wine.fornitore || '',
            inventory: inventory,
            minStock: wine.min_stock || 2,
            price: wine.vendita?.toString() || '',
            cost: wine.costo,
            vintage: wine.anno || null,
            region: wine.provenienza || null,
            description: wine.produttore || null
          };
        });

        const uniqueSuppliers = Array.from(
          new Set(winesData
            .map(wine => wine.supplier?.trim())
            .filter(Boolean)
          )
        ).sort();

        console.log('✅ Vini caricati (fallback):', winesData.length);
        console.log('✅ Fornitori estratti (fallback):', uniqueSuppliers.length, uniqueSuppliers);

        setWines(winesData);
        setSuppliers(uniqueSuppliers);
      } else {
        console.log('🔍 Dati vini grezzi da Supabase:', data?.slice(0, 3));
        console.log('🔍 Struttura giacenza primo vino:', data?.[0]?.giacenza);
        console.log('🔍 Totale vini caricati da DB:', data?.length);
        
        // Log dettagliato per ogni vino con giacenza
        data?.slice(0, 5).forEach((wine, index) => {
          console.log(`🔍 Vino ${index + 1} - ID: ${wine.id}, Nome: ${wine.nome_vino}`);
          console.log(`   Giacenza raw:`, wine.giacenza);
          console.log(`   Giacenza type:`, typeof wine.giacenza);
          console.log(`   Giacenza is array:`, Array.isArray(wine.giacenza));
          if (Array.isArray(wine.giacenza) && wine.giacenza.length > 0) {
            console.log(`   Prima giacenza:`, wine.giacenza[0]);
          }
        });
        
        // Trasforma i dati dal formato Supabase al formato dell'app
        const winesData: WineType[] = (data || []).map((wine, index) => {
          // Estrai la giacenza dal JOIN - log dettagliato
          let inventory = 0;
          
          console.log(`🔍 Vino ${index + 1} (ID: ${wine.id}):`, {
            nome: wine.nome_vino,
            giacenza_raw: wine.giacenza,
            giacenza_type: typeof wine.giacenza,
            giacenza_is_array: Array.isArray(wine.giacenza)
          });

          if (wine.giacenza && Array.isArray(wine.giacenza) && wine.giacenza.length > 0) {
            inventory = wine.giacenza[0].giacenzaa || 0;
            console.log(`✅ Giacenza da array: ${inventory}`);
          } else if (wine.giacenza && typeof wine.giacenza === 'object' && wine.giacenza.giacenzaa !== undefined) {
            inventory = wine.giacenza.giacenzaa || 0;
            console.log(`✅ Giacenza da oggetto: ${inventory}`);
          } else {
            console.log(`❌ Nessuna giacenza trovata per vino ID ${wine.id}`);
          }

          return {
            id: wine.id,
            name: wine.nome_vino || '',
            type: wine.tipologia || '',
            supplier: wine.fornitore || '',
            inventory: inventory,
            minStock: wine.min_stock || 2,
            price: wine.vendita?.toString() || '',
            cost: wine.costo,
            vintage: wine.anno || null,
            region: wine.provenienza || null,
            description: wine.produttore || null
          };
        });

        // Estrai fornitori unici
        const uniqueSuppliers = Array.from(
          new Set(winesData
            .map(wine => wine.supplier?.trim())
            .filter(Boolean)
          )
        ).sort();

        console.log('✅ Vini caricati:', winesData.length);
        console.log('✅ Fornitori estratti:', uniqueSuppliers.length, uniqueSuppliers);

        setWines(winesData);
        setSuppliers(uniqueSuppliers);
      }
    } catch (error) {
      console.error('❌ Errore inatteso:', error);
      setError(error instanceof Error ? error.message : 'Errore sconosciuto');
      setWines([]);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateWineInventory = async (id: number, newInventory: number): Promise<boolean> => {
    try {
      const userId = authManager.getUserId();
      console.log('🔄 updateWineInventory chiamata:', { id, newInventory, userId });

      // Prima verifica se esiste già una giacenza per questo vino
      const { data: existingData, error: checkError } = await supabase
        .from('giacenza')
        .select('vino_id, giacenzaa')
        .eq('vino_id', id)
        .eq('user_id', userId);

      console.log('🔍 Giacenza esistente prima dell\'aggiornamento:', existingData);

      // Aggiorna la giacenza nella tabella giacenza usando UPSERT
      const { data, error } = await supabase
        .from('giacenza')
        .upsert({ 
          vino_id: id,
          giacenzaa: newInventory,
          user_id: userId,
          updated_at: new Date().toISOString()
        })
        .eq('vino_id', id)
        .eq('user_id', userId)
        .select('vino_id, giacenzaa');

      if (error) {
        console.error('❌ Errore aggiornamento giacenza su Supabase:', error.message, error);
        return false;
      }

      console.log('✅ Giacenza aggiornata su Supabase:', data);

      // Verifica l'aggiornamento
      const { data: verifyData, error: verifyError } = await supabase
        .from('giacenza')
        .select('vino_id, giacenzaa, updated_at')
        .eq('vino_id', id)
        .eq('user_id', userId);

      console.log('🔍 Verifica giacenza dopo aggiornamento:', verifyData);

      // Aggiorna lo stato locale dopo il salvataggio riuscito
      setWines(prev => {
        const updated = prev.map(wine => 
          wine.id === id ? { ...wine, inventory: newInventory } : wine
        );
        console.log('🔄 Stato locale aggiornato per vino ID:', id);
        return updated;
      });

      return true;
    } catch (error) {
      console.error('❌ Errore inatteso aggiornamento giacenza:', error);
      return false;
    }
  };

  const updateWine = async (id: number, updates: Partial<WineType>): Promise<boolean> => {
    try {
      // Trasforma i dati dal formato app al formato Supabase (esclusa giacenza)
      const supabaseUpdates: any = {};
      if (updates.name !== undefined) supabaseUpdates.nome_vino = updates.name;
      if (updates.type !== undefined) supabaseUpdates.tipologia = updates.type;
      if (updates.supplier !== undefined) supabaseUpdates.fornitore = updates.supplier;
      if (updates.minStock !== undefined) supabaseUpdates.min_stock = updates.minStock;
      if (updates.price !== undefined) supabaseUpdates.vendita = parseFloat(updates.price) || 0;
      if (updates.vintage !== undefined) supabaseUpdates.anno = updates.vintage;
      if (updates.region !== undefined) supabaseUpdates.provenienza = updates.region;
      if (updates.description !== undefined) supabaseUpdates.produttore = updates.description;
      if (updates.cost !== undefined) supabaseUpdates.costo = updates.cost;

      // Aggiorna i dati del vino se ci sono modifiche (esclusa giacenza)
      if (Object.keys(supabaseUpdates).length > 0) {
        const { error: wineError } = await supabase
          .from('vini')
          .update(supabaseUpdates)
          .eq('id', id)
          .eq('user_id', authManager.getUserId());

        if (wineError) {
          console.error('❌ Errore aggiornamento vino:', wineError.message);
          return false;
        }
      }

      // Aggiorna la giacenza separatamente se necessario
      if (updates.inventory !== undefined) {
        const { error: giacenzaError } = await supabase
          .from('giacenza')
          .upsert({
            vino_id: id,
            giacenzaa: updates.inventory,
            user_id: authManager.getUserId(),
            updated_at: new Date().toISOString()
          })
          .eq('vino_id', id)
          .eq('user_id', authManager.getUserId());

        if (giacenzaError) {
          console.error('❌ Errore aggiornamento giacenza:', giacenzaError.message);
          return false;
        }
      }

      // Aggiorna lo stato locale
      setWines(prev => 
        prev.map(wine => 
          wine.id === id ? { ...wine, ...updates } : wine
        )
      );

      // Ricalcola i fornitori se il supplier è cambiato
      if (updates.supplier !== undefined) {
        setWines(currentWines => {
          const uniqueSuppliers = Array.from(
            new Set(currentWines
              .map(wine => wine.supplier?.trim())
              .filter(Boolean)
            )
          ).sort();
          setSuppliers(uniqueSuppliers);
          return currentWines;
        });
      }

      return true;
    } catch (error) {
      console.error('❌ Errore inatteso aggiornamento vino:', error);
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

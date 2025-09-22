import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useAnno = () => {
  const [anni, setAnni] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAnni = async () => {
    setLoading(true);
    try {
      // Query diretta senza filtri user_id (tenant unico)
      const { data, error } = await supabase
        .from('vini')
        .select('anno')
        .not('anno', 'is', null);

      if (error) throw error;

      const uniqueAnni = [...new Set(data?.map(v => v.anno?.toString()).filter(Boolean))].sort();
      setAnni(uniqueAnni);
    } catch (error) {
      console.error('Errore caricamento anni:', error);
      setAnni([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnni();
  }, []);

  return { anni, loading, refreshAnni: fetchAnni };
};
import { useState, useEffect } from 'react';
import { supabase, authManager } from '../lib/supabase';

export const useAnni = () => {
  const [anni, setAnni] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAnni = async () => {
    setLoading(true);
    try {
      const userId = authManager.getUserId();
      if (!userId) return;

      const { data, error } = await supabase
        .from('vini')
        .select('anno')
        .eq('user_id', userId)
        .not('anno', 'is', null);

      if (error) throw error;

      const uniqueAnni = [...new Set(
        data?.map(v => v.anno?.toString()).filter(Boolean)
      )].sort((a, b) => parseInt(b) - parseInt(a)); // Anni più recenti primi

      setAnni(uniqueAnni);
    } catch (error) {
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
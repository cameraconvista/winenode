import { supabase } from '../lib/supabase';

export interface Fornitore {
  id: string;
  nome: string;
}

/**
 * Recupera l'elenco dei fornitori dalla tabella public.fornitori
 * Ordinati alfabeticamente per nome
 */
export async function getFornitori(): Promise<Fornitore[]> {
  try {
    const { data, error } = await supabase
      .from('fornitori')
      .select('id, nome')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Errore caricamento fornitori:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Errore getFornitori:', error);
    return [];
  }
}

/**
 * Recupera solo i nomi dei fornitori (per compatibilità con filtri esistenti)
 */
export async function getFornitoriNames(): Promise<string[]> {
  try {
    const fornitori = await getFornitori();
    return fornitori.map(f => f.nome);
  } catch (error) {
    console.error('Errore getFornitoriNames:', error);
    return [];
  }
}

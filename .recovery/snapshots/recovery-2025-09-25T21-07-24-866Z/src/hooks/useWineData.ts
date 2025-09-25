// useWineData.ts - versione ottimizzata e modulare con cache localStorage

import { useState } from 'react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';
import { WineRow } from '../lib/constants';
import { parseCsvWineRows, buildEmptyRows } from '../utils/wineUtils';
import { getUserId } from '../config/constants';

const csvUrls = {
  "BOLLICINE ITALIANE": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=294419425&single=true&output=csv",
  "BOLLICINE FRANCESI": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=700257433&single=true&output=csv",
  BIANCHI: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=2127910877&single=true&output=csv",
  ROSSI: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=254687727&single=true&output=csv",
  ROSATI: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=498630601&single=true&output=csv",
  "VINI DOLCI": "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=1582691495&single=true&output=csv",
};

// Cache localStorage per CSV
interface CacheData {
  timestamp: number;
  csvText: string;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ore

const getCacheKey = (categoria: string) => `csvCache-${categoria}`;

const getCachedData = (categoria: string): string | null => {
  try {
    const cached = localStorage.getItem(getCacheKey(categoria));
    if (!cached) return null;
    const data: CacheData = JSON.parse(cached);
    if (Date.now() - data.timestamp > CACHE_DURATION) {
      localStorage.removeItem(getCacheKey(categoria));
      return null;
    }
    return data.csvText;
  } catch (err) {
    console.error('Errore cache lettura:', err);
    return null;
  }
};

const setCachedData = (categoria: string, csvText: string): void => {
  try {
    const cacheData: CacheData = { timestamp: Date.now(), csvText };
    localStorage.setItem(getCacheKey(categoria), JSON.stringify(cacheData));
  } catch (err) {
    console.error('Errore cache scrittura:', err);
  }
};

const clearCache = (categoria?: string): void => {
  try {
    if (categoria) {
      localStorage.removeItem(getCacheKey(categoria));
      console.log(`🗑️ Cache pulita per ${categoria}`);
    } else {
      // Pulisci tutta la cache CSV
      Object.keys(csvUrls).forEach(cat => {
        localStorage.removeItem(getCacheKey(cat));
      });
      console.log('🗑️ Cache CSV completamente pulita');
    }
  } catch (err) {
    console.error('Errore pulizia cache:', err);
  }
};



export function useWineData() {
  const [wineRows, setWineRows] = useState<WineRow[]>([]);
  const [allWineRows, setAllWineRows] = useState<WineRow[]>([]);

  const upsertToSupabase = async (wine: WineRow, fallbackTipologia?: string) => {
    try {
      // App senza autenticazione - inserimento diretto
      if (!wine.nomeVino?.trim()) return;

      const nome = wine.nomeVino.trim();
      const { data: existing } = await supabase
        .from('vini')
        .select('id')
        .eq('nome_vino', nome)
        // Nessun filtro user_id (tenant unico)
        .single();

      const wineData = {
        nome_vino: nome,
        anno: wine.anno || null,
        produttore: wine.produttore || null,
        provenienza: wine.provenienza || null,
        fornitore: wine.fornitore || null,
        tipologia: wine.tipologia || fallbackTipologia,
        user_id: getUserId(),
      };

      const query = existing
        ? supabase.from('vini').update(wineData).eq('id', existing.id)
        : supabase.from('vini').insert(wineData);

      const { data: wineResult, error } = await query.select().single();
      if (error) {
        console.error(`${existing ? 'Update' : 'Insert'} error:`, error);
        return;
      }

      // Gestisci la giacenza nella tabella giacenze
      const wineId = existing?.id || wineResult?.id;
      if (wineId) {
        const { error: giacenzaError } = await supabase
          .from('giacenza')
          .upsert({
            vino_id: wineId,
            giacenzaa: wine.giacenza ?? 0,
            user_id: getUserId(),
            updated_at: new Date().toISOString()
          })
          .eq('vino_id', wineId)
          // Nessun filtro user_id (tenant unico);

        if (giacenzaError) {
          console.error('Errore upsert giacenza:', giacenzaError);
        }
      }
    } catch (err) {
      console.error('Errore upsert Supabase:', err);
    }
  };

  const fetchAndParseCSV = async (url: string, categoria: string) => {
    try {
      let csvText = getCachedData(categoria);
      if (!csvText) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        csvText = await res.text();
        setCachedData(categoria, csvText);
      }

      const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: false });
      const winesFromCsv = parseCsvWineRows(parsed.data, categoria);

      for (const wine of winesFromCsv) {
        if (wine.nomeVino.trim()) await upsertToSupabase(wine, categoria);
      }

      // Query diretta senza user_id (tenant unico)

      // Ottieni le giacenze dalla tabella giacenza con JOIN ai vini
      const { data: dbGiacenze } = await supabase
        .from('giacenza')
        .select(`
          giacenzaa,
          vini!inner(nome_vino)
        `)
        // Nessun filtro user_id (tenant unico)
        .eq('vini.tipologia', categoria)
        .eq('vini.user_id', getUserId());

      const giacenze = new Map(
        (dbGiacenze || []).map(g => [g.vini?.nome_vino?.trim().toLowerCase(), g.giacenzaa || 0])
      );

      const ordered = winesFromCsv.map((w, index) => ({
        ...w,
        giacenza: giacenze.get(w.nomeVino.trim().toLowerCase()) ?? 0,
        ordine: index // preserva posizione originale CSV
      }));

      // Mantieni l'ordine originale del CSV (senza ordinamento alfabetico)
      const padded = [...winesFromCsv, ...buildEmptyRows(Math.max(0, 100 - winesFromCsv.length))];
      setWineRows(padded);
      setAllWineRows(prev => {
        // Remove existing wines from this category to avoid duplicates
        const filtered = prev.filter(wine => wine.tipologia !== categoria);
        return [...filtered, ...winesFromCsv];
      });
    } catch (err) {
      alert(`Errore caricamento ${categoria}: ${err}`);
    }
  };

  return {
    wineRows,
    setWineRows,
    allWineRows,
    setAllWineRows,
    fetchAndParseCSV,
    upsertToSupabase,
    csvUrls,
    clearCache,
  };
}
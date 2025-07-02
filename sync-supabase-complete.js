

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import Papa from 'papaparse';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

// User ID corretto
const user_id = '02c85ceb-8026-4bd9-9dc5-c03a74f56346';

const CATEGORIES = {
  'BOLLICINE ITALIANE': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=294419425&single=true&output=csv',
  'BOLLICINE FRANCESI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=700257433&single=true&output=csv',
  'BIANCHI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=2127910877&single=true&output=csv',
  'ROSSI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=254687727&single=true&output=csv',
  'ROSATI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=498630601&single=true&output=csv',
  'VINI DOLCI': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy/pub?gid=1582691495&single=true&output=csv',
};

function parseEuro(value) {
  if (!value || value === '' || value === null || value === undefined) return null;
  const cleaned = value.toString().replace(/[^\d.,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

async function downloadCSV(url, tipo) {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`📥 Tentativo ${attempts}/${maxAttempts} per ${tipo}...`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/csv,application/csv,text/plain,*/*',
          'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let csvText = await response.text();
      console.log(`📊 ${tipo} - Dimensione risposta: ${csvText.length} caratteri`);

      // Gestione redirect HTML
      if (csvText.includes('<HTML>') || csvText.includes('<html>') || csvText.includes('<!DOCTYPE')) {
        console.log(`🔄 ${tipo} - Rilevato HTML, estrazione URL redirect...`);
        
        const redirectMatches = [
          /HREF="([^"]+)"/i,
          /href="([^"]+)"/i,
          /url=([^"&\s]+)/i,
          /document\.location\.href\s*=\s*["']([^"']+)["']/i
        ];

        let redirectUrl = null;
        for (const regex of redirectMatches) {
          const match = csvText.match(regex);
          if (match) {
            redirectUrl = match[1].replace(/&amp;/g, '&');
            break;
          }
        }

        if (redirectUrl) {
          console.log(`🔗 ${tipo} - URL redirect trovato: ${redirectUrl.substring(0, 100)}...`);
          
          const redirectResponse = await fetch(redirectUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'text/csv,application/csv,text/plain,*/*'
            },
            redirect: 'follow'
          });

          if (!redirectResponse.ok) {
            throw new Error(`Redirect HTTP ${redirectResponse.status}`);
          }

          csvText = await redirectResponse.text();
          console.log(`✅ ${tipo} - CSV scaricato dal redirect: ${csvText.length} caratteri`);
        } else {
          throw new Error(`HTML ricevuto ma nessun URL redirect trovato per ${tipo}`);
        }
      }

      // Verifica che sia effettivamente CSV
      if (csvText.includes('<HTML>') || csvText.includes('<html>')) {
        throw new Error(`Ancora HTML ricevuto per ${tipo}`);
      }

      return csvText;

    } catch (error) {
      console.error(`❌ Tentativo ${attempts} fallito per ${tipo}:`, error.message);
      if (attempts === maxAttempts) {
        throw error;
      }
      // Attesa prima del prossimo tentativo
      await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
    }
  }
}

async function syncCategory(tipo, url) {
  try {
    console.log(`\n🔄 Sincronizzando ${tipo}...`);

    // Download CSV con retry
    const csvText = await downloadCSV(url, tipo);

    // Parse CSV
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toUpperCase(),
    });

    console.log(`📊 ${tipo} - Righe CSV parsed: ${parsed.data.length}`);

    if (parsed.data.length === 0) {
      console.log(`⚠️ Nessun dato trovato per ${tipo}`);
      return 0;
    }

    // Debug headers
    if (parsed.data.length > 0) {
      console.log(`🔍 ${tipo} - Headers:`, Object.keys(parsed.data[0]).slice(0, 8));
    }

    // Filtra e mappa i dati
    const validRows = parsed.data
      .filter((row, index) => {
        const nome = row['NOME VINO']?.trim() || 
                    row['NOME']?.trim() || 
                    Object.values(row)[0]?.toString().trim();

        const isValid = nome && 
               nome.length > 2 &&
               nome.toUpperCase() !== 'NOME VINO' && 
               nome.toUpperCase() !== 'NOME' &&
               nome.toUpperCase() !== tipo.toUpperCase();

        if (!isValid && nome) {
          console.log(`❌ ${tipo} riga ${index + 1} scartata: "${nome}"`);
        }

        return isValid;
      })
      .map((row, index) => {
        const nomeVino = row['NOME VINO']?.trim() || 
                        row['NOME']?.trim() || 
                        Object.values(row)[0]?.toString().trim();

        const anno = row['ANNO']?.trim() || Object.values(row)[1]?.toString().trim();
        const produttore = row['PRODUTTORE']?.trim() || Object.values(row)[2]?.toString().trim();
        const provenienza = row['PROVENIENZA']?.trim() || Object.values(row)[3]?.toString().trim();
        const fornitore = row['FORNITORE']?.trim() || Object.values(row)[4]?.toString().trim();
        const costo = parseEuro(row['COSTO '] ?? row['COSTO'] ?? Object.values(row)[5]);
        const vendita = parseEuro(row['VENDITA'] ?? Object.values(row)[6]);

        return {
          nome_vino: nomeVino || null,
          anno: anno || null,
          produttore: produttore || null,
          provenienza: provenienza || null,
          fornitore: fornitore || 'Non specificato',
          costo: costo,
          vendita: vendita,
          tipologia: tipo,
          user_id: user_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

    console.log(`🍷 ${tipo} - Vini validi: ${validRows.length}`);

    if (validRows.length === 0) {
      console.log(`⚠️ Nessun vino valido per ${tipo}`);
      return 0;
    }

    // Elimina esistenti per questa categoria
    console.log(`🗑️ Eliminazione vini esistenti per ${tipo}...`);
    const { error: deleteError } = await supabase
      .from('vini')
      .delete()
      .eq('tipologia', tipo)
      .eq('user_id', user_id);

    if (deleteError) {
      console.error(`❌ Errore eliminazione ${tipo}:`, deleteError);
      throw deleteError;
    }

    // Inserisci nuovi vini
    console.log(`📝 Inserimento ${validRows.length} vini per ${tipo}...`);
    const { data: insertedData, error: insertError } = await supabase
      .from('vini')
      .insert(validRows)
      .select('id');

    if (insertError) {
      console.error(`❌ Errore inserimento ${tipo}:`, insertError);
      throw insertError;
    }

    // Crea giacenze
    if (insertedData && insertedData.length > 0) {
      console.log(`📦 Creazione giacenze per ${insertedData.length} vini...`);
      const giacenze = insertedData.map(wine => ({
        vino_id: wine.id,
        giacenza: 0,
        min_stock: 2,
        user_id: user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: giacenzaError } = await supabase
        .from('giacenza')
        .insert(giacenze);

      if (giacenzaError) {
        console.error(`❌ Errore giacenze ${tipo}:`, giacenzaError);
      } else {
        console.log(`✅ Giacenze create per ${tipo}`);
      }
    }

    console.log(`✅ ${tipo} completato: ${validRows.length} vini`);
    return validRows.length;

  } catch (err) {
    console.error(`❌ Errore ${tipo}:`, err.message);
    return 0;
  }
}

async function cleanDatabase() {
  try {
    console.log('\n🗑️ Pulizia database completa...');

    const { error: giacenzaError } = await supabase
      .from('giacenza')
      .delete()
      .eq('user_id', user_id);

    if (giacenzaError) {
      console.error('Errore eliminazione giacenze:', giacenzaError);
    } else {
      console.log('✅ Giacenze eliminate');
    }

    const { error: viniError } = await supabase
      .from('vini')
      .delete()
      .eq('user_id', user_id);

    if (viniError) {
      console.error('Errore eliminazione vini:', viniError);
    } else {
      console.log('✅ Vini eliminati');
    }

  } catch (err) {
    console.error('❌ Errore pulizia:', err.message);
  }
}

async function checkDatabaseConnection() {
  try {
    console.log('🔍 Verifica connessione Supabase...');
    const { data, error } = await supabase.from('vini').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Connessione Supabase OK');
    return true;
  } catch (err) {
    console.error('❌ Errore connessione:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 RIPOPOLAMENTO COMPLETO TABELLA VINI');
  console.log('👤 User ID:', user_id);

  if (!(await checkDatabaseConnection())) {
    console.error('❌ Connessione Supabase fallita');
    process.exit(1);
  }

  await cleanDatabase();

  let totalWines = 0;
  let successfulCategories = 0;

  // Prima sincronizza ROSSI (problema principale)
  console.log('\n🍷 === PRIORITÀ: SINCRONIZZAZIONE ROSSI ===');
  const rossiCount = await syncCategory('ROSSI', CATEGORIES['ROSSI']);
  if (rossiCount > 0) {
    totalWines += rossiCount;
    successfulCategories++;
  }

  // Pausa per evitare rate limiting
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Poi sincronizza le altre categorie
  for (const [tipo, url] of Object.entries(CATEGORIES)) {
    if (tipo === 'ROSSI') continue; // Già fatto

    const winesInserted = await syncCategory(tipo, url);
    if (winesInserted > 0) {
      totalWines += winesInserted;
      successfulCategories++;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Report finale
  console.log('\n🏁 RIPOPOLAMENTO COMPLETATO');
  console.log(`📊 Categorie sincronizzate: ${successfulCategories}/${Object.keys(CATEGORIES).length}`);
  console.log(`🍷 Totale vini importati: ${totalWines}`);

  // Verifica finale dettagliata
  try {
    console.log('\n📋 VERIFICA FINALE PER CATEGORIA:');
    for (const [tipo] of Object.entries(CATEGORIES)) {
      const { count } = await supabase
        .from('vini')
        .select('*', { count: 'exact', head: true })
        .eq('tipologia', tipo)
        .eq('user_id', user_id);
      
      console.log(`  ${tipo}: ${count} vini`);
    }

    const { count: totalCount } = await supabase
      .from('vini')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id);

    const { count: giacenzeCount } = await supabase
      .from('giacenza')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id);

    console.log(`\n✅ TOTALE DATABASE:`);
    console.log(`  - Vini: ${totalCount}`);
    console.log(`  - Giacenze: ${giacenzeCount}`);

  } catch (err) {
    console.error('❌ Errore verifica finale:', err.message);
  }
}

main().catch(console.error);

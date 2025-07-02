import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import Papa from 'papaparse';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

// Usa il tuo user_id dai log della console
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

  // Rimuovi tutto tranne numeri, punti e virgole
  const cleaned = value.toString().replace(/[^\d.,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

async function checkDatabaseConnection() {
  try {
    console.log('🔍 Verifica connessione Supabase...');
    const { data, error } = await supabase.from('vini').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Connessione Supabase OK');
    return true;
  } catch (err) {
    console.error('❌ Errore connessione Supabase:', err.message);
    return false;
  }
}

async function syncCategory(tipo, url, tipologieStandard) {
  try {
    console.log(`\n🔄 Sincronizzando ${tipo}...`);

    // Download CSV con gestione redirect automatica
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WineNode-Sync/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} per ${tipo}`);
    }
    
    const csvText = await response.text();
    console.log(`📥 CSV scaricato per ${tipo}, dimensione: ${csvText.length} caratteri`);
    
    // Verifica che non sia un redirect HTML
    if (csvText.includes('<HTML>') || csvText.includes('<html>')) {
      console.log(`⚠️ Ricevuto HTML invece di CSV per ${tipo}, tentativo di estrazione URL redirect...`);
      
      // Estrai l'URL del redirect dal HTML
      const redirectMatch = csvText.match(/HREF="([^"]+)"/i);
      if (redirectMatch) {
        const redirectUrl = redirectMatch[1].replace(/&amp;/g, '&');
        console.log(`🔄 Tentativo di scaricamento da URL redirect: ${redirectUrl}`);
        
        const redirectResponse = await fetch(redirectUrl, {
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; WineNode-Sync/1.0)'
          }
        });
        
        if (!redirectResponse.ok) {
          throw new Error(`HTTP error ${redirectResponse.status} dal redirect per ${tipo}`);
        }
        
        const redirectCsvText = await redirectResponse.text();
        console.log(`📥 CSV scaricato dal redirect per ${tipo}, dimensione: ${redirectCsvText.length} caratteri`);
        
        if (redirectCsvText.includes('<HTML>') || redirectCsvText.includes('<html>')) {
          throw new Error(`Ancora HTML ricevuto dal redirect per ${tipo}`);
        }
        
        csvText = redirectCsvText;
      } else {
        throw new Error(`HTML ricevuto ma nessun URL redirect trovato per ${tipo}`);
      }
    }

    // Parse CSV
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toUpperCase(),
    });

    console.log(`📊 Righe trovate nel CSV: ${parsed.data.length}`);

    // Debug: mostra le chiavi disponibili
    if (parsed.data.length > 0) {
      console.log(`🔍 Chiavi disponibili nel CSV ${tipo}:`, Object.keys(parsed.data[0]));
    }

    // Mostra le prime 3 righe per debug
    console.log(`🔍 Prime 3 righe del CSV per ${tipo}:`);
    parsed.data.slice(0, 3).forEach((row, index) => {
      console.log(`  Riga ${index + 1}: [`, Object.keys(row).slice(0, 5).map(k => `'${k}'`).join(', '), '] ...');
      console.log(`    Esempio dati: {`);
      Object.entries(row).slice(0, 8).forEach(([key, value]) => {
        console.log(`  '${key}': '${value}',`);
      });
      console.log(`}`);
    });

    // Filtra e mappa i dati - usa tutti i possibili nomi di colonna
    const validRows = parsed.data
      .filter((row, index) => {
        // Skip prima riga se è un header
        if (index === 0) {
          const firstValue = Object.values(row)[0]?.toString().toUpperCase();
          if (firstValue === tipo.toUpperCase() || firstValue === 'NOME VINO' || firstValue === 'NOME') {
            console.log(`⏭️ Saltata riga ${index + 1}: header rilevato`);
            return false;
          }
        }

        // Prova diversi nomi possibili per la colonna del nome vino
        const nome = row['NOME VINO']?.trim() || 
                    row['NOME']?.trim() || 
                    row['Nome Vino']?.trim() || 
                    row['Nome']?.trim() ||
                    row['nome_vino']?.trim() ||
                    row['nome']?.trim() ||
                    Object.values(row)[0]?.toString().trim(); // Prova prima colonna

        const isValid = nome && 
               nome.length > 2 &&
               nome.toUpperCase() !== 'NOME VINO' && 
               nome.toUpperCase() !== 'NOME' &&
               nome.toUpperCase() !== tipo.toUpperCase() &&
               !nome.toUpperCase().includes('NOME VINO');

        if (!isValid && nome) {
          console.log(`❌ Riga ${index + 1} scartata - Nome: "${nome}" (lunghezza: ${nome.length})`);
        } else if (isValid) {
          console.log(`✅ Riga ${index + 1} valida - Nome: "${nome}"`);
        }

        return isValid;
      })
      .map((row, index) => {
        // Se il parsing con header fallisce, usa l'ordine delle colonne
        const keys = Object.keys(row);
        const values = Object.values(row);

        // Mappatura flessibile delle colonne
        const nomeVino = row['NOME VINO']?.trim() || 
                        row['NOME']?.trim() || 
                        row['Nome Vino']?.trim() || 
                        row['Nome']?.trim() ||
                        row['nome_vino']?.trim() ||
                        row['nome']?.trim() ||
                        values[0]?.toString().trim(); // Prima colonna come fallback

        const anno = row['ANNO']?.trim() || 
                    row['Anno']?.trim() || 
                    row['anno']?.trim() ||
                    values[1]?.toString().trim(); // Seconda colonna come fallback

        const produttore = row['PRODUTTORE']?.trim() || 
                          row['Produttore']?.trim() || 
                          row['produttore']?.trim() ||
                          values[2]?.toString().trim(); // Terza colonna come fallback

        const provenienza = row['PROVENIENZA']?.trim() || 
                           row['Provenienza']?.trim() || 
                           row['provenienza']?.trim() ||
                           values[3]?.toString().trim(); // Quarta colonna come fallback

        const fornitore = row['FORNITORE']?.trim() || 
                         row['Fornitore']?.trim() || 
                         row['fornitore']?.trim() ||
                         values[4]?.toString().trim(); // Quinta colonna come fallback

        const costo = parseEuro(row['COSTO '] ?? row['COSTO'] ?? row['Costo'] ?? row['costo'] ?? values[5]);
        const vendita = parseEuro(row['VENDITA'] ?? row['Vendita'] ?? row['vendita'] ?? values[6]);
        //const margine = parseEuro(row['MARGINE'] ?? row['Margine'] ?? row['margine'] ?? values[7]);

        console.log(`📝 Mappatura riga ${index + 1}: ${nomeVino} | ${produttore} | €${vendita} | Costo: €${costo}`);

        return {
          nome_vino: nomeVino || null,
          anno: anno || null,
          produttore: produttore || null,
          provenienza: provenienza || null,
          fornitore: fornitore || 'Non specificato',
          costo: costo,
          vendita: vendita,
          //margine: margine,
          tipologia: normalizeType(tipo, tipologieStandard),
          user_id: user_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

    console.log(`🍷 Vini validi trovati per ${tipo}: ${validRows.length}`);

    if (validRows.length === 0) {
      console.log(`⚠️ Nessun vino valido trovato per ${tipo}`);
      return 0;
    }

    // Elimina i vini esistenti per questa categoria
    console.log(`🗑️ Eliminazione vini esistenti per ${tipo}...`);
    const { error: deleteError } = await supabase
      .from('vini')
      .delete()
      .eq('tipologia', tipo)
      .eq('user_id', user_id);

    if (deleteError) {
      console.error(`❌ Errore eliminazione per ${tipo}:`, deleteError);
      throw deleteError;
    }

    // Inserisci i nuovi vini
    console.log(`📝 Inserimento ${validRows.length} vini per ${tipo}...`);
    const { data: insertedData, error: insertError } = await supabase
      .from('vini')
      .insert(validRows)
      .select('id');

    if (insertError) {
      console.error(`❌ Errore inserimento per ${tipo}:`, insertError);
      throw insertError;
    }

    // Crea giacenze per i vini inseriti
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
        console.error(`❌ Errore creazione giacenze per ${tipo}:`, giacenzaError);
      } else {
        console.log(`✅ Giacenze create per ${tipo}`);
      }
    }

    console.log(`✅ ${tipo} sincronizzato con successo: ${validRows.length} vini`);
    return validRows.length;

  } catch (err) {
    console.error(`❌ Errore sincronizzazione ${tipo}:`, err.message);
    return 0;
  }
}

async function cleanDatabase() {
  try {
    console.log('\n🗑️ Pulizia database utente...');

    // Prima elimina giacenze
    const { error: giacenzaError } = await supabase
      .from('giacenza')
      .delete()
      .eq('user_id', user_id);

    if (giacenzaError) {
      console.error('Errore eliminazione giacenze:', giacenzaError);
    } else {
      console.log('✅ Giacenze eliminate');
    }

    // Poi elimina vini
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
    console.error('❌ Errore pulizia database:', err.message);
  }
}

async function main() {
  console.log('🚀 AVVIO SINCRONIZZAZIONE COMPLETA SUPABASE');
  console.log('👤 User ID:', user_id);

  // Verifica connessione
  if (!(await checkDatabaseConnection())) {
    console.error('❌ Impossibile connettersi a Supabase');
    process.exit(1);
  }

  // Pulisci database
  await cleanDatabase();

  let totalWines = 0;
  let totalCategories = 0;
  
  // Recupera le tipologie standard
  async function getTipologieStandard(userId) {
    const { data, error } = await supabase
      .from('tipologie')
      .select('nome')
      .eq('user_id', userId);

    if (error || !data) {
      console.log('⚠️ Uso tipologie di default');
      return ['ROSSI', 'BIANCHI', 'ROSATI', 'BOLLICINE ITALIANE', 'BOLLICINE FRANCESI', 'VINI DOLCI'];
    }

    return data.map(t => t.nome);
  }

  // Funzione per normalizzare le tipologie usando la tabella tipologie
  function normalizeType(rawType, tipologieStandard) {
    if (!rawType) return '';

    const type = rawType.toUpperCase().trim();

    // Mapping intelligente alle tipologie standard
    if (type.includes('BOLLICINE') && type.includes('FRANCESI')) return 'BOLLICINE FRANCESI';
    if (type.includes('BOLLICINE') && type.includes('ITALIANE')) return 'BOLLICINE ITALIANE';
    if (type.includes('BOLLICINE') || type.includes('CHAMPAGNE') || type.includes('PROSECCO')) {
      return 'BOLLICINE ITALIANE';
    }
    if (type.includes('BIANCO') || type.includes('BIANCHI')) return 'BIANCHI';
    if (type.includes('ROSSO') || type.includes('ROSSI')) return 'ROSSI';
    if (type.includes('ROSATO') || type.includes('ROSATI')) return 'ROSATI';
    if (type.includes('DOLCE') || type.includes('DOLCI') || type.includes('PASSITO')) return 'VINI DOLCI';

    // Se non trova corrispondenza, cerca nella lista delle tipologie standard
    const match = tipologieStandard.find(std => 
      type.includes(std) || std.includes(type.split(' ')[0])
    );

    return match || type;
  }

  console.log('🔧 Inizio sincronizzazione vini da Google Sheets...');

    // Recupera le tipologie standard
    const tipologieStandard = await getTipologieStandard(user_id);
    console.log('📋 Tipologie standard:', tipologieStandard);

  // Sincronizza tutte le categorie
  for (const [tipo, url] of Object.entries(CATEGORIES)) {
    const winesInserted = await syncCategory(tipo, url, tipologieStandard);
    if (winesInserted > 0) {
      totalWines += winesInserted;
      totalCategories++;
    }

    // Pausa tra le categorie per evitare rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Report finale
  console.log('\n🏁 SINCRONIZZAZIONE COMPLETATA');
  console.log(`📊 Categorie sincronizzate: ${totalCategories}/${Object.keys(CATEGORIES).length}`);
  console.log(`🍷 Totale vini importati: ${totalWines}`);

  // Verifica finale
  try {
    const { count } = await supabase
      .from('vini')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id);

    console.log(`✅ Verifica finale: ${count} vini nel database`);

    // Mostra conteggio per categoria
    const { data: categoryData } = await supabase
      .from('vini')
      .select('tipologia', { count: 'exact' })
      .eq('user_id', user_id);

    if (categoryData) {
      console.log('\n📋 Vini per categoria:');
      for (const [tipo] of Object.entries(CATEGORIES)) {
        const { count } = await supabase
          .from('vini')
          .select('*', { count: 'exact', head: true })
          .eq('tipologia', tipo)
          .eq('user_id', user_id);
        console.log(`  ${tipo}: ${count} vini`);
      }
    }

  } catch (err) {
    console.error('❌ Errore verifica finale:', err.message);
  }
}

main().catch(console.error);
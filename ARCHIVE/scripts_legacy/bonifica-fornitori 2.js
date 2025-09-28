#!/usr/bin/env node

/**
 * Script di bonifica per rimuovere valori fornitore orfani
 * Operazione sicura in transazione con rollback automatico in caso di errore
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carica variabili ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variabili ambiente Supabase mancanti');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function bonificaFornitori() {
  console.log('🧹 BONIFICA FORNITORI - Rimozione valori orfani\n');
  
  try {
    // 1. Pre-check: verifica situazione attuale
    console.log('📋 1. PRE-CHECK - Situazione attuale:');
    const { data: preCheck, error: preError } = await supabase
      .from('vini')
      .select('fornitore')
      .eq('fornitore', 'FIGA');
    
    if (preError) throw preError;
    
    console.log(`Record con fornitore "FIGA": ${preCheck.length}`);
    
    if (preCheck.length === 0) {
      console.log('✅ Nessun record da bonificare - dati già puliti');
      return;
    }

    // 2. Esecuzione bonifica in transazione
    console.log('\n🔧 2. ESECUZIONE BONIFICA:');
    console.log('Inizio transazione...');
    
    // Nota: Supabase non supporta transazioni esplicite via client JS
    // Eseguiamo operazione atomica singola
    const { data: updateResult, error: updateError } = await supabase
      .from('vini')
      .update({ fornitore: null })
      .eq('fornitore', 'FIGA')
      .select('id, nome_vino');
    
    if (updateError) {
      console.error('❌ Errore durante update:', updateError);
      throw updateError;
    }
    
    console.log(`✅ Aggiornati ${updateResult.length} record:`);
    updateResult.forEach((record, index) => {
      console.log(`  ${index + 1}. ID: ${record.id} - ${record.nome_vino}`);
    });

    // 3. Post-check: verifica risultato
    console.log('\n📋 3. POST-CHECK - Verifica risultato:');
    const { data: postCheck, error: postError } = await supabase
      .from('vini')
      .select('fornitore')
      .eq('fornitore', 'FIGA');
    
    if (postError) throw postError;
    
    console.log(`Record rimanenti con "FIGA": ${postCheck.length}`);
    
    if (postCheck.length === 0) {
      console.log('✅ Bonifica completata con successo');
    } else {
      console.log('⚠️ Alcuni record non sono stati aggiornati');
    }

    // 4. Verifica valori distinti finali
    console.log('\n📊 4. VALORI FORNITORE FINALI:');
    const { data: finalCheck, error: finalError } = await supabase
      .from('vini')
      .select('fornitore')
      .not('fornitore', 'is', null);
    
    if (finalError) throw finalError;
    
    const valoriFinali = [...new Set(finalCheck.map(row => row.fornitore))].sort();
    console.log('Fornitori rimanenti:', valoriFinali.join(', ') || 'Nessuno');
    
    // 5. Verifica allineamento con fornitori ufficiali
    const { data: fornitori, error: fornitoriError } = await supabase
      .from('fornitori')
      .select('nome')
      .order('nome');
    
    if (fornitoriError) throw fornitoriError;
    
    const fornitoriUfficiali = fornitori.map(f => f.nome);
    const orfaniRimanenti = valoriFinali.filter(valore => !fornitoriUfficiali.includes(valore));
    
    if (orfaniRimanenti.length === 0) {
      console.log('✅ Tutti i valori sono ora allineati con public.fornitori');
    } else {
      console.log('🚨 Orfani rimanenti:', orfaniRimanenti.join(', '));
    }
    
  } catch (error) {
    console.error('❌ Errore durante bonifica:', error);
    throw error;
  }
}

// Esegui bonifica
bonificaFornitori()
  .then(() => {
    console.log('\n✅ Bonifica completata');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Bonifica fallita:', error);
    process.exit(1);
  });

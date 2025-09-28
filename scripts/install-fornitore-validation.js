#!/usr/bin/env node

/**
 * Script per installare la validazione automatica fornitori
 * Crea funzione e trigger per prevenire valori fornitore orfani
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

async function installFornitoreValidation() {
  console.log('🛡️ INSTALLAZIONE VALIDAZIONE FORNITORI\n');
  
  try {
    // 1. Leggi script SQL
    const sqlPath = path.join(__dirname, 'create-fornitore-validation.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📋 1. ESECUZIONE SCRIPT SQL:');
    console.log('Creazione funzione enforce_fornitore_valid()...');
    
    // 2. Esegui script SQL
    // Nota: Supabase potrebbe non supportare tutti i comandi SQL avanzati
    // Proviamo con la funzione base
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION enforce_fornitore_valid()
      RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.fornitore IS NULL THEN
          RETURN NEW;
        END IF;
        IF EXISTS (SELECT 1 FROM public.fornitori f WHERE f.nome = NEW.fornitore) THEN
          RETURN NEW;
        ELSE
          NEW.fornitore := NULL;
          RETURN NEW;
        END IF;
      END;
      $$;
    `;
    
    const { error: functionError } = await supabase.rpc('exec_sql', { 
      sql: createFunctionSQL 
    });
    
    if (functionError) {
      console.log('⚠️ Creazione funzione tramite RPC fallita:', functionError.message);
      console.log('📋 Provo con approccio alternativo...');
      
      // Approccio alternativo: usa SQL diretto se disponibile
      console.log('💡 ISTRUZIONI MANUALI:');
      console.log('Esegui il seguente SQL nel dashboard Supabase:');
      console.log('----------------------------------------');
      console.log(sqlScript);
      console.log('----------------------------------------');
      
      return;
    }
    
    console.log('✅ Funzione creata con successo');
    
    // 3. Crea trigger per public.vini
    console.log('\n📋 2. CREAZIONE TRIGGER:');
    
    const createTriggerSQL = `
      DROP TRIGGER IF EXISTS trg_enforce_fornitore_vini ON public.vini;
      CREATE TRIGGER trg_enforce_fornitore_vini
        BEFORE INSERT OR UPDATE ON public.vini
        FOR EACH ROW EXECUTE FUNCTION enforce_fornitore_valid();
    `;
    
    const { error: triggerError } = await supabase.rpc('exec_sql', { 
      sql: createTriggerSQL 
    });
    
    if (triggerError) {
      console.log('⚠️ Creazione trigger tramite RPC fallita:', triggerError.message);
    } else {
      console.log('✅ Trigger creato per public.vini');
    }
    
    // 4. Test validazione
    console.log('\n📋 3. TEST VALIDAZIONE:');
    
    // Test inserimento valore non valido
    const testRecord = {
      nome_vino: 'TEST_VALIDATION_' + Date.now(),
      fornitore: 'FORNITORE_INESISTENTE_TEST',
      tipologia: 'test'
    };
    
    console.log(`Inserimento record test con fornitore non valido: "${testRecord.fornitore}"`);
    
    const { data: insertResult, error: insertError } = await supabase
      .from('vini')
      .insert(testRecord)
      .select('id, nome_vino, fornitore');
    
    if (insertError) {
      console.log('❌ Errore inserimento test:', insertError.message);
    } else {
      console.log('✅ Record inserito:', insertResult[0]);
      
      if (insertResult[0].fornitore === null) {
        console.log('🎯 VALIDAZIONE FUNZIONANTE: Fornitore non valido convertito a NULL');
      } else {
        console.log('⚠️ Validazione non attiva: Fornitore non valido non convertito');
      }
      
      // Cleanup record test
      await supabase.from('vini').delete().eq('id', insertResult[0].id);
      console.log('🧹 Record test rimosso');
    }
    
    // 5. Verifica trigger installati
    console.log('\n📋 4. VERIFICA INSTALLAZIONE:');
    
    const { data: triggers, error: triggerListError } = await supabase
      .from('pg_triggers')
      .select('schemaname, tablename, triggername')
      .like('triggername', 'trg_enforce_fornitore_%');
    
    if (triggerListError) {
      console.log('⚠️ Impossibile verificare trigger installati:', triggerListError.message);
    } else {
      console.log('Trigger installati:');
      triggers.forEach(trigger => {
        console.log(`  - ${trigger.schemaname}.${trigger.tablename}: ${trigger.triggername}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Errore durante installazione:', error);
    throw error;
  }
}

// Esegui installazione
installFornitoreValidation()
  .then(() => {
    console.log('\n✅ Installazione validazione completata');
    console.log('\n💡 NOTA: Se alcuni comandi sono falliti, esegui manualmente:');
    console.log('   scripts/create-fornitore-validation.sql nel dashboard Supabase');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Installazione fallita:', error);
    process.exit(1);
  });

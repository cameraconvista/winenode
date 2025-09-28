#!/usr/bin/env node

/**
 * Test specifico per la validazione fornitori
 * Verifica che i trigger funzionino correttamente
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

async function testFornitoreValidation() {
  console.log('🧪 TEST VALIDAZIONE FORNITORI\n');
  
  try {
    // 1. Test con fornitore valido
    console.log('📋 1. TEST FORNITORE VALIDO:');
    
    const validRecord = {
      nome_vino: 'TEST_VALID_' + Date.now(),
      fornitore: 'BOLOGNA VINI',
      tipologia: 'VINI DOLCI',
      costo: 10.00,
      vendita: 15.00,
      user_id: '00000000-0000-0000-0000-000000000001'
    };
    
    console.log(`Inserimento con fornitore valido: "${validRecord.fornitore}"`);
    
    const { data: validResult, error: validError } = await supabase
      .from('vini')
      .insert(validRecord)
      .select('id, nome_vino, fornitore');
    
    if (validError) {
      console.log('❌ Errore inserimento valido:', validError.message);
    } else {
      console.log('✅ Record inserito:', validResult[0]);
      console.log(`   Fornitore: ${validResult[0].fornitore} (dovrebbe essere "BOLOGNA VINI")`);
      
      // Cleanup
      await supabase.from('vini').delete().eq('id', validResult[0].id);
      console.log('🧹 Record test rimosso');
    }
    
    // 2. Test con fornitore non valido
    console.log('\n📋 2. TEST FORNITORE NON VALIDO:');
    
    const invalidRecord = {
      nome_vino: 'TEST_INVALID_' + Date.now(),
      fornitore: 'FORNITORE_INESISTENTE',
      tipologia: 'BOLLICINE ITALIANE',
      costo: 10.00,
      vendita: 15.00,
      user_id: '00000000-0000-0000-0000-000000000001'
    };
    
    console.log(`Inserimento con fornitore non valido: "${invalidRecord.fornitore}"`);
    
    const { data: invalidResult, error: invalidError } = await supabase
      .from('vini')
      .insert(invalidRecord)
      .select('id, nome_vino, fornitore');
    
    if (invalidError) {
      console.log('❌ Errore inserimento non valido:', invalidError.message);
    } else {
      console.log('✅ Record inserito:', invalidResult[0]);
      console.log(`   Fornitore: ${invalidResult[0].fornitore} (dovrebbe essere NULL)`);
      
      if (invalidResult[0].fornitore === null) {
        console.log('🎯 VALIDAZIONE FUNZIONANTE: Fornitore non valido convertito a NULL');
      } else {
        console.log('⚠️ VALIDAZIONE NON ATTIVA: Fornitore non valido non convertito');
      }
      
      // Cleanup
      await supabase.from('vini').delete().eq('id', invalidResult[0].id);
      console.log('🧹 Record test rimosso');
    }
    
    // 3. Test con NULL
    console.log('\n📋 3. TEST FORNITORE NULL:');
    
    const nullRecord = {
      nome_vino: 'TEST_NULL_' + Date.now(),
      fornitore: null,
      tipologia: 'VINI DOLCI',
      costo: 10.00,
      vendita: 15.00,
      user_id: '00000000-0000-0000-0000-000000000001'
    };
    
    console.log('Inserimento con fornitore NULL');
    
    const { data: nullResult, error: nullError } = await supabase
      .from('vini')
      .insert(nullRecord)
      .select('id, nome_vino, fornitore');
    
    if (nullError) {
      console.log('❌ Errore inserimento NULL:', nullError.message);
    } else {
      console.log('✅ Record inserito:', nullResult[0]);
      console.log(`   Fornitore: ${nullResult[0].fornitore} (dovrebbe essere NULL)`);
      
      // Cleanup
      await supabase.from('vini').delete().eq('id', nullResult[0].id);
      console.log('🧹 Record test rimosso');
    }
    
    // 4. Test update
    console.log('\n📋 4. TEST UPDATE FORNITORE:');
    
    // Prima inserisci un record valido
    const updateTestRecord = {
      nome_vino: 'TEST_UPDATE_' + Date.now(),
      fornitore: 'ITALIA VINI',
      tipologia: 'BOLLICINE ITALIANE',
      costo: 10.00,
      vendita: 15.00,
      user_id: '00000000-0000-0000-0000-000000000001'
    };
    
    const { data: insertForUpdate, error: insertForUpdateError } = await supabase
      .from('vini')
      .insert(updateTestRecord)
      .select('id, nome_vino, fornitore');
    
    if (insertForUpdateError) {
      console.log('❌ Errore inserimento per test update:', insertForUpdateError.message);
    } else {
      console.log(`Record creato per test update: ${insertForUpdate[0].fornitore}`);
      
      // Prova update con fornitore non valido
      const { data: updateResult, error: updateError } = await supabase
        .from('vini')
        .update({ fornitore: 'FORNITORE_UPDATE_INESISTENTE' })
        .eq('id', insertForUpdate[0].id)
        .select('id, nome_vino, fornitore');
      
      if (updateError) {
        console.log('❌ Errore update:', updateError.message);
      } else {
        console.log('✅ Record aggiornato:', updateResult[0]);
        console.log(`   Fornitore dopo update: ${updateResult[0].fornitore} (dovrebbe essere NULL)`);
        
        if (updateResult[0].fornitore === null) {
          console.log('🎯 VALIDAZIONE UPDATE FUNZIONANTE');
        } else {
          console.log('⚠️ VALIDAZIONE UPDATE NON ATTIVA');
        }
      }
      
      // Cleanup
      await supabase.from('vini').delete().eq('id', insertForUpdate[0].id);
      console.log('🧹 Record test update rimosso');
    }
    
  } catch (error) {
    console.error('❌ Errore durante test:', error);
    throw error;
  }
}

// Esegui test
testFornitoreValidation()
  .then(() => {
    console.log('\n✅ Test validazione completato');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test fallito:', error);
    process.exit(1);
  });

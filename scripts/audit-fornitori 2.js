#!/usr/bin/env node

/**
 * Script di audit per valori fornitore nelle tabelle vini*
 * Identifica valori orfani non presenti in public.fornitori
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

async function auditFornitori() {
  console.log('🔍 AUDIT FORNITORI - Identificazione valori orfani\n');
  
  try {
    // 1. Elenco ufficiale fornitori
    console.log('📋 1. ELENCO UFFICIALE FORNITORI:');
    const { data: fornitori, error: fornitoriError } = await supabase
      .from('fornitori')
      .select('nome')
      .order('nome');
    
    if (fornitoriError) throw fornitoriError;
    
    const fornitoriUfficiali = fornitori.map(f => f.nome);
    console.log('Fornitori ufficiali:', fornitoriUfficiali);
    console.log(`Totale: ${fornitoriUfficiali.length}\n`);

    // 2. Valori nelle tabelle vini*
    const tabelle = ['vini', 'vini_staging', 'vini_staging_raw'];
    const risultatiAudit = {};
    
    for (const tabella of tabelle) {
      console.log(`📊 2.${tabelle.indexOf(tabella) + 1}. VALORI IN public.${tabella}:`);
      
      try {
        const { data, error } = await supabase
          .from(tabella)
          .select('fornitore')
          .not('fornitore', 'is', null);
        
        if (error) {
          console.log(`⚠️  Tabella ${tabella} non accessibile o vuota:`, error.message);
          risultatiAudit[tabella] = { valori: [], orfani: [], accessibile: false };
          continue;
        }
        
        const valoriDistinti = [...new Set(data.map(row => row.fornitore).filter(Boolean))].sort();
        const orfani = valoriDistinti.filter(valore => !fornitoriUfficiali.includes(valore));
        
        risultatiAudit[tabella] = { 
          valori: valoriDistinti, 
          orfani: orfani,
          accessibile: true,
          totaleRecord: data.length
        };
        
        console.log(`Valori distinti: ${valoriDistinti.join(', ') || 'Nessuno'}`);
        console.log(`Totale record: ${data.length}`);
        
        if (orfani.length > 0) {
          console.log(`🚨 ORFANI: ${orfani.join(', ')}`);
        } else {
          console.log('✅ Nessun valore orfano');
        }
        console.log();
        
      } catch (err) {
        console.log(`❌ Errore accesso tabella ${tabella}:`, err.message);
        risultatiAudit[tabella] = { valori: [], orfani: [], accessibile: false };
      }
    }

    // 3. Riepilogo orfani
    console.log('📋 3. RIEPILOGO VALORI ORFANI:');
    const tuttiOrfani = new Set();
    
    Object.entries(risultatiAudit).forEach(([tabella, risultato]) => {
      if (risultato.accessibile && risultato.orfani.length > 0) {
        risultato.orfani.forEach(orfano => tuttiOrfani.add(orfano));
        console.log(`- ${tabella}: ${risultato.orfani.join(', ')}`);
      }
    });
    
    if (tuttiOrfani.size === 0) {
      console.log('✅ Nessun valore orfano trovato in tutte le tabelle');
    } else {
      console.log(`\n🚨 TOTALE VALORI ORFANI DA BONIFICARE: ${Array.from(tuttiOrfani).join(', ')}`);
    }

    // 4. Piano di bonifica
    console.log('\n📋 4. PIANO DI BONIFICA:');
    if (tuttiOrfani.size > 0) {
      console.log('Valori da mappare a NULL (rimozione):');
      Array.from(tuttiOrfani).forEach(orfano => {
        console.log(`  - "${orfano}" → NULL`);
      });
      
      console.log('\nSQL di bonifica suggerito:');
      console.log('BEGIN;');
      
      Object.entries(risultatiAudit).forEach(([tabella, risultato]) => {
        if (risultato.accessibile && risultato.orfani.length > 0) {
          risultato.orfani.forEach(orfano => {
            console.log(`UPDATE public.${tabella} SET fornitore = NULL WHERE fornitore = '${orfano}';`);
          });
        }
      });
      
      console.log('COMMIT;');
    } else {
      console.log('✅ Nessuna bonifica necessaria - dati già allineati');
    }

    return risultatiAudit;
    
  } catch (error) {
    console.error('❌ Errore durante audit:', error);
    throw error;
  }
}

// Esegui audit
auditFornitori()
  .then(() => {
    console.log('\n✅ Audit completato');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Audit fallito:', error);
    process.exit(1);
  });

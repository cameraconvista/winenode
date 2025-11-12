#!/usr/bin/env node

/**
 * BACKUP STRATEGICO GIACENZE WINENODE
 * 
 * Script per backup sicuro delle giacenze attuali prima dell'implementazione offline.
 * Previene la perdita di dati critici durante la transizione.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Configurazione Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rtmohyjquscdkbtibdsu.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0bW9oeWpxdXNjZGtidGliZHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTY2ODAsImV4cCI6MjA2NzAzMjY4MH0.0TtH77LllG7Zw_yD5R_g4VEFcsjISDbesZPqKJVCuWg';

// Inizializza client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Directory backup giacenze
const BACKUP_DIR = path.join(process.cwd(), '.offline-backup');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

/**
 * Crea directory backup se non esiste
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 Directory backup creata: ${BACKUP_DIR}`);
  }
}

/**
 * Calcola checksum MD5 per verifica integrità
 */
function calculateChecksum(data) {
  return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

/**
 * Backup completo giacenze dal database
 */
async function backupGiacenze() {
  try {
    console.log('🔄 Avvio backup giacenze...');
    
    // 1. Fetch giacenze attuali
    const { data: giacenze, error: giacenzeError } = await supabase
      .from('giacenza')
      .select('*')
      .order('vino_id');
    
    if (giacenzeError) {
      throw new Error(`Errore fetch giacenze: ${giacenzeError.message}`);
    }
    
    // 2. Fetch vini correlati per context
    const { data: vini, error: viniError } = await supabase
      .from('vini')
      .select('id, nome_vino, fornitore, tipologia')
      .order('nome_vino');
    
    if (viniError) {
      throw new Error(`Errore fetch vini: ${viniError.message}`);
    }
    
    // 3. Crea mappa vini per arricchimento dati
    const viniMap = new Map(vini.map(v => [v.id, v]));
    
    // 4. Arricchisci giacenze con info vini
    const giacenzeEnriched = giacenze.map(g => {
      const vino = viniMap.get(g.vino_id);
      return {
        ...g,
        vino_nome: vino?.nome_vino || 'N/A',
        vino_fornitore: vino?.fornitore || 'N/A',
        vino_tipologia: vino?.tipologia || 'N/A'
      };
    });
    
    // 5. Prepara struttura backup
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      source: 'winenode-backup-giacenze',
      stats: {
        total_giacenze: giacenze.length,
        total_vini: vini.length,
        giacenze_zero: giacenze.filter(g => g.giacenza === 0).length,
        giacenze_negative: giacenze.filter(g => g.giacenza < 0).length,
        giacenze_alert: giacenze.filter(g => g.giacenza <= (g.min_stock || 2)).length
      },
      data: {
        giacenze: giacenzeEnriched,
        vini_context: vini
      },
      checksum: null // Calcolato dopo
    };
    
    // 6. Calcola checksum per integrità
    backupData.checksum = calculateChecksum(backupData.data);
    
    // 7. Salva backup su file
    const filename = `giacenze-backup-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    
    // 8. Crea anche backup compatto per recovery rapido
    const compactBackup = {
      timestamp: backupData.timestamp,
      checksum: backupData.checksum,
      giacenze: giacenze.map(g => ({
        vino_id: g.vino_id,
        giacenza: g.giacenza,
        min_stock: g.min_stock,
        version: g.version || 1
      }))
    };
    
    const compactFilename = `giacenze-compact-${timestamp}.json`;
    const compactFilepath = path.join(BACKUP_DIR, compactFilename);
    
    fs.writeFileSync(compactFilepath, JSON.stringify(compactBackup, null, 2));
    
    // 9. Log risultati
    console.log('✅ Backup giacenze completato con successo!');
    console.log(`📊 Statistiche:`);
    console.log(`   • Giacenze totali: ${backupData.stats.total_giacenze}`);
    console.log(`   • Vini totali: ${backupData.stats.total_vini}`);
    console.log(`   • Giacenze a zero: ${backupData.stats.giacenze_zero}`);
    console.log(`   • Giacenze negative: ${backupData.stats.giacenze_negative}`);
    console.log(`   • Giacenze in alert: ${backupData.stats.giacenze_alert}`);
    console.log(`📁 File salvati:`);
    console.log(`   • Completo: ${filename}`);
    console.log(`   • Compatto: ${compactFilename}`);
    console.log(`🔒 Checksum: ${backupData.checksum}`);
    
    return {
      success: true,
      filepath,
      compactFilepath,
      stats: backupData.stats,
      checksum: backupData.checksum
    };
    
  } catch (error) {
    console.error('❌ Errore durante backup giacenze:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Lista backup esistenti
 */
function listBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      console.log('📁 Nessun backup trovato (directory non esistente)');
      return;
    }
    
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('giacenze-backup-') && f.endsWith('.json'))
      .sort()
      .reverse(); // Più recenti prima
    
    if (files.length === 0) {
      console.log('📁 Nessun backup giacenze trovato');
      return;
    }
    
    console.log(`📋 Backup giacenze disponibili (${files.length}):`);
    console.log('');
    
    files.forEach((file, index) => {
      const filepath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filepath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      
      // Estrai timestamp dal nome file
      const timestampMatch = file.match(/giacenze-backup-(.+)\.json/);
      const timestamp = timestampMatch ? timestampMatch[1].replace(/-/g, ':') : 'N/A';
      
      console.log(`${index + 1}. ${file}`);
      console.log(`   📅 Data: ${timestamp}`);
      console.log(`   📊 Dimensione: ${sizeKB} KB`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Errore lista backup:', error.message);
  }
}

/**
 * Verifica integrità backup
 */
async function verifyBackup(filename) {
  try {
    const filepath = path.join(BACKUP_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      throw new Error(`File backup non trovato: ${filename}`);
    }
    
    console.log(`🔍 Verifica integrità: ${filename}`);
    
    const backupData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    const storedChecksum = backupData.checksum;
    
    // Ricalcola checksum
    const calculatedChecksum = calculateChecksum(backupData.data);
    
    if (storedChecksum === calculatedChecksum) {
      console.log('✅ Integrità verificata - Backup valido');
      console.log(`🔒 Checksum: ${storedChecksum}`);
      return true;
    } else {
      console.log('❌ Integrità compromessa - Backup corrotto');
      console.log(`🔒 Checksum atteso: ${storedChecksum}`);
      console.log(`🔒 Checksum calcolato: ${calculatedChecksum}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Errore verifica backup:', error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2];
  
  ensureBackupDir();
  
  switch (command) {
    case 'create':
    case undefined:
      await backupGiacenze();
      break;
      
    case 'list':
      listBackups();
      break;
      
    case 'verify': {
      const filename = process.argv[3];
      if (!filename) {
        console.error('❌ Specifica il nome del file da verificare');
        console.log('Uso: npm run backup:giacenze verify <filename>');
        process.exit(1);
      }
      await verifyBackup(filename);
      break;
    }
      
    default:
      console.log('📋 Uso:');
      console.log('  npm run backup:giacenze         # Crea backup');
      console.log('  npm run backup:giacenze list    # Lista backup');
      console.log('  npm run backup:giacenze verify <file>  # Verifica integrità');
      break;
  }
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { backupGiacenze, listBackups, verifyBackup };

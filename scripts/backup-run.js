#!/usr/bin/env node

/**
 * 🔄 BACKUP RUN - WINENODE
 * 
 * Wrapper semplificato per backup automatico con rotazione
 * Uso: node scripts/backup-run.js
 */

/* eslint-env node */

import { createBackup, listBackups } from './backup-system.js';

function log(message, type = 'INFO') {
    const timestamp = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
    const prefix = type === 'ERROR' ? '❌' : type === 'SUCCESS' ? '✅' : type === 'WARN' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

async function runBackup() {
    try {
        log('🔄 Avvio backup automatico...', 'INFO');
        
        // Crea backup
        const backupPath = await createBackup();
        
        if (backupPath) {
            log('✅ Backup completato con successo', 'SUCCESS');
            
            // Mostra lista aggiornata
            console.log('\n📋 BACKUP DISPONIBILI DOPO ROTAZIONE:\n');
            listBackups();
            
            return true;
        } else {
            log('❌ Backup fallito', 'ERROR');
            return false;
        }
        
    } catch (error) {
        log(`❌ Errore durante backup: ${error.message}`, 'ERROR');
        return false;
    }
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    runBackup().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        log(`❌ Errore fatale: ${error.message}`, 'ERROR');
        process.exit(1);
    });
}

export { runBackup };

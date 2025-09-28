#!/usr/bin/env node

/**
 * 🔄 SISTEMA RECOVERY RETENTION WINENODE
 * 
 * Funzionalità:
 * - Crea snapshot recovery con naming ISO: recovery_YYYYMMDD_HHMM.tar
 * - Applica retention policy (default 5, configurabile via RECOVERY_KEEP)
 * - Gestione rotazione automatica snapshot obsoleti
 * - Logging dettagliato con timestamp italiano
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SNAPSHOTS_DIR = path.join(PROJECT_ROOT, '.recovery', 'snapshots');

// Configurazione
const DEFAULT_KEEP = 5;
const RECOVERY_KEEP = process.env.RECOVERY_KEEP ? parseInt(process.env.RECOVERY_KEEP) : DEFAULT_KEEP;

/**
 * Formatta timestamp in formato italiano
 */
function getItalianTimestamp() {
    const now = new Date();
    const options = {
        timeZone: 'Europe/Rome',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    return now.toLocaleString('it-IT', options);
}

/**
 * Logger con timestamp italiano
 */
function log(message, type = 'INFO') {
    const timestamp = getItalianTimestamp();
    const prefix = type === 'ERROR' ? '❌' : type === 'SUCCESS' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

/**
 * Crea directory snapshots se non esiste
 */
async function ensureSnapshotsDir() {
    try {
        await fs.mkdir(SNAPSHOTS_DIR, { recursive: true });
        log(`Directory snapshots verificata: ${SNAPSHOTS_DIR}`);
    } catch (error) {
        log(`Errore creazione directory: ${error.message}`, 'ERROR');
        throw error;
    }
}

/**
 * Genera nome snapshot con formato ISO
 */
function generateSnapshotName() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `recovery_${year}${month}${day}_${hours}${minutes}.tar`;
}

/**
 * Crea nuovo snapshot recovery
 */
async function createSnapshot() {
    try {
        log('🔄 Creazione nuovo snapshot recovery...');
        
        await ensureSnapshotsDir();
        
        const snapshotName = generateSnapshotName();
        const snapshotPath = path.join(SNAPSHOTS_DIR, snapshotName);
        
        // Comando tar per creare snapshot
        const tarCommand = [
            'tar', '-cf', snapshotPath,
            'package.json', 'package-lock.json',
            'tsconfig.json', 'tsconfig.node.json',
            'vite.config.ts', 'vitest.config.ts',
            'scripts/', 'DOCS/', '.husky/', '.github/workflows/',
            '.editorconfig', '.gitattributes', '.gitignore', '.nvmrc'
        ].join(' ');
        
        execSync(tarCommand, { 
            cwd: PROJECT_ROOT,
            stdio: 'pipe'
        });
        
        // Verifica dimensione snapshot
        const stats = await fs.stat(snapshotPath);
        const size = (stats.size / 1024).toFixed(1);
        
        log(`✅ Snapshot creato: ${snapshotName}`, 'SUCCESS');
        log(`📊 Dimensione: ${size} KB`);
        
        return snapshotPath;
        
    } catch (error) {
        log(`❌ Errore creazione snapshot: ${error.message}`, 'ERROR');
        throw error;
    }
}

/**
 * Ottiene lista snapshot esistenti ordinati per data (più recente prima)
 */
async function getExistingSnapshots() {
    try {
        const files = await fs.readdir(SNAPSHOTS_DIR);
        const snapshots = [];
        
        for (const file of files) {
            if (file.startsWith('recovery_') && file.endsWith('.tar')) {
                const filePath = path.join(SNAPSHOTS_DIR, file);
                const stats = await fs.stat(filePath);
                snapshots.push({
                    name: file,
                    path: filePath,
                    mtime: stats.mtime
                });
            }
        }
        
        // Ordina per data modificazione (più recente prima)
        return snapshots.sort((a, b) => b.mtime - a.mtime);
        
    } catch (error) {
        log(`❌ Errore lettura snapshots: ${error.message}`, 'ERROR');
        return [];
    }
}

/**
 * Applica retention policy rimuovendo snapshot obsoleti
 */
async function rotateSnapshots() {
    try {
        log(`🔄 Applicazione retention policy (keep: ${RECOVERY_KEEP})...`);
        
        const snapshots = await getExistingSnapshots();
        
        if (snapshots.length <= RECOVERY_KEEP) {
            log(`📊 Snapshots attuali: ${snapshots.length}/${RECOVERY_KEEP} - nessuna rotazione necessaria`);
            return;
        }
        
        const toDelete = snapshots.slice(RECOVERY_KEEP);
        log(`🗑️ Rimozione ${toDelete.length} snapshot obsoleti...`);
        
        for (const snapshot of toDelete) {
            await fs.unlink(snapshot.path);
            log(`Rimosso: ${snapshot.name}`);
        }
        
        log(`✅ Retention applicata: mantenuti ${RECOVERY_KEEP} snapshot più recenti`, 'SUCCESS');
        
    } catch (error) {
        log(`❌ Errore rotazione snapshots: ${error.message}`, 'ERROR');
        throw error;
    }
}

/**
 * Lista snapshots esistenti
 */
async function listSnapshots() {
    try {
        const snapshots = await getExistingSnapshots();
        
        if (snapshots.length === 0) {
            log('📂 Nessun snapshot trovato');
            return;
        }
        
        console.log('\n📋 SNAPSHOTS RECOVERY DISPONIBILI:\n');
        console.log('Nome'.padEnd(30) + 'Data Creazione'.padEnd(20) + 'Dimensione');
        console.log('-'.repeat(70));
        
        snapshots.forEach((snapshot, index) => {
            const date = snapshot.mtime.toLocaleString('it-IT', {
                timeZone: 'Europe/Rome'
            });
            const stats = require('fs').statSync(snapshot.path);
            const size = `${(stats.size / 1024).toFixed(1)} KB`;
            const status = index === 0 ? ' (più recente)' : '';
            
            console.log(
                snapshot.name.padEnd(30) + 
                date.padEnd(20) + 
                size + 
                status
            );
        });
        
        console.log('');
        
    } catch (error) {
        log(`❌ Errore lista snapshots: ${error.message}`, 'ERROR');
        throw error;
    }
}

/**
 * Main function
 */
async function main() {
    const command = process.argv[2];
    
    try {
        switch (command) {
            case '--make':
                await createSnapshot();
                break;
                
            case '--rotate':
                await rotateSnapshots();
                break;
                
            case '--list':
                await listSnapshots();
                break;
                
            case '--gc':
                await createSnapshot();
                await rotateSnapshots();
                break;
                
            default:
                console.log(`
🔄 SISTEMA RECOVERY RETENTION WINENODE

Comandi disponibili:
  --make     Crea nuovo snapshot recovery
  --rotate   Applica retention policy (keep: ${RECOVERY_KEEP})
  --list     Lista snapshots esistenti
  --gc       Crea snapshot + applica retention

Esempi:
  node scripts/recovery-rotate.js --make
  node scripts/recovery-rotate.js --rotate
  RECOVERY_KEEP=3 node scripts/recovery-rotate.js --rotate

Configurazione:
  RECOVERY_KEEP=${RECOVERY_KEEP} (env var o default ${DEFAULT_KEEP})
  Snapshots dir: ${SNAPSHOTS_DIR}
                `);
        }
        
    } catch (error) {
        log(`❌ Errore fatale: ${error.message}`, 'ERROR');
        process.exit(1);
    }
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { createSnapshot, rotateSnapshots, listSnapshots };

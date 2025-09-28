#!/usr/bin/env node

/**
 * 🔄 SISTEMA BACKUP STANDARD WINENODE
 * 
 * Standard nuovo:
 * - Naming: backup_YYYYMMDD_HHMM.tar (formato ISO, no compressione)
 * - Rotazione automatica: max 3 file backup_*.tar
 * - Directory: Backup_Automatico/
 * - Contenuto: intero repo esclusi node_modules, .git, Backup_Automatico/*.tar*
 * - Logging chiaro con creazione, mantenuti, rimossi
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'Backup_Automatico');

// Configurazione
const MAX_BACKUPS = 3;

/**
 * Assicura che la directory di backup esista
 */
function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        console.log(`📁 Creata directory: ${BACKUP_DIR}`);
    }
}

/**
 * Genera timestamp in formato ISO: YYYYMMDD_HHMM
 */
function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}_${hours}${minutes}`;
}

/**
 * Crea backup con naming standard
 */
function createBackup() {
    const timestamp = getTimestamp();
    const backupName = `backup_${timestamp}.tar`;
    const backupPath = path.join(BACKUP_DIR, backupName);
    
    console.log(`🔄 Creazione backup: ${backupName}`);
    
    try {
        // Esegui tar con esclusioni
        const tarCommand = [
            'tar',
            '-cf',
            backupPath,
            '--exclude=node_modules',
            '--exclude=.git',
            '--exclude=Backup_Automatico/*.tar*',
            '--exclude=.DS_Store',
            '--exclude=*.log',
            '--exclude=.env',
            '--exclude=.env.*',
            '--exclude=*.tmp',
            '--exclude=*.temp',
            '--exclude=.cache',
            '.'
        ];
        
        execSync(tarCommand.join(' '), { 
            cwd: PROJECT_ROOT,
            stdio: 'pipe'
        });
        
        const stats = fs.statSync(backupPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
        
        console.log(`✅ Backup creato: ${backupName} (${sizeMB} MB)`);
        return backupName;
        
    } catch (error) {
        console.error(`❌ Errore creazione backup: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Ottiene lista backup ordinata per data (più recenti prima)
 */
function getBackupList() {
    if (!fs.existsSync(BACKUP_DIR)) {
        return [];
    }
    
    const files = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.match(/^backup_\d{8}_\d{4}\.tar$/))
        .map(file => ({
            name: file,
            path: path.join(BACKUP_DIR, file),
            mtime: fs.statSync(path.join(BACKUP_DIR, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
        .map(item => item.name);
    
    return files;
}

/**
 * Applica rotazione: mantiene solo i MAX_BACKUPS più recenti
 */
function applyRotation() {
    const backups = getBackupList();
    
    if (backups.length <= MAX_BACKUPS) {
        console.log(`📊 Backup attuali: ${backups.length}/${MAX_BACKUPS} (nessuna rimozione necessaria)`);
        return;
    }
    
    const toKeep = backups.slice(0, MAX_BACKUPS);
    const toRemove = backups.slice(MAX_BACKUPS);
    
    console.log(`📊 Rotazione: mantengo ${toKeep.length}, rimuovo ${toRemove.length}`);
    
    // Rimuovi backup in eccesso
    toRemove.forEach(backup => {
        const backupPath = path.join(BACKUP_DIR, backup);
        try {
            fs.unlinkSync(backupPath);
            console.log(`🗑️  Rimosso: ${backup}`);
        } catch (error) {
            console.error(`❌ Errore rimozione ${backup}: ${error.message}`);
        }
    });
    
    // Mostra backup mantenuti
    console.log(`📋 Backup mantenuti:`);
    toKeep.forEach((backup, index) => {
        const backupPath = path.join(BACKUP_DIR, backup);
        const stats = fs.statSync(backupPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
        console.log(`   ${index + 1}. ${backup} (${sizeMB} MB)`);
    });
}

/**
 * Funzione principale
 */
function main() {
    console.log('🔄 BACKUP STANDARD WINENODE');
    console.log('═'.repeat(50));
    
    // Assicura directory backup
    ensureBackupDir();
    
    // Crea nuovo backup
    const newBackup = createBackup();
    
    // Applica rotazione
    applyRotation();
    
    console.log('═'.repeat(50));
    console.log(`✅ Backup completato: ${newBackup}`);
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { createBackup, getBackupList, applyRotation };

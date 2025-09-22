#!/usr/bin/env node

/**
 * 🔄 SISTEMA BACKUP AUTOMATICO WINENODE
 * 
 * Funzionalità:
 * - Backup compressi .tar.gz in /Backup_Automatico/
 * - Naming: backup_ddMMyyyy_HHmm.tar.gz
 * - Rotazione automatica: max 3 copie
 * - Esclusioni: node_modules, .git, dist, cache, file temporanei
 * - Logging con timestamp IT
 * - Procedura sicura con verifica integrità
 * - Anteprima obbligatoria prima del ripristino
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(PROJECT_ROOT, 'Backup_Automatico');

// Configurazione
const MAX_BACKUPS = 3;
const EXCLUDED_PATTERNS = [
    'node_modules',
    '.git',
    'dist',
    '.DS_Store',
    '*.log',
    '.env',
    '.env.*',
    'Backup_Automatico',
    'attached_assets',
    '*.tmp',
    '*.temp',
    '.cache',
    '.vscode',
    '.idea'
];

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
 * Genera nome file backup con formato ddMMyyyy_HHmmss
 */
function generateBackupName() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    let baseName = `backup_${day}${month}${year}_${hours}${minutes}${seconds}`;
    let counter = 0;
    let fileName = `${baseName}.tar.gz`;
    
    // Evita duplicati aggiungendo un suffisso se necessario
    if (fs.existsSync(BACKUP_DIR)) {
        while (fs.existsSync(path.join(BACKUP_DIR, fileName))) {
            counter++;
            fileName = `${baseName}_${counter}.tar.gz`;
        }
    }
    
    return fileName;
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
 * Crea directory backup se non esiste
 */
function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        log(`Directory backup creata: ${BACKUP_DIR}`, 'SUCCESS');
    }
}

/**
 * Ottiene lista backup esistenti ordinati per data (più recente prima)
 */
function getExistingBackups() {
    if (!fs.existsSync(BACKUP_DIR)) return [];
    
    return fs.readdirSync(BACKUP_DIR)
        .filter(file => file.startsWith('backup_') && file.endsWith('.tar.gz'))
        .map(file => ({
            name: file,
            path: path.join(BACKUP_DIR, file),
            stats: fs.statSync(path.join(BACKUP_DIR, file))
        }))
        .sort((a, b) => b.stats.mtime - a.stats.mtime);
}

/**
 * Rimuove backup più vecchi mantenendo solo MAX_BACKUPS
 */
function rotateBackups() {
    const backups = getExistingBackups();
    
    if (backups.length >= MAX_BACKUPS) {
        const toDelete = backups.slice(MAX_BACKUPS - 1);
        toDelete.forEach(backup => {
            fs.unlinkSync(backup.path);
            log(`Backup rimosso (rotazione): ${backup.name}`, 'INFO');
        });
    }
}

/**
 * Crea file .tarignore con pattern di esclusione
 */
function createTarIgnore() {
    const tarIgnorePath = path.join(PROJECT_ROOT, '.tarignore');
    const content = EXCLUDED_PATTERNS.join('\n') + '\n';
    fs.writeFileSync(tarIgnorePath, content);
    return tarIgnorePath;
}

/**
 * Calcola dimensione file in formato human-readable
 */
function formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Verifica integrità backup
 */
function verifyBackup(backupPath) {
    try {
        execSync(`tar -tzf "${backupPath}" > /dev/null 2>&1`);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Crea backup del progetto
 */
async function createBackup() {
    try {
        log('🔄 Avvio processo backup...', 'INFO');
        
        ensureBackupDir();
        rotateBackups();
        
        const backupName = generateBackupName();
        const backupPath = path.join(BACKUP_DIR, backupName);
        const tempPath = `${backupPath}.tmp`;
        
        // Crea file .tarignore temporaneo
        const tarIgnorePath = createTarIgnore();
        
        log(`📦 Creazione backup: ${backupName}`, 'INFO');
        
        // Comando tar con esclusioni
        const tarCommand = [
            'tar',
            '-czf',
            tempPath,
            '--exclude-from',
            tarIgnorePath,
            '-C',
            path.dirname(PROJECT_ROOT),
            path.basename(PROJECT_ROOT)
        ];
        
        // Esegui backup
        execSync(tarCommand.join(' '), { 
            stdio: 'pipe',
            cwd: PROJECT_ROOT 
        });
        
        // Verifica integrità
        if (!verifyBackup(tempPath)) {
            throw new Error('Verifica integrità fallita');
        }
        
        // Sposta da temp a finale
        fs.renameSync(tempPath, backupPath);
        
        // Rimuovi file temporaneo
        fs.unlinkSync(tarIgnorePath);
        
        // Statistiche
        const stats = fs.statSync(backupPath);
        const size = formatFileSize(stats.size);
        
        log(`✅ Backup completato: ${backupName}`, 'SUCCESS');
        log(`📊 Dimensione: ${size}`, 'INFO');
        
        return backupPath;
        
    } catch (error) {
        log(`❌ Errore durante backup: ${error.message}`, 'ERROR');
        throw error;
    }
}

/**
 * Lista tutti i backup disponibili
 */
function listBackups() {
    const backups = getExistingBackups();
    
    if (backups.length === 0) {
        log('📂 Nessun backup trovato', 'INFO');
        return;
    }
    
    console.log('\n📋 BACKUP DISPONIBILI:\n');
    console.log('Nome'.padEnd(30) + 'Data Creazione'.padEnd(20) + 'Dimensione');
    console.log('-'.repeat(70));
    
    backups.forEach((backup, index) => {
        const date = backup.stats.mtime.toLocaleString('it-IT', {
            timeZone: 'Europe/Rome'
        });
        const size = formatFileSize(backup.stats.size);
        const status = index === 0 ? ' (più recente)' : '';
        
        console.log(
            backup.name.padEnd(30) + 
            date.padEnd(20) + 
            size + 
            status
        );
    });
    
    console.log('');
}

/**
 * Mostra anteprima contenuto backup
 */
function previewBackup(backupName) {
    const backupPath = path.join(BACKUP_DIR, backupName);
    
    if (!fs.existsSync(backupPath)) {
        log(`❌ Backup non trovato: ${backupName}`, 'ERROR');
        return false;
    }
    
    try {
        log(`🔍 Anteprima backup: ${backupName}`, 'INFO');
        
        const content = execSync(`tar -tzf "${backupPath}" | head -20`, { 
            encoding: 'utf8' 
        });
        
        console.log('\n📁 CONTENUTO BACKUP (primi 20 file):\n');
        console.log(content);
        
        const totalFiles = execSync(`tar -tzf "${backupPath}" | wc -l`, { 
            encoding: 'utf8' 
        }).trim();
        
        console.log(`📊 Totale file nel backup: ${totalFiles}\n`);
        
        return true;
        
    } catch (error) {
        log(`❌ Errore lettura backup: ${error.message}`, 'ERROR');
        return false;
    }
}

/**
 * Ripristina backup (con conferma)
 */
function restoreBackup(backupName, confirmed = false) {
    const backupPath = path.join(BACKUP_DIR, backupName);
    
    if (!fs.existsSync(backupPath)) {
        log(`❌ Backup non trovato: ${backupName}`, 'ERROR');
        return false;
    }
    
    if (!confirmed) {
        log('⚠️  ANTEPRIMA RIPRISTINO', 'INFO');
        previewBackup(backupName);
        console.log('⚠️  ATTENZIONE: Il ripristino sovrascriverà i file esistenti!');
        console.log(`📝 Per confermare il ripristino, esegui:`);
        console.log(`   npm run restore-confirm ${backupName}`);
        return false;
    }
    
    try {
        log(`🔄 Avvio ripristino backup: ${backupName}`, 'INFO');
        
        // Verifica integrità prima del ripristino
        if (!verifyBackup(backupPath)) {
            throw new Error('Backup corrotto - ripristino annullato');
        }
        
        // Crea backup di sicurezza prima del ripristino
        const safetyBackup = `safety_${generateBackupName()}`;
        log('🛡️  Creazione backup di sicurezza...', 'INFO');
        createBackup();
        
        // Ripristina backup
        execSync(`tar -xzf "${backupPath}" -C "${path.dirname(PROJECT_ROOT)}" --overwrite`, {
            stdio: 'inherit'
        });
        
        log(`✅ Ripristino completato: ${backupName}`, 'SUCCESS');
        log('🛡️  Backup di sicurezza creato prima del ripristino', 'INFO');
        
        return true;
        
    } catch (error) {
        log(`❌ Errore durante ripristino: ${error.message}`, 'ERROR');
        return false;
    }
}

/**
 * Main function
 */
async function main() {
    const command = process.argv[2];
    const arg = process.argv[3];
    
    switch (command) {
        case 'create':
            await createBackup();
            break;
            
        case 'list':
            listBackups();
            break;
            
        case 'preview':
            if (!arg) {
                log('❌ Specificare nome backup per anteprima', 'ERROR');
                process.exit(1);
            }
            previewBackup(arg);
            break;
            
        case 'restore':
            if (!arg) {
                log('❌ Specificare nome backup per ripristino', 'ERROR');
                process.exit(1);
            }
            restoreBackup(arg, false);
            break;
            
        case 'restore-confirm':
            if (!arg) {
                log('❌ Specificare nome backup per conferma ripristino', 'ERROR');
                process.exit(1);
            }
            restoreBackup(arg, true);
            break;
            
        default:
            console.log(`
🔄 SISTEMA BACKUP AUTOMATICO WINENODE

Comandi disponibili:
  npm run backup          - Crea nuovo backup
  npm run backup:list     - Lista backup disponibili  
  npm run backup:restore  - Anteprima ripristino
  npm run restore-confirm <nome> - Conferma ripristino

Esempi:
  npm run backup
  npm run backup:list
  npm run backup:restore backup_22092025_0149.tar.gz
  npm run restore-confirm backup_22092025_0149.tar.gz
            `);
    }
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        log(`❌ Errore fatale: ${error.message}`, 'ERROR');
        process.exit(1);
    });
}

export { createBackup, listBackups, previewBackup, restoreBackup };

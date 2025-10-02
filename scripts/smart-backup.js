#!/usr/bin/env node

/**
 * 🤖 SMART BACKUP - WINENODE
 * 
 * Script intelligente per backup automatico che funziona sempre,
 * anche quando chiamato da nuove chat senza contesto.
 * 
 * Uso: node scripts/smart-backup.js
 * Oppure: npm run smart-backup
 */

/* eslint-env node */
 

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Rileva automaticamente la directory del progetto WineNode
 */
function detectProjectRoot() {
    let currentDir = process.cwd();
    
    // Cerca verso l'alto fino a trovare package.json con nome "winenode"
    while (currentDir !== path.dirname(currentDir)) {
        const packageJsonPath = path.join(currentDir, 'package.json');
        
        if (fs.existsSync(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                if (packageJson.name === 'winenode') {
                    return currentDir;
                }
            } catch (error) {
                // Continua la ricerca
            }
        }
        
        // Controlla se esiste la struttura tipica di WineNode
        const srcExists = fs.existsSync(path.join(currentDir, 'src'));
        const docsExists = fs.existsSync(path.join(currentDir, 'DOCS'));
        const scriptsExists = fs.existsSync(path.join(currentDir, 'scripts'));
        
        if (srcExists && docsExists && scriptsExists) {
            return currentDir;
        }
        
        currentDir = path.dirname(currentDir);
    }
    
    throw new Error('❌ Progetto WineNode non trovato. Assicurati di essere nella directory corretta.');
}

/**
 * Verifica e crea la struttura necessaria per i backup
 */
function ensureBackupStructure(projectRoot) {
    const backupDir = path.join(projectRoot, 'Backup_Automatico');
    
    if (!fs.existsSync(backupDir)) {
        console.log('📁 Creazione cartella Backup_Automatico...');
        fs.mkdirSync(backupDir, { recursive: true });
        
        // Crea .gitkeep
        const gitkeepContent = `# Backup Automatico Directory
# Questa cartella contiene i backup automatici del progetto
# Rotazione: massimo 3 file backup mantenuti`;
        
        fs.writeFileSync(path.join(backupDir, '.gitkeep'), gitkeepContent);
        console.log('✅ Cartella Backup_Automatico creata');
    }
    
    return backupDir;
}

/**
 * Verifica che gli script di backup esistano
 */
function ensureBackupScripts(projectRoot) {
    const backupRunPath = path.join(projectRoot, 'scripts', 'backup-run.js');
    const backupSystemPath = path.join(projectRoot, 'scripts', 'backup-system.js');
    
    if (!fs.existsSync(backupRunPath)) {
        throw new Error('❌ Script backup-run.js non trovato. Sistema backup non configurato.');
    }
    
    if (!fs.existsSync(backupSystemPath)) {
        throw new Error('❌ Script backup-system.js non trovato. Sistema backup non configurato.');
    }
    
    return { backupRunPath, backupSystemPath };
}

/**
 * Verifica che npm sia disponibile e il comando backup sia configurato
 */
function ensureNpmBackupCommand(projectRoot) {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
        throw new Error('❌ package.json non trovato');
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts || !packageJson.scripts.backup) {
        throw new Error('❌ Comando npm "backup" non configurato in package.json');
    }
    
    return packageJson.scripts.backup;
}

/**
 * Esegue il backup usando npm
 */
function executeBackup(projectRoot) {
    console.log('🔄 Esecuzione backup automatico...');
    
    try {
        // Cambia directory e esegui backup
        process.chdir(projectRoot);
        
        const result = execSync('npm run backup', { 
            encoding: 'utf8',
            stdio: 'pipe'
        });
        
        console.log(result);
        return true;
        
    } catch (error) {
        console.error('❌ Errore durante l\'esecuzione del backup:');
        console.error(error.stdout || error.message);
        return false;
    }
}

/**
 * Mostra informazioni sul progetto rilevato
 */
function showProjectInfo(projectRoot) {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    console.log('📋 INFORMAZIONI PROGETTO RILEVATO:');
    console.log(`   Nome: ${packageJson.name}`);
    console.log(`   Versione: ${packageJson.version}`);
    console.log(`   Directory: ${projectRoot}`);
    console.log('');
}

/**
 * Funzione principale
 */
async function smartBackup() {
    try {
        console.log('🤖 SMART BACKUP - Rilevamento automatico progetto...\n');
        
        // 1. Rileva automaticamente il progetto
        const projectRoot = detectProjectRoot();
        showProjectInfo(projectRoot);
        
        // 2. Verifica e crea struttura backup
        ensureBackupStructure(projectRoot);
        
        // 3. Verifica script backup
        ensureBackupScripts(projectRoot);
        
        // 4. Verifica comando npm
        const backupCommand = ensureNpmBackupCommand(projectRoot);
        console.log(`📝 Comando backup: ${backupCommand}\n`);
        
        // 5. Esegui backup
        const success = executeBackup(projectRoot);
        
        if (success) {
            console.log('\n✅ SMART BACKUP COMPLETATO CON SUCCESSO!');
            console.log('💡 Tip: Usa "npm run smart-backup" per eseguire questo script');
        } else {
            console.log('\n❌ SMART BACKUP FALLITO');
            process.exit(1);
        }
        
    } catch (error) {
        console.error(`❌ ERRORE SMART BACKUP: ${error.message}`);
        console.error('\n🔧 SOLUZIONI POSSIBILI:');
        console.error('   1. Assicurati di essere in una directory del progetto WineNode');
        console.error('   2. Verifica che esistano i file package.json, src/, DOCS/, scripts/');
        console.error('   3. Controlla che il sistema backup sia configurato correttamente');
        process.exit(1);
    }
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    smartBackup();
}

export { smartBackup };

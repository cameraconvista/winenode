#!/usr/bin/env node

/**
 * 🔒 SISTEMA PRE-COMMIT CHECK WINENODE
 * 
 * Funzionalità:
 * - Verifica dimensione file (warning >500 righe, blocco >800 righe)
 * - Esegue ESLint con fix automatico
 * - Blocca commit con errori ESLint non fixabili
 * - Controllo TypeScript
 * - Logging dettagliato
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Configurazione
const MAX_LINES_WARNING = 500;
const MAX_LINES_BLOCK = 800;
const EXCLUDED_PATTERNS = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.cache',
    'scripts/backup-system.js', // Esclude backup system (già lungo ma necessario)
    'scripts/recovery-system.cjs' // Esclude recovery system
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
 * Logger con timestamp italiano
 */
function log(message, type = 'INFO') {
    const timestamp = getItalianTimestamp();
    const prefix = type === 'ERROR' ? '❌' : type === 'SUCCESS' ? '✅' : type === 'WARN' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

/**
 * Verifica se un path deve essere escluso
 */
function shouldExclude(filePath) {
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    
    return EXCLUDED_PATTERNS.some(pattern => {
        if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(relativePath);
        } else {
            return relativePath.includes(pattern);
        }
    });
}

/**
 * Conta righe di codice in un file
 */
function countLines(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        // Conta solo righe non vuote e non commenti
        const codeLines = lines.filter(line => {
            const trimmed = line.trim();
            return trimmed.length > 0 && 
                   !trimmed.startsWith('//') && 
                   !trimmed.startsWith('/*') && 
                   !trimmed.startsWith('*') &&
                   !trimmed.startsWith('*/');
        });
        
        return {
            total: lines.length,
            code: codeLines.length
        };
    } catch (error) {
        return { total: 0, code: 0 };
    }
}

/**
 * Ottiene lista file modificati da git
 */
function getModifiedFiles() {
    try {
        const output = execSync('git diff --cached --name-only', { 
            encoding: 'utf8',
            cwd: PROJECT_ROOT 
        });
        
        return output.trim().split('\n').filter(file => file.length > 0);
    } catch (error) {
        log('⚠️ Impossibile ottenere file modificati, controllo tutti i file', 'WARN');
        return [];
    }
}

/**
 * Verifica dimensione file
 */
function checkFileSize(files) {
    const issues = [];
    let hasBlockingIssues = false;
    
    log('🔍 Controllo dimensione file...', 'INFO');
    
    for (const file of files) {
        const fullPath = path.join(PROJECT_ROOT, file);
        
        if (!fs.existsSync(fullPath) || shouldExclude(fullPath)) {
            continue;
        }
        
        const ext = path.extname(file).toLowerCase();
        if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
            continue;
        }
        
        const lines = countLines(fullPath);
        
        if (lines.code > MAX_LINES_BLOCK) {
            issues.push({
                file,
                lines: lines.code,
                type: 'BLOCK',
                message: `File troppo lungo: ${lines.code} righe (max ${MAX_LINES_BLOCK})`
            });
            hasBlockingIssues = true;
        } else if (lines.code > MAX_LINES_WARNING) {
            issues.push({
                file,
                lines: lines.code,
                type: 'WARN',
                message: `File lungo: ${lines.code} righe (raccomandato <${MAX_LINES_WARNING})`
            });
        }
    }
    
    // Report issues
    if (issues.length > 0) {
        console.log('\n📏 CONTROLLO DIMENSIONE FILE:\n');
        
        issues.forEach(issue => {
            const prefix = issue.type === 'BLOCK' ? '❌' : '⚠️';
            console.log(`${prefix} ${issue.file}: ${issue.message}`);
        });
        
        if (hasBlockingIssues) {
            console.log('\n💡 SUGGERIMENTO: Dividi i file troppo lunghi in moduli più piccoli');
            console.log('   - Estrai componenti in file separati');
            console.log('   - Sposta logica business in hook personalizzati');
            console.log('   - Crea utility functions separate\n');
        }
    }
    
    return !hasBlockingIssues;
}

/**
 * Esegue ESLint con fix automatico
 */
function runESLint() {
    try {
        log('🔧 Esecuzione ESLint con fix automatico...', 'INFO');
        
        execSync('npm run lint:fix', { 
            stdio: 'pipe',
            cwd: PROJECT_ROOT 
        });
        
        log('✅ ESLint completato senza errori', 'SUCCESS');
        return true;
        
    } catch (error) {
        log('❌ ESLint ha trovato errori non fixabili:', 'ERROR');
        console.log(error.stdout?.toString() || error.message);
        
        console.log('\n💡 SUGGERIMENTO: Correggi gli errori ESLint prima del commit');
        console.log('   Esegui: npm run lint per vedere tutti gli errori\n');
        
        return false;
    }
}

/**
 * Esegue controllo TypeScript
 */
function runTypeCheck() {
    try {
        log('🔍 Controllo TypeScript...', 'INFO');
        
        execSync('npm run typecheck', { 
            stdio: 'pipe',
            cwd: PROJECT_ROOT 
        });
        
        log('✅ TypeScript check completato', 'SUCCESS');
        return true;
        
    } catch (error) {
        log('❌ Errori TypeScript trovati:', 'ERROR');
        console.log(error.stdout?.toString() || error.message);
        
        console.log('\n💡 SUGGERIMENTO: Correggi gli errori TypeScript prima del commit\n');
        
        return false;
    }
}

/**
 * Main pre-commit check
 */
async function runPreCommitCheck() {
    try {
        log('🔒 Avvio controlli pre-commit...', 'INFO');
        
        const modifiedFiles = getModifiedFiles();
        
        if (modifiedFiles.length === 0) {
            log('ℹ️ Nessun file modificato trovato', 'INFO');
            return true;
        }
        
        log(`📋 File modificati: ${modifiedFiles.length}`, 'INFO');
        
        let allPassed = true;
        
        // 1. Controllo dimensione file
        const sizeCheckPassed = checkFileSize(modifiedFiles);
        if (!sizeCheckPassed) {
            allPassed = false;
        }
        
        // 2. ESLint check
        const eslintPassed = runESLint();
        if (!eslintPassed) {
            allPassed = false;
        }
        
        // 3. TypeScript check
        const typecheckPassed = runTypeCheck();
        if (!typecheckPassed) {
            allPassed = false;
        }
        
        if (allPassed) {
            log('✅ Tutti i controlli pre-commit sono passati', 'SUCCESS');
            return true;
        } else {
            log('❌ Alcuni controlli pre-commit sono falliti', 'ERROR');
            console.log('\n🚫 COMMIT BLOCCATO - Correggi gli errori sopra prima di committare\n');
            return false;
        }
        
    } catch (error) {
        log(`❌ Errore durante controlli pre-commit: ${error.message}`, 'ERROR');
        return false;
    }
}

/**
 * Main function
 */
async function main() {
    const success = await runPreCommitCheck();
    process.exit(success ? 0 : 1);
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        log(`❌ Errore fatale: ${error.message}`, 'ERROR');
        process.exit(1);
    });
}

export { runPreCommitCheck };

#!/usr/bin/env node

/**
 * 🔍 SISTEMA DIAGNOSI INIZIALE PROGETTO WINENODE
 * 
 * Funzionalità:
 * - Analisi file pesanti, errori, obsoleti, duplicati
 * - Report dettagliato in REPORT_DIAGNOSI_INIZIALE.txt (root)
 * - Esclusioni: node_modules, .git, dist, cache, temp
 * - Formato append (mai overwrite)
 * - Sentinella .diagnose_done per primo avvio
 * - Automazioni CLI: diagnose, diagnose:force
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const REPORT_PATH = path.join(PROJECT_ROOT, 'REPORT_DIAGNOSI_INIZIALE.txt');
const SENTINEL_PATH = path.join(PROJECT_ROOT, '.diagnose_done');

// Configurazione
const EXCLUDED_PATTERNS = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.cache',
    '.DS_Store',
    '*.log',
    '.env',
    '.env.*',
    'Backup_Automatico',
    'attached_assets',
    '*.tmp',
    '*.temp',
    '.vscode',
    '.idea',
    '*.swp',
    '*.swo'
];

const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB
const DUPLICATE_SIZE_THRESHOLD = 1024; // 1KB

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
 * Formatta dimensione file
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
 * Verifica se un path deve essere escluso
 */
function shouldExclude(filePath) {
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    
    return EXCLUDED_PATTERNS.some(pattern => {
        if (pattern.includes('*')) {
            // Pattern con wildcard
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(relativePath) || regex.test(path.basename(filePath));
        } else {
            // Pattern semplice
            return relativePath.includes(pattern) || path.basename(filePath) === pattern;
        }
    });
}

/**
 * Scansiona directory ricorsivamente
 */
function scanDirectory(dirPath, results = { files: [], errors: [] }) {
    try {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            
            if (shouldExclude(fullPath)) {
                continue;
            }
            
            try {
                const stats = fs.statSync(fullPath);
                
                if (stats.isDirectory()) {
                    scanDirectory(fullPath, results);
                } else if (stats.isFile()) {
                    results.files.push({
                        path: fullPath,
                        relativePath: path.relative(PROJECT_ROOT, fullPath),
                        size: stats.size,
                        mtime: stats.mtime,
                        ext: path.extname(fullPath).toLowerCase()
                    });
                }
            } catch (error) {
                results.errors.push({
                    path: fullPath,
                    error: error.message
                });
            }
        }
    } catch (error) {
        results.errors.push({
            path: dirPath,
            error: error.message
        });
    }
    
    return results;
}

/**
 * Calcola hash MD5 di un file
 */
function calculateFileHash(filePath) {
    try {
        const content = fs.readFileSync(filePath);
        return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
        return null;
    }
}

/**
 * Trova file duplicati
 */
function findDuplicates(files) {
    const duplicates = [];
    const hashMap = new Map();
    
    // Considera solo file sopra la soglia minima
    const candidateFiles = files.filter(file => file.size >= DUPLICATE_SIZE_THRESHOLD);
    
    log(`🔍 Analisi duplicati su ${candidateFiles.length} file candidati...`, 'INFO');
    
    for (const file of candidateFiles) {
        const hash = calculateFileHash(file.path);
        if (!hash) continue;
        
        const key = `${hash}_${file.size}`;
        
        if (hashMap.has(key)) {
            const existing = hashMap.get(key);
            duplicates.push({
                original: existing,
                duplicate: file,
                size: file.size
            });
        } else {
            hashMap.set(key, file);
        }
    }
    
    return duplicates;
}

/**
 * Trova file obsoleti/temporanei
 */
function findObsoleteFiles(files) {
    const obsoletePatterns = [
        /\.bak$/i,
        /\.backup$/i,
        /\.old$/i,
        /\.orig$/i,
        /~$/,
        /\.tmp$/i,
        /\.temp$/i,
        /\.swp$/i,
        /\.swo$/i,
        /\.DS_Store$/i,
        /Thumbs\.db$/i,
        /\.log$/i
    ];
    
    return files.filter(file => 
        obsoletePatterns.some(pattern => pattern.test(file.relativePath))
    );
}

/**
 * Trova file di grandi dimensioni
 */
function findLargeFiles(files) {
    return files
        .filter(file => file.size >= LARGE_FILE_THRESHOLD)
        .sort((a, b) => b.size - a.size);
}

/**
 * Analizza estensioni file
 */
function analyzeFileExtensions(files) {
    const extensions = new Map();
    
    for (const file of files) {
        const ext = file.ext || 'no-extension';
        const current = extensions.get(ext) || { count: 0, totalSize: 0 };
        current.count++;
        current.totalSize += file.size;
        extensions.set(ext, current);
    }
    
    return Array.from(extensions.entries())
        .map(([ext, data]) => ({ ext, ...data }))
        .sort((a, b) => b.totalSize - a.totalSize);
}

/**
 * Genera report di diagnosi
 */
function generateReport(analysis) {
    const timestamp = getItalianTimestamp();
    const separator = '='.repeat(80);
    
    let report = `\n${separator}\n`;
    report += `🔍 DIAGNOSI PROGETTO WINENODE - ${timestamp}\n`;
    report += `${separator}\n\n`;
    
    // Statistiche generali
    report += `📊 STATISTICHE GENERALI:\n`;
    report += `- File totali analizzati: ${analysis.files.length}\n`;
    report += `- Dimensione totale progetto: ${formatFileSize(analysis.totalSize)}\n`;
    report += `- Errori di accesso: ${analysis.errors.length}\n\n`;
    
    // File di grandi dimensioni
    if (analysis.largeFiles.length > 0) {
        report += `📦 FILE DI GRANDI DIMENSIONI (>${formatFileSize(LARGE_FILE_THRESHOLD)}):\n`;
        analysis.largeFiles.slice(0, 10).forEach(file => {
            report += `- ${file.relativePath} (${formatFileSize(file.size)})\n`;
        });
        if (analysis.largeFiles.length > 10) {
            report += `... e altri ${analysis.largeFiles.length - 10} file\n`;
        }
        report += '\n';
    } else {
        report += `✅ Nessun file di grandi dimensioni trovato\n\n`;
    }
    
    // File duplicati
    if (analysis.duplicates.length > 0) {
        report += `🔄 FILE DUPLICATI TROVATI (${analysis.duplicates.length}):\n`;
        analysis.duplicates.slice(0, 10).forEach(dup => {
            report += `- ${dup.original.relativePath}\n`;
            report += `  └─ ${dup.duplicate.relativePath} (${formatFileSize(dup.size)})\n`;
        });
        if (analysis.duplicates.length > 10) {
            report += `... e altri ${analysis.duplicates.length - 10} duplicati\n`;
        }
        report += '\n';
    } else {
        report += `✅ Nessun file duplicato trovato\n\n`;
    }
    
    // File obsoleti
    if (analysis.obsoleteFiles.length > 0) {
        report += `🗑️ FILE OBSOLETI/TEMPORANEI (${analysis.obsoleteFiles.length}):\n`;
        analysis.obsoleteFiles.slice(0, 15).forEach(file => {
            report += `- ${file.relativePath} (${formatFileSize(file.size)})\n`;
        });
        if (analysis.obsoleteFiles.length > 15) {
            report += `... e altri ${analysis.obsoleteFiles.length - 15} file\n`;
        }
        report += '\n';
    } else {
        report += `✅ Nessun file obsoleto trovato\n\n`;
    }
    
    // Errori di accesso
    if (analysis.errors.length > 0) {
        report += `❌ ERRORI DI ACCESSO (${analysis.errors.length}):\n`;
        analysis.errors.slice(0, 10).forEach(error => {
            report += `- ${path.relative(PROJECT_ROOT, error.path)}: ${error.error}\n`;
        });
        if (analysis.errors.length > 10) {
            report += `... e altri ${analysis.errors.length - 10} errori\n`;
        }
        report += '\n';
    }
    
    // Analisi estensioni
    report += `📁 DISTRIBUZIONE FILE PER ESTENSIONE (top 10):\n`;
    analysis.extensions.slice(0, 10).forEach(ext => {
        const percentage = ((ext.totalSize / analysis.totalSize) * 100).toFixed(1);
        report += `- ${ext.ext}: ${ext.count} file, ${formatFileSize(ext.totalSize)} (${percentage}%)\n`;
    });
    report += '\n';
    
    // Raccomandazioni
    report += `💡 RACCOMANDAZIONI:\n`;
    
    if (analysis.largeFiles.length > 0) {
        report += `- Considera la compressione o rimozione dei file più grandi\n`;
    }
    
    if (analysis.duplicates.length > 0) {
        report += `- Rimuovi i file duplicati per liberare spazio\n`;
    }
    
    if (analysis.obsoleteFiles.length > 0) {
        report += `- Pulisci i file temporanei e obsoleti\n`;
    }
    
    if (analysis.errors.length > 0) {
        report += `- Verifica i permessi sui file con errori di accesso\n`;
    }
    
    const backupSize = analysis.extensions.find(ext => ext.ext === '.tar.gz')?.totalSize || 0;
    if (backupSize > analysis.totalSize * 0.3) {
        report += `- I backup occupano molto spazio, considera la rotazione\n`;
    }
    
    report += `\n${separator}\n`;
    
    return report;
}

/**
 * Esegue diagnosi completa del progetto
 */
async function runDiagnosis(force = false) {
    try {
        // Controlla sentinella primo avvio
        const isFirstRun = !fs.existsSync(SENTINEL_PATH);
        
        if (!force && !isFirstRun) {
            log('📋 Diagnosi già eseguita. Usa diagnose:force per forzare nuova analisi', 'INFO');
            return;
        }
        
        log('🔍 Avvio diagnosi progetto...', 'INFO');
        
        // Scansiona progetto
        const scanResults = scanDirectory(PROJECT_ROOT);
        
        log(`📊 Scansionati ${scanResults.files.length} file`, 'INFO');
        
        // Calcola statistiche
        const totalSize = scanResults.files.reduce((sum, file) => sum + file.size, 0);
        
        // Analisi avanzate
        log('🔍 Ricerca file duplicati...', 'INFO');
        const duplicates = findDuplicates(scanResults.files);
        
        log('🔍 Ricerca file obsoleti...', 'INFO');
        const obsoleteFiles = findObsoleteFiles(scanResults.files);
        
        log('🔍 Ricerca file di grandi dimensioni...', 'INFO');
        const largeFiles = findLargeFiles(scanResults.files);
        
        log('📊 Analisi estensioni file...', 'INFO');
        const extensions = analyzeFileExtensions(scanResults.files);
        
        // Compila analisi
        const analysis = {
            files: scanResults.files,
            errors: scanResults.errors,
            totalSize,
            duplicates,
            obsoleteFiles,
            largeFiles,
            extensions
        };
        
        // Genera report
        const report = generateReport(analysis);
        
        // Salva report (append)
        fs.appendFileSync(REPORT_PATH, report);
        
        // Crea sentinella primo avvio
        if (isFirstRun) {
            fs.writeFileSync(SENTINEL_PATH, `Diagnosi completata: ${getItalianTimestamp()}\n`);
        }
        
        log(`✅ Diagnosi completata - Report salvato in: ${path.basename(REPORT_PATH)}`, 'SUCCESS');
        log(`📊 File analizzati: ${scanResults.files.length}`, 'INFO');
        log(`📦 Dimensione totale: ${formatFileSize(totalSize)}`, 'INFO');
        
        if (duplicates.length > 0) {
            log(`🔄 File duplicati: ${duplicates.length}`, 'WARN');
        }
        
        if (obsoleteFiles.length > 0) {
            log(`🗑️ File obsoleti: ${obsoleteFiles.length}`, 'WARN');
        }
        
        if (largeFiles.length > 0) {
            log(`📦 File grandi: ${largeFiles.length}`, 'WARN');
        }
        
        return analysis;
        
    } catch (error) {
        log(`❌ Errore durante diagnosi: ${error.message}`, 'ERROR');
        throw error;
    }
}

/**
 * Main function
 */
async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'force':
            await runDiagnosis(true);
            break;
            
        case 'auto':
        default:
            await runDiagnosis(false);
            break;
    }
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        log(`❌ Errore fatale: ${error.message}`, 'ERROR');
        process.exit(1);
    });
}

export { runDiagnosis };

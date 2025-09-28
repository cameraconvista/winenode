#!/usr/bin/env node

/**
 * 🧹 CLEANUP - WINENODE
 * 
 * Funzionalità:
 * - Trova file obsoleti e duplicati
 * - Segnala file temporanei da rimuovere
 * - Identifica asset inutilizzati
 * - Report dettagliato con suggerimenti di pulizia
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Configurazione
const EXCLUDED_PATTERNS = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.cache'
];

const OBSOLETE_PATTERNS = [
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
    /\.log$/i,
    /\.pid$/i,
    /\.lock$/i
];

/**
 * Logger
 */
function log(message, type = 'INFO') {
    const prefix = type === 'ERROR' ? '❌' : type === 'SUCCESS' ? '✅' : type === 'WARN' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} ${message}`);
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
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(relativePath);
        } else {
            return relativePath.includes(pattern);
        }
    });
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
 * Scansiona directory ricorsivamente
 */
function scanDirectory(dirPath, results = []) {
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
                    results.push({
                        path: fullPath,
                        relativePath: path.relative(PROJECT_ROOT, fullPath),
                        size: stats.size,
                        mtime: stats.mtime,
                        ext: path.extname(fullPath).toLowerCase(),
                        name: path.basename(fullPath)
                    });
                }
            } catch (error) {
                // Ignora errori di accesso file
            }
        }
    } catch (error) {
        // Ignora errori di accesso directory
    }
    
    return results;
}

/**
 * Trova file obsoleti
 */
function findObsoleteFiles(files) {
    return files.filter(file => 
        OBSOLETE_PATTERNS.some(pattern => pattern.test(file.name))
    );
}

/**
 * Trova file duplicati
 */
function findDuplicates(files) {
    const duplicates = [];
    const hashMap = new Map();
    
    // Considera solo file sopra 1KB
    const candidateFiles = files.filter(file => file.size >= 1024);
    
    log(`🔍 Analisi duplicati su ${candidateFiles.length} file...`, 'INFO');
    
    for (const file of candidateFiles) {
        const hash = calculateFileHash(file.path);
        if (!hash) continue;
        
        const key = `${hash}_${file.size}`;
        
        if (hashMap.has(key)) {
            const existing = hashMap.get(key);
            duplicates.push({
                original: existing,
                duplicate: file,
                size: file.size,
                hash
            });
        } else {
            hashMap.set(key, file);
        }
    }
    
    return duplicates;
}

/**
 * Trova file grandi inutilizzati
 */
function findLargeUnusedFiles(files) {
    const largeFiles = files.filter(file => file.size >= 10 * 1024 * 1024); // 10MB+
    
    // Controlla se sono referenziati nel codice
    const unused = [];
    
    for (const file of largeFiles) {
        const fileName = path.basename(file.name, file.ext);
        const isReferenced = files.some(codeFile => {
            if (!['.ts', '.tsx', '.js', '.jsx', '.html', '.css'].includes(codeFile.ext)) {
                return false;
            }
            
            try {
                const content = fs.readFileSync(codeFile.path, 'utf8');
                return content.includes(fileName) || content.includes(file.name);
            } catch (error) {
                return false;
            }
        });
        
        if (!isReferenced) {
            unused.push(file);
        }
    }
    
    return unused;
}

/**
 * Trova directory vuote
 */
function findEmptyDirectories(startPath = PROJECT_ROOT) {
    const emptyDirs = [];
    
    function scanDir(dirPath) {
        if (shouldExclude(dirPath)) {
            return;
        }
        
        try {
            const items = fs.readdirSync(dirPath);
            const subDirs = [];
            let hasFiles = false;
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const stats = fs.statSync(fullPath);
                
                if (stats.isDirectory()) {
                    subDirs.push(fullPath);
                } else {
                    hasFiles = true;
                }
            }
            
            // Scansiona sottodirectory
            subDirs.forEach(scanDir);
            
            // Se non ha file e tutte le sottodirectory sono vuote
            if (!hasFiles && subDirs.length === 0) {
                emptyDirs.push({
                    path: dirPath,
                    relativePath: path.relative(PROJECT_ROOT, dirPath)
                });
            }
        } catch (error) {
            // Ignora errori di accesso
        }
    }
    
    scanDir(startPath);
    return emptyDirs;
}

/**
 * Analizza report di build/log per file non utilizzati
 */
function findUnusedReports() {
    const reportFiles = [];
    const reportPatterns = [
        /REPORT_.*\.txt$/i,
        /REPORT_.*\.md$/i,
        /.*_REPORT\.txt$/i,
        /.*_REPORT\.md$/i,
        /DIAGNOSI.*\.md$/i,
        /BACKUP.*\.md$/i
    ];
    
    const files = scanDirectory(PROJECT_ROOT);
    
    for (const file of files) {
        if (reportPatterns.some(pattern => pattern.test(file.name))) {
            // Controlla se è vecchio (>30 giorni)
            const daysSinceModified = (Date.now() - file.mtime.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceModified > 30) {
                reportFiles.push({
                    ...file,
                    daysSinceModified: Math.round(daysSinceModified)
                });
            }
        }
    }
    
    return reportFiles;
}

/**
 * Main cleanup analysis
 */
function runCleanupAnalysis() {
    console.log('🧹 ANALISI CLEANUP WINENODE\n');
    
    log('📁 Scansione file progetto...', 'INFO');
    const files = scanDirectory(PROJECT_ROOT);
    
    console.log('🗑️ FILE OBSOLETI:');
    const obsoleteFiles = findObsoleteFiles(files);
    if (obsoleteFiles.length > 0) {
        const totalSize = obsoleteFiles.reduce((sum, f) => sum + f.size, 0);
        log(`Trovati ${obsoleteFiles.length} file obsoleti (${formatFileSize(totalSize)})`, 'WARN');
        
        obsoleteFiles.slice(0, 10).forEach(file => {
            console.log(`   🗑️ ${file.relativePath} (${formatFileSize(file.size)})`);
        });
        
        if (obsoleteFiles.length > 10) {
            console.log(`   ... e altri ${obsoleteFiles.length - 10} file`);
        }
    } else {
        log('Nessun file obsoleto trovato', 'SUCCESS');
    }
    console.log('');
    
    console.log('🔄 FILE DUPLICATI:');
    const duplicates = findDuplicates(files);
    if (duplicates.length > 0) {
        const totalWastedSize = duplicates.reduce((sum, d) => sum + d.size, 0);
        log(`Trovati ${duplicates.length} file duplicati (${formatFileSize(totalWastedSize)} sprecati)`, 'WARN');
        
        duplicates.slice(0, 5).forEach(dup => {
            console.log(`   🔄 ${dup.original.relativePath}`);
            console.log(`      └─ ${dup.duplicate.relativePath} (${formatFileSize(dup.size)})`);
        });
        
        if (duplicates.length > 5) {
            console.log(`   ... e altri ${duplicates.length - 5} duplicati`);
        }
    } else {
        log('Nessun file duplicato trovato', 'SUCCESS');
    }
    console.log('');
    
    console.log('📦 FILE GRANDI INUTILIZZATI:');
    const largeUnused = findLargeUnusedFiles(files);
    if (largeUnused.length > 0) {
        const totalSize = largeUnused.reduce((sum, f) => sum + f.size, 0);
        log(`Trovati ${largeUnused.length} file grandi non referenziati (${formatFileSize(totalSize)})`, 'WARN');
        
        largeUnused.forEach(file => {
            console.log(`   📦 ${file.relativePath} (${formatFileSize(file.size)})`);
        });
    } else {
        log('Nessun file grande inutilizzato trovato', 'SUCCESS');
    }
    console.log('');
    
    console.log('📂 DIRECTORY VUOTE:');
    const emptyDirs = findEmptyDirectories();
    if (emptyDirs.length > 0) {
        log(`Trovate ${emptyDirs.length} directory vuote`, 'WARN');
        
        emptyDirs.slice(0, 10).forEach(dir => {
            console.log(`   📂 ${dir.relativePath}`);
        });
        
        if (emptyDirs.length > 10) {
            console.log(`   ... e altre ${emptyDirs.length - 10} directory`);
        }
    } else {
        log('Nessuna directory vuota trovata', 'SUCCESS');
    }
    console.log('');
    
    console.log('📄 REPORT VECCHI:');
    const oldReports = findUnusedReports();
    if (oldReports.length > 0) {
        const totalSize = oldReports.reduce((sum, f) => sum + f.size, 0);
        log(`Trovati ${oldReports.length} report vecchi (${formatFileSize(totalSize)})`, 'WARN');
        
        oldReports.slice(0, 5).forEach(file => {
            console.log(`   📄 ${file.relativePath} (${file.daysSinceModified} giorni fa)`);
        });
        
        if (oldReports.length > 5) {
            console.log(`   ... e altri ${oldReports.length - 5} report`);
        }
    } else {
        log('Nessun report vecchio trovato', 'SUCCESS');
    }
    console.log('');
    
    // Statistiche finali
    const totalObsoleteSize = obsoleteFiles.reduce((sum, f) => sum + f.size, 0);
    const totalDuplicateSize = duplicates.reduce((sum, d) => sum + d.size, 0);
    const totalLargeUnusedSize = largeUnused.reduce((sum, f) => sum + f.size, 0);
    const totalOldReportsSize = oldReports.reduce((sum, f) => sum + f.size, 0);
    
    const totalWastedSpace = totalObsoleteSize + totalDuplicateSize + totalLargeUnusedSize + totalOldReportsSize;
    
    console.log('📊 RIEPILOGO CLEANUP:');
    console.log(`   - File obsoleti: ${obsoleteFiles.length} (${formatFileSize(totalObsoleteSize)})`);
    console.log(`   - File duplicati: ${duplicates.length} (${formatFileSize(totalDuplicateSize)})`);
    console.log(`   - File grandi inutilizzati: ${largeUnused.length} (${formatFileSize(totalLargeUnusedSize)})`);
    console.log(`   - Directory vuote: ${emptyDirs.length}`);
    console.log(`   - Report vecchi: ${oldReports.length} (${formatFileSize(totalOldReportsSize)})`);
    console.log(`   - SPAZIO RECUPERABILE: ${formatFileSize(totalWastedSpace)}`);
    
    if (totalWastedSpace > 0) {
        console.log('\n💡 SUGGERIMENTI CLEANUP:');
        
        if (obsoleteFiles.length > 0) {
            console.log('   - Rimuovi file temporanei e backup obsoleti');
        }
        
        if (duplicates.length > 0) {
            console.log('   - Elimina i file duplicati per liberare spazio');
        }
        
        if (largeUnused.length > 0) {
            console.log('   - Verifica se i file grandi sono ancora necessari');
        }
        
        if (emptyDirs.length > 0) {
            console.log('   - Rimuovi le directory vuote');
        }
        
        if (oldReports.length > 0) {
            console.log('   - Archivia o rimuovi i report vecchi');
        }
        
        console.log('\n⚠️  ATTENZIONE: Verifica sempre prima di eliminare file!');
    }
    
    console.log('');
    
    return {
        obsoleteFiles,
        duplicates,
        largeUnused,
        emptyDirs,
        oldReports,
        totalWastedSpace
    };
}

/**
 * Main function
 */
async function main() {
    const analysis = runCleanupAnalysis();
    
    if (analysis.totalWastedSpace > 50 * 1024 * 1024) { // 50MB
        log('Trovato molto spazio recuperabile, considera un cleanup', 'WARN');
    } else {
        log('Progetto relativamente pulito', 'SUCCESS');
    }
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        log(`❌ Errore fatale: ${error.message}`, 'ERROR');
        process.exit(1);
    });
}

export { runCleanupAnalysis };

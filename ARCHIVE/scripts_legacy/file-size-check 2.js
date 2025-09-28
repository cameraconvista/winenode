#!/usr/bin/env node

/**
 * 📏 FILE SIZE CHECK - WINENODE
 * 
 * Funzionalità:
 * - Scansiona file di codice per dimensioni eccessive
 * - Segnala file >500 righe (warning) e >800 righe (critico)
 * - Esclude file di sistema e generati
 * - Report dettagliato con suggerimenti
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Configurazione
const MAX_LINES_WARNING = 500;
const MAX_LINES_CRITICAL = 800;
const EXCLUDED_PATTERNS = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.cache',
    'scripts/backup-system.js',
    'scripts/recovery-system.cjs'
];

/**
 * Logger
 */
function log(message, type = 'INFO') {
    const prefix = type === 'ERROR' ? '❌' : type === 'SUCCESS' ? '✅' : type === 'WARN' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} ${message}`);
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
                    const ext = path.extname(fullPath).toLowerCase();
                    if (['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte'].includes(ext)) {
                        const lines = countLines(fullPath);
                        results.push({
                            path: fullPath,
                            relativePath: path.relative(PROJECT_ROOT, fullPath),
                            lines: lines.code,
                            totalLines: lines.total,
                            ext
                        });
                    }
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
 * Analizza file per dimensioni
 */
function analyzeFileSize() {
    log('🔍 Scansione file di codice...', 'INFO');
    
    const files = scanDirectory(PROJECT_ROOT);
    
    const criticalFiles = files.filter(f => f.lines >= MAX_LINES_CRITICAL);
    const warningFiles = files.filter(f => f.lines >= MAX_LINES_WARNING && f.lines < MAX_LINES_CRITICAL);
    const okFiles = files.filter(f => f.lines < MAX_LINES_WARNING);
    
    console.log('\n📏 ANALISI DIMENSIONE FILE:\n');
    
    // File critici
    if (criticalFiles.length > 0) {
        console.log('🚨 FILE CRITICI (≥800 righe):');
        criticalFiles
            .sort((a, b) => b.lines - a.lines)
            .forEach(file => {
                console.log(`   ❌ ${file.relativePath}: ${file.lines} righe`);
            });
        console.log('');
    }
    
    // File warning
    if (warningFiles.length > 0) {
        console.log('⚠️  FILE LUNGHI (500-799 righe):');
        warningFiles
            .sort((a, b) => b.lines - a.lines)
            .forEach(file => {
                console.log(`   ⚠️  ${file.relativePath}: ${file.lines} righe`);
            });
        console.log('');
    }
    
    // Statistiche
    console.log('📊 STATISTICHE:');
    console.log(`   - File totali analizzati: ${files.length}`);
    console.log(`   - File OK (<500 righe): ${okFiles.length}`);
    console.log(`   - File lunghi (500-799): ${warningFiles.length}`);
    console.log(`   - File critici (≥800): ${criticalFiles.length}`);
    
    const avgLines = files.length > 0 ? Math.round(files.reduce((sum, f) => sum + f.lines, 0) / files.length) : 0;
    console.log(`   - Media righe per file: ${avgLines}`);
    
    // Suggerimenti
    if (criticalFiles.length > 0 || warningFiles.length > 0) {
        console.log('\n💡 SUGGERIMENTI PER REFACTORING:');
        console.log('   - Estrai componenti in file separati');
        console.log('   - Sposta logica business in hook personalizzati');
        console.log('   - Crea utility functions separate');
        console.log('   - Dividi file grandi in moduli più piccoli');
        console.log('   - Usa il pattern di composizione invece di ereditarietà');
    }
    
    console.log('');
    
    return {
        total: files.length,
        critical: criticalFiles.length,
        warning: warningFiles.length,
        ok: okFiles.length,
        files: files
    };
}

/**
 * Main function
 */
async function main() {
    const analysis = analyzeFileSize();
    
    if (analysis.critical > 0) {
        log(`Trovati ${analysis.critical} file critici che richiedono refactoring`, 'ERROR');
        process.exit(1);
    } else if (analysis.warning > 0) {
        log(`Trovati ${analysis.warning} file lunghi da considerare per refactoring`, 'WARN');
    } else {
        log('Tutti i file rispettano le linee guida di dimensione', 'SUCCESS');
    }
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        log(`❌ Errore fatale: ${error.message}`, 'ERROR');
        process.exit(1);
    });
}

export { analyzeFileSize };

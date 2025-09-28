#!/usr/bin/env node

/**
 * 📦 BUNDLE SIZE GUARD WINENODE
 * 
 * Funzionalità:
 * - Verifica dimensioni bundle JS post-build
 * - Confronta con baseline + tolleranza configurabile
 * - Blocca CI se bundle supera soglia (exit 1)
 * - Logging dettagliato per debug regressioni
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const BASELINE_FILE = path.join(PROJECT_ROOT, 'DOCS', 'BUNDLE_BASELINE.json');

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
 * Formatta dimensioni in formato human-readable
 */
function formatSize(bytes) {
    const kb = bytes / 1024;
    if (kb < 1024) {
        return `${kb.toFixed(1)} KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
}

/**
 * Calcola dimensione totale di tutti i file JS in dist/
 */
async function calculateBundleSize() {
    try {
        const files = await fs.readdir(DIST_DIR, { recursive: true });
        let totalSize = 0;
        const jsFiles = [];
        
        for (const file of files) {
            if (file.endsWith('.js')) {
                const filePath = path.join(DIST_DIR, file);
                const stats = await fs.stat(filePath);
                totalSize += stats.size;
                jsFiles.push({
                    name: file,
                    size: stats.size
                });
            }
        }
        
        return { totalSize, jsFiles };
        
    } catch (error) {
        log(`Errore calcolo dimensioni bundle: ${error.message}`, 'ERROR');
        throw error;
    }
}

/**
 * Carica baseline e calcola soglia
 */
async function loadBaseline() {
    try {
        const baselineContent = await fs.readFile(BASELINE_FILE, 'utf8');
        const baseline = JSON.parse(baselineContent);
        
        const threshold = baseline.total_kb * (1 + baseline.tolerance_pct / 100);
        
        return {
            baseline: baseline.total_kb,
            tolerance: baseline.tolerance_pct,
            threshold
        };
        
    } catch (error) {
        log(`Errore caricamento baseline: ${error.message}`, 'ERROR');
        throw error;
    }
}

/**
 * Verifica bundle size contro baseline
 */
async function checkBundleSize() {
    try {
        log('📦 Verifica dimensioni bundle JavaScript...');
        
        // Calcola dimensioni attuali
        const { totalSize, jsFiles } = await calculateBundleSize();
        
        // Carica baseline e soglia
        const { baseline, tolerance, threshold } = await loadBaseline();
        
        // Log dettagli
        log(`📊 File JS trovati: ${jsFiles.length}`);
        log(`📏 Dimensione attuale: ${formatSize(totalSize)} (${totalSize} bytes)`);
        log(`🎯 Baseline: ${formatSize(baseline)} (${baseline} bytes)`);
        log(`📈 Tolleranza: ${tolerance}%`);
        log(`🚨 Soglia massima: ${formatSize(threshold)} (${Math.round(threshold)} bytes)`);
        
        // Verifica soglia
        if (totalSize > threshold) {
            const excess = totalSize - threshold;
            const excessPct = ((totalSize - baseline) / baseline * 100).toFixed(1);
            
            log('', 'ERROR');
            log('🚫 BUNDLE SIZE GUARD FALLITO', 'ERROR');
            log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'ERROR');
            log(`❌ Bundle supera la soglia di ${formatSize(threshold)}`, 'ERROR');
            log(`📊 Dimensione attuale: ${formatSize(totalSize)} (+${excessPct}%)`, 'ERROR');
            log(`⚠️ Eccesso: ${formatSize(excess)}`, 'ERROR');
            log('', 'ERROR');
            log('💡 POSSIBILI SOLUZIONI:', 'ERROR');
            log('1. Rimuovi dipendenze non necessarie', 'ERROR');
            log('2. Ottimizza import (tree shaking)', 'ERROR');
            log('3. Lazy load componenti pesanti', 'ERROR');
            log('4. Aggiorna baseline se incremento giustificato', 'ERROR');
            log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'ERROR');
            
            process.exit(1);
        }
        
        // Successo
        const savings = threshold - totalSize;
        const savingsPct = ((baseline - totalSize) / baseline * 100).toFixed(1);
        
        log(`✅ Bundle size OK: ${formatSize(totalSize)}`, 'SUCCESS');
        log(`💾 Margine disponibile: ${formatSize(savings)}`);
        
        if (totalSize < baseline) {
            log(`🎉 Bundle ridotto del ${Math.abs(savingsPct)}% rispetto alla baseline!`, 'SUCCESS');
        }
        
        return true;
        
    } catch (error) {
        log(`❌ Errore verifica bundle size: ${error.message}`, 'ERROR');
        process.exit(1);
    }
}

/**
 * Main function
 */
async function main() {
    try {
        await checkBundleSize();
    } catch (error) {
        log(`❌ Errore fatale: ${error.message}`, 'ERROR');
        process.exit(1);
    }
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { checkBundleSize };

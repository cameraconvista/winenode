#!/usr/bin/env node

/**
 * 🚀 COMMIT DIRETTO V2 - WINENODE
 * 
 * Commit diretto su main con fast-forward only
 * Uso: node scripts/commit-direct-v2.js "messaggio commit"
 */

/* eslint-env node */
 

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

function log(message, type = 'INFO') {
    const timestamp = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
    const prefix = type === 'ERROR' ? '❌' : type === 'SUCCESS' ? '✅' : type === 'WARN' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

async function commitDirectV2() {
    try {
        log('🔄 Avvio commit diretto v2...');
        
        // Verifica branch corrente
        const currentBranch = execSync('git branch --show-current', { cwd: PROJECT_ROOT, encoding: 'utf8' }).trim();
        log(`Branch corrente: ${currentBranch}`);
        
        // Se non siamo su main, spostiamo tutto su main
        if (currentBranch !== 'main') {
            log('🔄 Spostamento su main...');
            
            // Stage dei file correnti
            execSync('git add .', { cwd: PROJECT_ROOT });
            
            // Verifica se ci sono modifiche
            try {
                execSync('git diff --cached --exit-code', { cwd: PROJECT_ROOT });
                log('Nessuna modifica da spostare');
            } catch (error) {
                // Ci sono modifiche, le spostiamo su main
                const commitMessage = process.argv[2] || `temp-commit: ${new Date().toISOString()}`;
                execSync(`git commit -m "${commitMessage}"`, { cwd: PROJECT_ROOT });
            }
            
            // Passa a main
            execSync('git checkout main', { cwd: PROJECT_ROOT });
            
            // Merge fast-forward only se ci sono commit da integrare
            try {
                execSync(`git merge --ff-only ${currentBranch}`, { cwd: PROJECT_ROOT });
                log(`✅ Merge fast-forward da ${currentBranch} completato`);
            } catch (error) {
                log(`❌ Impossibile merge fast-forward da ${currentBranch}`, 'ERROR');
                throw new Error('Merge non fast-forward non consentito. Risolvi conflitti manualmente.');
            }
        } else {
            // Siamo già su main, procediamo normalmente
            log('📝 Staging files...');
            execSync('git add .', { cwd: PROJECT_ROOT });
            
            // Verifica se ci sono modifiche da committare
            try {
                execSync('git diff --cached --exit-code', { cwd: PROJECT_ROOT });
                log('Nessuna modifica da committare');
                return;
            } catch (error) {
                // Ci sono modifiche da committare
                const commitMessage = process.argv[2] || `auto-commit: ${new Date().toISOString()}`;
                log(`💾 Commit: ${commitMessage}`);
                execSync(`git commit -m "${commitMessage}"`, { cwd: PROJECT_ROOT });
            }
        }
        
        // Fetch remoto
        log('📡 Fetch remoto...');
        execSync('git fetch origin', { cwd: PROJECT_ROOT });
        
        // Pull fast-forward only
        log('⬇️ Pull fast-forward only...');
        try {
            execSync('git pull --ff-only origin main', { cwd: PROJECT_ROOT });
        } catch (error) {
            log('❌ Pull fast-forward fallito - conflitti da risolvere', 'ERROR');
            throw new Error('Pull non fast-forward. Risolvi conflitti manualmente.');
        }
        
        // Push su origin/main
        log('🚀 Push su origin/main...');
        execSync('git push origin main', { cwd: PROJECT_ROOT });
        
        // Pulizia branch temporaneo se necessario
        if (currentBranch !== 'main') {
            log(`🧹 Eliminazione branch temporaneo ${currentBranch}...`);
            try {
                execSync(`git branch -d ${currentBranch}`, { cwd: PROJECT_ROOT });
                execSync(`git push origin --delete ${currentBranch}`, { cwd: PROJECT_ROOT });
                log(`✅ Branch ${currentBranch} eliminato`);
            } catch (error) {
                log(`⚠️ Impossibile eliminare branch ${currentBranch}`, 'WARN');
            }
        }
        
        // Hash commit finale
        const commitHash = execSync('git rev-parse HEAD', { cwd: PROJECT_ROOT, encoding: 'utf8' }).trim().substring(0, 7);
        log(`✅ Commit diretto su main completato: ${commitHash}`, 'SUCCESS');
        
    } catch (error) {
        log(`Errore commit`, 'ERROR');
        console.error(error.message);
        process.exit(1);
    }
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    commitDirectV2().catch(error => {
        log(`❌ Errore fatale: ${error.message}`, 'ERROR');
        process.exit(1);
    });
}

export { commitDirectV2 };

#!/usr/bin/env node

/**
 * 🚀 COMMIT DIRETTO - WINENODE
 * 
 * Wrapper per commit diretto senza conferme
 * Uso: node scripts/commit-direct.js "messaggio commit"
 */

/* eslint-env node */
/* eslint-disable no-console */

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

function runCommand(command, options = {}) {
    try {
        const result = execSync(command, {
            cwd: PROJECT_ROOT,
            encoding: 'utf8',
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options
        });
        return { success: true, output: result };
    } catch (error) {
        return { 
            success: false, 
            error: error.message, 
            output: error.stdout || error.stderr,
            code: error.status
        };
    }
}

async function commitDirect() {
    const commitMessage = process.argv[2] || `chore: auto-commit ${new Date().toLocaleString('it-IT')}`;
    
    log('🔄 Avvio commit diretto...', 'INFO');
    
    // 1. Verifica branch corrente
    const branchResult = runCommand('git branch --show-current', { silent: true });
    if (!branchResult.success) {
        log('Errore verifica branch', 'ERROR');
        return false;
    }
    
    const currentBranch = branchResult.output.trim();
    log(`Branch corrente: ${currentBranch}`, 'INFO');
    
    // 2. Stage tutti i file
    log('📝 Staging files...', 'INFO');
    const addResult = runCommand('git add .');
    if (!addResult.success) {
        log('Errore staging files', 'ERROR');
        return false;
    }
    
    // 3. Verifica se ci sono cambiamenti
    const statusResult = runCommand('git status --porcelain', { silent: true });
    if (statusResult.success && statusResult.output.trim() === '') {
        log('Nessuna modifica da committare', 'INFO');
        return true;
    }
    
    // 4. Commit
    log(`📝 Commit: ${commitMessage}`, 'INFO');
    const commitResult = runCommand(`git commit -m "${commitMessage}"`);
    if (!commitResult.success) {
        log('Errore commit', 'ERROR');
        return false;
    }
    
    // 5. Push
    log('🚀 Push su GitHub...', 'INFO');
    const pushResult = runCommand(`git push origin ${currentBranch}`);
    if (!pushResult.success) {
        log('Errore push', 'ERROR');
        return false;
    }
    
    // 6. Ottieni hash commit
    const hashResult = runCommand('git rev-parse HEAD', { silent: true });
    if (hashResult.success) {
        const commitHash = hashResult.output.trim().substring(0, 7);
        log(`✅ Commit completato: ${commitHash}`, 'SUCCESS');
        console.log(`🔗 Branch: ${currentBranch}`);
    }
    
    return true;
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    commitDirect().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        log(`❌ Errore fatale: ${error.message}`, 'ERROR');
        process.exit(1);
    });
}

export { commitDirect };

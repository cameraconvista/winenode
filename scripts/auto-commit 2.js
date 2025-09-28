#!/usr/bin/env node

/**
 * 🔄 AUTO COMMIT GITHUB - WINENODE
 * 
 * Funzionalità:
 * - Commit e push automatico su GitHub
 * - Gestione credenziali sicura
 * - Risoluzione conflitti automatica
 * - Log dettagliato delle operazioni
 * - Trigger: "esegui commit" in chat
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const COMMIT_LOG_PATH = path.join(PROJECT_ROOT, 'DOCS', 'COMMIT_LOG.md');

/**
 * Logger
 */
function log(message, type = 'INFO') {
    const timestamp = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
    const prefix = type === 'ERROR' ? '❌' : type === 'SUCCESS' ? '✅' : type === 'WARN' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    // Log anche su file
    logToFile(message, type, timestamp);
}

/**
 * Log su file
 */
function logToFile(message, type, timestamp) {
    try {
        const logEntry = `${timestamp} [${type}] ${message}\n`;
        
        // Crea directory DOCS se non esiste
        const docsDir = path.dirname(COMMIT_LOG_PATH);
        if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
        }
        
        // Append al log
        fs.appendFileSync(COMMIT_LOG_PATH, logEntry);
    } catch (error) {
        // Ignora errori di logging
    }
}

/**
 * Esegue comando Git con gestione errori
 */
function runGitCommand(command, options = {}) {
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

/**
 * Legge credenziali Git da .env
 */
function getGitCredentials() {
    const envPath = path.join(PROJECT_ROOT, '.env');
    
    if (!fs.existsSync(envPath)) {
        return null;
    }
    
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        const urlMatch = envContent.match(/^GIT_REMOTE_URL=(.+)$/m);
        const tokenMatch = envContent.match(/^GITHUB_TOKEN=(.+)$/m);
        
        if (!urlMatch || !tokenMatch) {
            return null;
        }
        
        const remoteUrl = urlMatch[1].trim();
        const token = tokenMatch[1].trim();
        
        // Verifica che non siano placeholder
        if (remoteUrl.includes('your_') || token.includes('your_') || remoteUrl === '' || token === '') {
            return null;
        }
        
        return { remoteUrl, token };
    } catch (error) {
        return null;
    }
}

/**
 * Configura credenziali Git per la sessione
 */
function setupGitCredentials(credentials) {
    try {
        // Configura URL con token
        const urlWithToken = credentials.remoteUrl.replace(
            'https://github.com/',
            `https://${credentials.token}@github.com/`
        );
        
        // Configura remote origin
        runGitCommand(`git remote set-url origin "${urlWithToken}"`, { silent: true });
        
        return true;
    } catch (error) {
        log(`Errore configurazione credenziali: ${error.message}`, 'ERROR');
        return false;
    }
}

/**
 * Inizializza repository Git se necessario
 */
function initializeGitRepo() {
    const gitDir = path.join(PROJECT_ROOT, '.git');
    
    if (!fs.existsSync(gitDir)) {
        log('📁 Inizializzazione repository Git...', 'INFO');
        
        const initResult = runGitCommand('git init');
        if (!initResult.success) {
            log('Errore inizializzazione Git', 'ERROR');
            return false;
        }
        
        // Configura branch principale
        runGitCommand('git branch -M main', { silent: true });
        
        log('Repository Git inizializzato', 'SUCCESS');
    }
    
    return true;
}

/**
 * Verifica stato working tree
 */
function checkWorkingTreeStatus() {
    const statusResult = runGitCommand('git status --porcelain', { silent: true });
    
    if (!statusResult.success) {
        return { hasChanges: false, files: [] };
    }
    
    const output = statusResult.output.trim();
    const hasChanges = output.length > 0;
    const files = hasChanges ? output.split('\n').map(line => line.trim()) : [];
    
    return { hasChanges, files };
}

/**
 * Crea commit con messaggio automatico
 */
function createCommit() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('it-IT');
    const timeStr = now.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const commitMessage = `chore(auto-commit): save @ ${dateStr} ${timeStr}`;
    
    log('📝 Creazione commit...', 'INFO');
    
    // Add tutti i file
    const addResult = runGitCommand('git add -A');
    if (!addResult.success) {
        log('Errore aggiunta file al commit', 'ERROR');
        return false;
    }
    
    // Commit
    const commitResult = runGitCommand(`git commit -m "${commitMessage}"`);
    if (!commitResult.success) {
        if (commitResult.output && commitResult.output.includes('nothing to commit')) {
            log('Nessuna modifica da committare', 'INFO');
            return true;
        }
        log('Errore creazione commit', 'ERROR');
        return false;
    }
    
    log(`Commit creato: ${commitMessage}`, 'SUCCESS');
    return true;
}

/**
 * Gestisce conflitti di merge
 */
function handleMergeConflicts() {
    log('🔄 Risoluzione conflitti automatica...', 'INFO');
    
    // Prova rebase automatico
    const rebaseResult = runGitCommand('git pull --rebase origin main', { silent: true });
    
    if (rebaseResult.success) {
        log('Rebase completato con successo', 'SUCCESS');
        return true;
    }
    
    // Se il rebase fallisce, prova merge
    const mergeResult = runGitCommand('git pull origin main', { silent: true });
    
    if (mergeResult.success) {
        log('Merge completato con successo', 'SUCCESS');
        return true;
    }
    
    // Salva report conflitti
    const conflictReport = `# REPORT CONFLITTI COMMIT - ${new Date().toLocaleString('it-IT')}

## Errore Rebase
\`\`\`
${rebaseResult.output || rebaseResult.error}
\`\`\`

## Errore Merge
\`\`\`
${mergeResult.output || mergeResult.error}
\`\`\`

## Risoluzione Manuale Richiesta
1. Risolvi i conflitti manualmente
2. Esegui \`git add .\`
3. Esegui \`git commit\`
4. Esegui \`git push origin main\`

`;
    
    const reportPath = path.join(PROJECT_ROOT, 'REPORT_COMMIT_CONFLICTS.txt');
    fs.writeFileSync(reportPath, conflictReport);
    
    log('Conflitti non risolvibili automaticamente', 'ERROR');
    log(`Report salvato: ${path.basename(reportPath)}`, 'INFO');
    
    return false;
}

/**
 * Push su GitHub
 */
function pushToGitHub() {
    log('🚀 Push su GitHub...', 'INFO');
    
    const pushResult = runGitCommand('git push origin main');
    
    if (pushResult.success) {
        log('Push completato con successo', 'SUCCESS');
        return true;
    }
    
    // Se push fallisce, potrebbe essere necessario pull
    if (pushResult.output && pushResult.output.includes('non-fast-forward')) {
        log('Push rifiutato, sincronizzazione necessaria...', 'WARN');
        
        if (handleMergeConflicts()) {
            // Riprova push dopo merge
            const retryResult = runGitCommand('git push origin main');
            if (retryResult.success) {
                log('Push completato dopo sincronizzazione', 'SUCCESS');
                return true;
            }
        }
    }
    
    log('Errore push su GitHub', 'ERROR');
    return false;
}

/**
 * Ottiene URL commit GitHub
 */
function getCommitUrl(credentials) {
    try {
        const hashResult = runGitCommand('git rev-parse HEAD', { silent: true });
        if (!hashResult.success) {
            return null;
        }
        
        const commitHash = hashResult.output.trim();
        const repoUrl = credentials.remoteUrl.replace('.git', '');
        
        return `${repoUrl}/commit/${commitHash}`;
    } catch (error) {
        return null;
    }
}

/**
 * Aggiorna log commit
 */
function updateCommitLog(success, commitUrl = null) {
    try {
        const timestamp = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
        const status = success ? '✅ Successo' : '❌ Fallito';
        
        let logEntry = `\n## ${timestamp}\n`;
        logEntry += `**Stato**: ${status}\n`;
        
        if (commitUrl) {
            logEntry += `**Commit**: [${commitUrl.split('/').pop()}](${commitUrl})\n`;
        }
        
        logEntry += `**Comando**: Auto-commit da script\n`;
        
        // Crea file log se non esiste
        if (!fs.existsSync(COMMIT_LOG_PATH)) {
            const header = `# 📝 Commit Log - WineNode

Log automatico dei commit effettuati dal sistema.

`;
            fs.writeFileSync(COMMIT_LOG_PATH, header);
        }
        
        fs.appendFileSync(COMMIT_LOG_PATH, logEntry);
        
    } catch (error) {
        // Ignora errori di logging
    }
}

/**
 * Richiede credenziali se mancanti
 */
function requestCredentials() {
    log('🔐 Credenziali Git non configurate', 'WARN');
    
    console.log('\n📝 CONFIGURAZIONE RICHIESTA:');
    console.log('Aggiungi le seguenti variabili al file .env:');
    console.log('');
    console.log('GIT_REMOTE_URL=https://github.com/username/repository.git');
    console.log('GITHUB_TOKEN=ghp_your_personal_access_token');
    console.log('');
    console.log('💡 Come ottenere il token GitHub:');
    console.log('1. Vai su GitHub.com > Settings > Developer settings');
    console.log('2. Personal access tokens > Tokens (classic)');
    console.log('3. Generate new token con scope: repo, workflow');
    console.log('4. Copia il token nel file .env');
    console.log('');
    
    return false;
}

/**
 * Main auto commit function
 */
async function runAutoCommit() {
    log('🔄 Avvio commit automatico...', 'INFO');
    
    // 1. Verifica credenziali
    const credentials = getGitCredentials();
    if (!credentials) {
        return requestCredentials();
    }
    
    // 2. Inizializza Git se necessario
    if (!initializeGitRepo()) {
        return false;
    }
    
    // 3. Configura credenziali
    if (!setupGitCredentials(credentials)) {
        return false;
    }
    
    // 4. Verifica stato working tree
    const status = checkWorkingTreeStatus();
    if (!status.hasChanges) {
        log('📋 Nessuna modifica da committare', 'INFO');
        return true;
    }
    
    log(`📊 File modificati: ${status.files.length}`, 'INFO');
    
    // 5. Crea commit
    if (!createCommit()) {
        return false;
    }
    
    // 6. Push su GitHub
    const pushSuccess = pushToGitHub();
    
    // 7. Ottieni URL commit
    const commitUrl = pushSuccess ? getCommitUrl(credentials) : null;
    
    // 8. Aggiorna log
    updateCommitLog(pushSuccess, commitUrl);
    
    // 9. Report finale
    if (pushSuccess) {
        log('🎉 Commit automatico completato con successo!', 'SUCCESS');
        
        if (commitUrl) {
            console.log(`\n🔗 Commit URL: ${commitUrl}`);
        }
        
        console.log(`📝 Log aggiornato: ${path.relative(PROJECT_ROOT, COMMIT_LOG_PATH)}`);
    } else {
        log('❌ Commit automatico fallito', 'ERROR');
    }
    
    return pushSuccess;
}

/**
 * Main function
 */
async function main() {
    const success = await runAutoCommit();
    process.exit(success ? 0 : 1);
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        log(`❌ Errore fatale: ${error.message}`, 'ERROR');
        process.exit(1);
    });
}

export { runAutoCommit, getGitCredentials };

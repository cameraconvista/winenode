#!/usr/bin/env node

/**
 * 🚀 SETUP SVILUPPO LOCALE - WINENODE
 * 
 * Funzionalità:
 * - Setup completo ambiente sviluppo
 * - Verifica dipendenze e configurazioni
 * - Genera .env.example se mancante
 * - Configura Git hooks
 * - Verifica connessioni database
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Logger
 */
function log(message, type = 'INFO') {
    const timestamp = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
    const prefix = type === 'ERROR' ? '❌' : type === 'SUCCESS' ? '✅' : type === 'WARN' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

/**
 * Esegue comando con gestione errori
 */
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
        return { success: false, error: error.message, output: error.stdout };
    }
}

/**
 * Verifica Node.js e npm
 */
function checkNodeAndNpm() {
    log('🔍 Verifica Node.js e npm...', 'INFO');
    
    const nodeResult = runCommand('node --version', { silent: true });
    const npmResult = runCommand('npm --version', { silent: true });
    
    if (!nodeResult.success) {
        log('Node.js non trovato! Installa Node.js da https://nodejs.org/', 'ERROR');
        return false;
    }
    
    if (!npmResult.success) {
        log('npm non trovato! Reinstalla Node.js', 'ERROR');
        return false;
    }
    
    const nodeVersion = nodeResult.output.trim();
    const npmVersion = npmResult.output.trim();
    
    log(`Node.js: ${nodeVersion}`, 'SUCCESS');
    log(`npm: ${npmVersion}`, 'SUCCESS');
    
    // Verifica versione Node.js minima (16+)
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    if (majorVersion < 16) {
        log('Versione Node.js troppo vecchia! Richiesta versione 16+', 'WARN');
    }
    
    return true;
}

/**
 * Installa dipendenze npm
 */
function installDependencies() {
    log('📦 Installazione dipendenze...', 'INFO');
    
    if (!fs.existsSync(path.join(PROJECT_ROOT, 'package.json'))) {
        log('package.json non trovato!', 'ERROR');
        return false;
    }
    
    const result = runCommand('npm ci --silent');
    
    if (!result.success) {
        log('Errore installazione dipendenze', 'ERROR');
        log('Provo con npm install...', 'INFO');
        
        const fallbackResult = runCommand('npm install');
        if (!fallbackResult.success) {
            log('Installazione dipendenze fallita', 'ERROR');
            return false;
        }
    }
    
    log('Dipendenze installate con successo', 'SUCCESS');
    return true;
}

/**
 * Genera .env.example se mancante
 */
function generateEnvExample() {
    const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
    
    if (fs.existsSync(envExamplePath)) {
        log('.env.example già esistente', 'SUCCESS');
        return true;
    }
    
    log('📝 Generazione .env.example...', 'INFO');
    
    const envExampleContent = `# 🔐 CONFIGURAZIONE AMBIENTE WINENODE
# Copia questo file in .env e configura i valori reali

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database (opzionale, per script server-side)
DATABASE_URL=your_database_connection_string

# Google Sheets Integration (opzionale)
VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
VITE_GOOGLE_PRIVATE_KEY=your_private_key
VITE_GOOGLE_SHEET_ID=your_sheet_id

# Development
VITE_LOG_LEVEL=info
VITE_ENABLE_DEBUGGING=false

# GitHub (per commit automatico)
GIT_REMOTE_URL=your_github_repo_url
GITHUB_TOKEN=your_github_token
`;
    
    try {
        fs.writeFileSync(envExamplePath, envExampleContent);
        log('.env.example generato con successo', 'SUCCESS');
        return true;
    } catch (error) {
        log(`Errore generazione .env.example: ${error.message}`, 'ERROR');
        return false;
    }
}

/**
 * Verifica e configura .env
 */
function setupEnvFile() {
    const envPath = path.join(PROJECT_ROOT, '.env');
    const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
    
    if (!fs.existsSync(envPath)) {
        if (fs.existsSync(envExamplePath)) {
            log('📋 Copia .env.example in .env per iniziare', 'WARN');
            
            try {
                const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
                fs.writeFileSync(envPath, envExampleContent);
                log('.env creato da .env.example', 'SUCCESS');
            } catch (error) {
                log(`Errore copia .env: ${error.message}`, 'ERROR');
                return false;
            }
        } else {
            log('.env non trovato e .env.example mancante', 'ERROR');
            return false;
        }
    }
    
    // Verifica variabili critiche
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const missingVars = [];
        
        const criticalVars = [
            'VITE_SUPABASE_URL',
            'VITE_SUPABASE_ANON_KEY'
        ];
        
        criticalVars.forEach(varName => {
            const regex = new RegExp(`^${varName}=(.+)$`, 'm');
            const match = envContent.match(regex);
            
            if (!match || match[1].trim() === '' || match[1].includes('your_')) {
                missingVars.push(varName);
            }
        });
        
        if (missingVars.length > 0) {
            log(`⚠️ Variabili da configurare in .env: ${missingVars.join(', ')}`, 'WARN');
            log('L\'app potrebbe non funzionare correttamente senza queste configurazioni', 'WARN');
        } else {
            log('File .env configurato correttamente', 'SUCCESS');
        }
        
        return true;
    } catch (error) {
        log(`Errore verifica .env: ${error.message}`, 'ERROR');
        return false;
    }
}

/**
 * Configura Git hooks con Husky
 */
function setupGitHooks() {
    log('🔗 Configurazione Git hooks...', 'INFO');
    
    // Verifica se è un repository Git
    if (!fs.existsSync(path.join(PROJECT_ROOT, '.git'))) {
        log('Repository Git non trovato, inizializzo...', 'INFO');
        const gitInitResult = runCommand('git init');
        if (!gitInitResult.success) {
            log('Errore inizializzazione Git', 'ERROR');
            return false;
        }
    }
    
    // Installa Husky
    const huskyResult = runCommand('npm run prepare', { silent: true });
    if (!huskyResult.success) {
        log('Errore configurazione Husky', 'WARN');
        return false;
    }
    
    // Crea hook pre-commit
    const hookDir = path.join(PROJECT_ROOT, '.husky');
    if (!fs.existsSync(hookDir)) {
        fs.mkdirSync(hookDir, { recursive: true });
    }
    
    const preCommitHookPath = path.join(hookDir, 'pre-commit');
    const preCommitContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run pre-commit
`;
    
    try {
        fs.writeFileSync(preCommitHookPath, preCommitContent);
        fs.chmodSync(preCommitHookPath, '755');
        log('Git hooks configurati con successo', 'SUCCESS');
        return true;
    } catch (error) {
        log(`Errore configurazione hooks: ${error.message}`, 'ERROR');
        return false;
    }
}

/**
 * Verifica configurazioni TypeScript e build
 */
function checkBuildConfiguration() {
    log('🔧 Verifica configurazioni build...', 'INFO');
    
    const configs = [
        { file: 'tsconfig.json', name: 'TypeScript' },
        { file: 'vite.config.ts', name: 'Vite', alt: 'vite.config.js' },
        { file: 'tailwind.config.js', name: 'Tailwind CSS' },
        { file: 'eslint.config.js', name: 'ESLint', alt: '.eslintrc.js' }
    ];
    
    let allConfigsOk = true;
    
    configs.forEach(config => {
        const configPath = path.join(PROJECT_ROOT, config.file);
        const altPath = config.alt ? path.join(PROJECT_ROOT, config.alt) : null;
        
        if (fs.existsSync(configPath) || (altPath && fs.existsSync(altPath))) {
            log(`${config.name}: ✅`, 'SUCCESS');
        } else {
            log(`${config.name}: ❌ (mancante)`, 'WARN');
            allConfigsOk = false;
        }
    });
    
    return allConfigsOk;
}

/**
 * Test build del progetto
 */
function testBuild() {
    log('🏗️ Test build del progetto...', 'INFO');
    
    const buildResult = runCommand('npm run build', { silent: true });
    
    if (buildResult.success) {
        log('Build completata con successo', 'SUCCESS');
        
        // Verifica dimensione build
        const distPath = path.join(PROJECT_ROOT, 'dist');
        if (fs.existsSync(distPath)) {
            try {
                const stats = fs.statSync(distPath);
                log(`Directory dist creata`, 'SUCCESS');
            } catch (error) {
                // Ignora errori stats
            }
        }
        
        return true;
    } else {
        log('Build fallita', 'ERROR');
        if (buildResult.output) {
            console.log(buildResult.output);
        }
        return false;
    }
}

/**
 * Verifica connessione Supabase (se configurata)
 */
function testSupabaseConnection() {
    log('🔌 Test connessione Supabase...', 'INFO');
    
    const envPath = path.join(PROJECT_ROOT, '.env');
    if (!fs.existsSync(envPath)) {
        log('File .env non trovato, skip test Supabase', 'WARN');
        return true;
    }
    
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const urlMatch = envContent.match(/^VITE_SUPABASE_URL=(.+)$/m);
        const keyMatch = envContent.match(/^VITE_SUPABASE_ANON_KEY=(.+)$/m);
        
        if (!urlMatch || !keyMatch || urlMatch[1].includes('your_') || keyMatch[1].includes('your_')) {
            log('Configurazione Supabase non completata', 'WARN');
            return true;
        }
        
        // Test connessione semplice (ping)
        const testScript = `
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = '${urlMatch[1]}';
const supabaseKey = '${keyMatch[1]}';

const supabase = createClient(supabaseUrl, supabaseKey);

supabase.from('fornitori').select('count', { count: 'exact', head: true })
  .then(({ error }) => {
    if (error) {
      console.log('❌ Errore connessione Supabase:', error.message);
      process.exit(1);
    } else {
      console.log('✅ Connessione Supabase OK');
      process.exit(0);
    }
  })
  .catch(err => {
    console.log('❌ Errore test Supabase:', err.message);
    process.exit(1);
  });
`;
        
        const testPath = path.join(PROJECT_ROOT, '.test-supabase.mjs');
        fs.writeFileSync(testPath, testScript);
        
        const testResult = runCommand(`node ${testPath}`, { silent: true });
        fs.unlinkSync(testPath);
        
        if (testResult.success) {
            log('Connessione Supabase funzionante', 'SUCCESS');
        } else {
            log('Problemi connessione Supabase', 'WARN');
        }
        
        return true;
    } catch (error) {
        log(`Errore test Supabase: ${error.message}`, 'WARN');
        return true;
    }
}

/**
 * Setup completo
 */
async function runCompleteSetup() {
    console.log('🚀 SETUP SVILUPPO LOCALE WINENODE\n');
    
    let success = true;
    
    // 1. Verifica Node.js e npm
    if (!checkNodeAndNpm()) {
        success = false;
    }
    
    // 2. Genera .env.example se mancante
    if (!generateEnvExample()) {
        success = false;
    }
    
    // 3. Setup .env
    if (!setupEnvFile()) {
        success = false;
    }
    
    // 4. Installa dipendenze
    if (!installDependencies()) {
        success = false;
    }
    
    // 5. Setup Git hooks
    if (!setupGitHooks()) {
        success = false;
    }
    
    // 6. Verifica configurazioni
    if (!checkBuildConfiguration()) {
        log('Alcune configurazioni mancanti, ma non bloccanti', 'WARN');
    }
    
    // 7. Test build
    if (!testBuild()) {
        log('Build fallita, verifica configurazioni', 'WARN');
    }
    
    // 8. Test Supabase (opzionale)
    testSupabaseConnection();
    
    console.log('\n📊 RIEPILOGO SETUP:');
    
    if (success) {
        log('Setup completato con successo!', 'SUCCESS');
        console.log('\n🎉 AMBIENTE PRONTO PER LO SVILUPPO!');
        console.log('\nComandi disponibili:');
        console.log('  npm run dev          - Avvia server sviluppo');
        console.log('  npm run build        - Build produzione');
        console.log('  npm run lint         - Controllo codice');
        console.log('  npm run backup       - Backup progetto');
        console.log('  npm run diagnose     - Diagnosi progetto');
        console.log('  npm run project-info - Info progetto');
        console.log('');
    } else {
        log('Setup completato con alcuni problemi', 'WARN');
        console.log('\n⚠️ RISOLVI I PROBLEMI SOPRA PER UN FUNZIONAMENTO OTTIMALE');
        console.log('');
    }
    
    return success;
}

/**
 * Main function
 */
async function main() {
    const success = await runCompleteSetup();
    process.exit(success ? 0 : 1);
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        log(`❌ Errore fatale: ${error.message}`, 'ERROR');
        process.exit(1);
    });
}

export { runCompleteSetup };

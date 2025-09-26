#!/usr/bin/env node

/**
 * ⚙️ CONFIG CHECK - WINENODE
 * 
 * Funzionalità:
 * - Verifica configurazioni e variabili d'ambiente
 * - Controlla .env vs .env.example
 * - Segnala configurazioni mancanti o obsolete
 * - Report dettagliato con suggerimenti
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Logger
 */
function log(message, type = 'INFO') {
    const prefix = type === 'ERROR' ? '❌' : type === 'SUCCESS' ? '✅' : type === 'WARN' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} ${message}`);
}

/**
 * Legge file .env e estrae variabili
 */
function parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return {};
    }
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const variables = {};
        
        content.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key) {
                    variables[key.trim()] = valueParts.join('=').trim();
                }
            }
        });
        
        return variables;
    } catch (error) {
        log(`Errore lettura ${filePath}: ${error.message}`, 'ERROR');
        return {};
    }
}

/**
 * Verifica configurazioni package.json
 */
function checkPackageJson() {
    const packagePath = path.join(PROJECT_ROOT, 'package.json');
    
    if (!fs.existsSync(packagePath)) {
        log('package.json non trovato', 'ERROR');
        return false;
    }
    
    try {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const issues = [];
        
        // Verifica script essenziali
        const requiredScripts = ['dev', 'build', 'lint', 'typecheck'];
        requiredScripts.forEach(script => {
            if (!pkg.scripts || !pkg.scripts[script]) {
                issues.push(`Script mancante: ${script}`);
            }
        });
        
        // Verifica dipendenze critiche
        const criticalDeps = ['react', 'typescript'];
        criticalDeps.forEach(dep => {
            if (!pkg.dependencies || !pkg.dependencies[dep]) {
                if (!pkg.devDependencies || !pkg.devDependencies[dep]) {
                    issues.push(`Dipendenza critica mancante: ${dep}`);
                }
            }
        });
        
        return { pkg, issues };
    } catch (error) {
        log(`Errore parsing package.json: ${error.message}`, 'ERROR');
        return false;
    }
}

/**
 * Verifica configurazioni TypeScript
 */
function checkTypeScriptConfig() {
    const tsconfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
    
    if (!fs.existsSync(tsconfigPath)) {
        return { exists: false, issues: ['tsconfig.json non trovato'] };
    }
    
    try {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        const issues = [];
        
        // Verifica configurazioni essenziali
        if (!tsconfig.compilerOptions) {
            issues.push('compilerOptions mancante');
        } else {
            const requiredOptions = ['target', 'module', 'jsx'];
            requiredOptions.forEach(option => {
                if (!tsconfig.compilerOptions[option]) {
                    issues.push(`Opzione TypeScript mancante: ${option}`);
                }
            });
        }
        
        return { exists: true, config: tsconfig, issues };
    } catch (error) {
        return { exists: true, issues: [`Errore parsing tsconfig.json: ${error.message}`] };
    }
}

/**
 * Verifica configurazioni Vite
 */
function checkViteConfig() {
    const viteConfigPaths = [
        'vite.config.ts',
        'vite.config.js',
        'vite.config.mjs'
    ];
    
    const configPath = viteConfigPaths.find(p => fs.existsSync(path.join(PROJECT_ROOT, p)));
    
    if (!configPath) {
        return { exists: false, issues: ['Configurazione Vite non trovata'] };
    }
    
    return { exists: true, path: configPath, issues: [] };
}

/**
 * Verifica variabili d'ambiente
 */
function checkEnvironmentVariables() {
    const envPath = path.join(PROJECT_ROOT, '.env');
    const envExamplePath = path.join(PROJECT_ROOT, '.env.example');
    
    const envVars = parseEnvFile(envPath);
    const envExampleVars = parseEnvFile(envExamplePath);
    
    const issues = [];
    const missing = [];
    const extra = [];
    
    // Controlla variabili mancanti
    Object.keys(envExampleVars).forEach(key => {
        if (!envVars.hasOwnProperty(key)) {
            missing.push(key);
        }
    });
    
    // Controlla variabili extra
    Object.keys(envVars).forEach(key => {
        if (!envExampleVars.hasOwnProperty(key)) {
            extra.push(key);
        }
    });
    
    // Controlla variabili vuote critiche
    const criticalVars = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY'
    ];
    
    const empty = [];
    criticalVars.forEach(key => {
        if (envVars[key] === '' || envVars[key] === undefined) {
            empty.push(key);
        }
    });
    
    return {
        envExists: fs.existsSync(envPath),
        envExampleExists: fs.existsSync(envExamplePath),
        missing,
        extra,
        empty,
        total: Object.keys(envVars).length,
        example: Object.keys(envExampleVars).length
    };
}

/**
 * Main check function
 */
function runConfigCheck() {
    console.log('⚙️ CONTROLLO CONFIGURAZIONI WINENODE\n');
    
    let hasErrors = false;
    let hasWarnings = false;
    
    // 1. Package.json check
    console.log('📦 PACKAGE.JSON:');
    const pkgCheck = checkPackageJson();
    if (pkgCheck && pkgCheck.issues.length === 0) {
        log('Configurazione package.json OK', 'SUCCESS');
    } else if (pkgCheck) {
        pkgCheck.issues.forEach(issue => {
            log(issue, 'WARN');
            hasWarnings = true;
        });
    } else {
        hasErrors = true;
    }
    console.log('');
    
    // 2. TypeScript check
    console.log('🔷 TYPESCRIPT:');
    const tsCheck = checkTypeScriptConfig();
    if (tsCheck.exists && tsCheck.issues.length === 0) {
        log('Configurazione TypeScript OK', 'SUCCESS');
    } else {
        tsCheck.issues.forEach(issue => {
            log(issue, tsCheck.exists ? 'WARN' : 'ERROR');
            if (!tsCheck.exists) hasErrors = true;
            else hasWarnings = true;
        });
    }
    console.log('');
    
    // 3. Vite check
    console.log('⚡ VITE:');
    const viteCheck = checkViteConfig();
    if (viteCheck.exists) {
        log(`Configurazione Vite trovata: ${viteCheck.path}`, 'SUCCESS');
    } else {
        log('Configurazione Vite non trovata', 'ERROR');
        hasErrors = true;
    }
    console.log('');
    
    // 4. Environment variables check
    console.log('🔐 VARIABILI D\'AMBIENTE:');
    const envCheck = checkEnvironmentVariables();
    
    if (!envCheck.envExampleExists) {
        log('.env.example non trovato', 'ERROR');
        hasErrors = true;
    }
    
    if (!envCheck.envExists) {
        log('.env non trovato', 'WARN');
        hasWarnings = true;
    } else {
        log(`File .env trovato con ${envCheck.total} variabili`, 'SUCCESS');
    }
    
    if (envCheck.missing.length > 0) {
        log(`Variabili mancanti in .env: ${envCheck.missing.join(', ')}`, 'WARN');
        hasWarnings = true;
    }
    
    if (envCheck.extra.length > 0) {
        log(`Variabili extra in .env: ${envCheck.extra.join(', ')}`, 'INFO');
    }
    
    if (envCheck.empty.length > 0) {
        log(`Variabili critiche vuote: ${envCheck.empty.join(', ')}`, 'ERROR');
        hasErrors = true;
    }
    
    console.log('');
    
    // 5. Summary
    console.log('📊 RIEPILOGO:');
    if (!hasErrors && !hasWarnings) {
        log('Tutte le configurazioni sono OK', 'SUCCESS');
    } else {
        if (hasErrors) {
            log('Trovati errori di configurazione critici', 'ERROR');
        }
        if (hasWarnings) {
            log('Trovati avvisi di configurazione', 'WARN');
        }
    }
    
    // 6. Suggerimenti
    if (hasErrors || hasWarnings) {
        console.log('\n💡 SUGGERIMENTI:');
        
        if (envCheck.missing.length > 0) {
            console.log('   - Copia le variabili mancanti da .env.example a .env');
        }
        
        if (envCheck.empty.length > 0) {
            console.log('   - Configura le variabili Supabase per il funzionamento dell\'app');
        }
        
        if (!tsCheck.exists) {
            console.log('   - Crea tsconfig.json per il supporto TypeScript');
        }
        
        if (!viteCheck.exists) {
            console.log('   - Crea vite.config.ts per la configurazione build');
        }
    }
    
    console.log('');
    
    return !hasErrors;
}

/**
 * Main function
 */
async function main() {
    const success = runConfigCheck();
    process.exit(success ? 0 : 1);
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        log(`❌ Errore fatale: ${error.message}`, 'ERROR');
        process.exit(1);
    });
}

export { runConfigCheck };

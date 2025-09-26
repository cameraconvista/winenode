#!/usr/bin/env node

/**
 * 📊 PROJECT INFO - WINENODE
 * 
 * Funzionalità:
 * - Riepilogo completo del progetto
 * - Statistiche file, dipendenze, configurazioni
 * - Stato salute generale del progetto
 * - Info sviluppo e build
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
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
 * Scansiona directory ricorsivamente
 */
function scanDirectory(dirPath, results = { files: 0, size: 0, extensions: new Map() }) {
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
                    results.files++;
                    results.size += stats.size;
                    
                    const ext = path.extname(fullPath).toLowerCase() || 'no-extension';
                    const current = results.extensions.get(ext) || { count: 0, size: 0 };
                    current.count++;
                    current.size += stats.size;
                    results.extensions.set(ext, current);
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
 * Legge informazioni package.json
 */
function getPackageInfo() {
    const packagePath = path.join(PROJECT_ROOT, 'package.json');
    
    if (!fs.existsSync(packagePath)) {
        return null;
    }
    
    try {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        const depCount = Object.keys(pkg.dependencies || {}).length;
        const devDepCount = Object.keys(pkg.devDependencies || {}).length;
        const scriptCount = Object.keys(pkg.scripts || {}).length;
        
        return {
            name: pkg.name,
            version: pkg.version,
            description: pkg.description,
            dependencies: depCount,
            devDependencies: devDepCount,
            scripts: scriptCount,
            pkg
        };
    } catch (error) {
        return null;
    }
}

/**
 * Ottiene informazioni Git
 */
function getGitInfo() {
    try {
        const branch = execSync('git branch --show-current', { 
            encoding: 'utf8', 
            cwd: PROJECT_ROOT 
        }).trim();
        
        const lastCommit = execSync('git log -1 --format="%h %s (%cr)"', { 
            encoding: 'utf8', 
            cwd: PROJECT_ROOT 
        }).trim();
        
        const status = execSync('git status --porcelain', { 
            encoding: 'utf8', 
            cwd: PROJECT_ROOT 
        }).trim();
        
        const modifiedFiles = status ? status.split('\n').length : 0;
        
        return {
            branch,
            lastCommit,
            hasChanges: status.length > 0,
            modifiedFiles
        };
    } catch (error) {
        return {
            branch: 'N/A',
            lastCommit: 'N/A',
            hasChanges: false,
            modifiedFiles: 0
        };
    }
}

/**
 * Verifica configurazioni
 */
function checkConfigurations() {
    const configs = {
        typescript: fs.existsSync(path.join(PROJECT_ROOT, 'tsconfig.json')),
        vite: fs.existsSync(path.join(PROJECT_ROOT, 'vite.config.ts')) || 
              fs.existsSync(path.join(PROJECT_ROOT, 'vite.config.js')),
        eslint: fs.existsSync(path.join(PROJECT_ROOT, 'eslint.config.js')) || 
                fs.existsSync(path.join(PROJECT_ROOT, '.eslintrc.js')),
        tailwind: fs.existsSync(path.join(PROJECT_ROOT, 'tailwind.config.js')),
        env: fs.existsSync(path.join(PROJECT_ROOT, '.env')),
        envExample: fs.existsSync(path.join(PROJECT_ROOT, '.env.example'))
    };
    
    return configs;
}

/**
 * Analizza struttura progetto
 */
function analyzeProjectStructure() {
    const structure = {
        src: 0,
        components: 0,
        pages: 0,
        hooks: 0,
        utils: 0,
        assets: 0,
        docs: 0,
        scripts: 0,
        tests: 0
    };
    
    const directories = [
        { path: 'src', key: 'src' },
        { path: 'src/components', key: 'components' },
        { path: 'src/pages', key: 'pages' },
        { path: 'src/hooks', key: 'hooks' },
        { path: 'src/utils', key: 'utils' },
        { path: 'src/assets', key: 'assets' },
        { path: 'public', key: 'assets' },
        { path: 'DOCS', key: 'docs' },
        { path: 'scripts', key: 'scripts' },
        { path: '__tests__', key: 'tests' },
        { path: 'tests', key: 'tests' }
    ];
    
    directories.forEach(dir => {
        const dirPath = path.join(PROJECT_ROOT, dir.path);
        if (fs.existsSync(dirPath)) {
            try {
                const items = fs.readdirSync(dirPath);
                structure[dir.key] += items.filter(item => {
                    const itemPath = path.join(dirPath, item);
                    return fs.statSync(itemPath).isFile();
                }).length;
            } catch (error) {
                // Ignora errori
            }
        }
    });
    
    return structure;
}

/**
 * Controlla stato backup
 */
function getBackupStatus() {
    const backupDir = path.join(PROJECT_ROOT, 'Backup_Automatico');
    
    if (!fs.existsSync(backupDir)) {
        return { exists: false, count: 0, lastBackup: null };
    }
    
    try {
        const backups = fs.readdirSync(backupDir)
            .filter(file => file.startsWith('backup_') && file.endsWith('.tar.gz'))
            .map(file => ({
                name: file,
                stats: fs.statSync(path.join(backupDir, file))
            }))
            .sort((a, b) => b.stats.mtime - a.stats.mtime);
        
        return {
            exists: true,
            count: backups.length,
            lastBackup: backups[0] || null
        };
    } catch (error) {
        return { exists: false, count: 0, lastBackup: null };
    }
}

/**
 * Main project info function
 */
function showProjectInfo() {
    console.log('📊 INFORMAZIONI PROGETTO WINENODE\n');
    
    // 1. Informazioni generali
    const pkgInfo = getPackageInfo();
    if (pkgInfo) {
        console.log('📦 PROGETTO:');
        console.log(`   Nome: ${pkgInfo.name}`);
        console.log(`   Versione: ${pkgInfo.version}`);
        if (pkgInfo.description) {
            console.log(`   Descrizione: ${pkgInfo.description}`);
        }
        console.log('');
    }
    
    // 2. Statistiche file
    console.log('📁 STATISTICHE FILE:');
    const fileStats = scanDirectory(PROJECT_ROOT);
    console.log(`   File totali: ${fileStats.files}`);
    console.log(`   Dimensione totale: ${formatFileSize(fileStats.size)}`);
    
    // Top 5 estensioni
    const topExtensions = Array.from(fileStats.extensions.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);
    
    console.log('   Estensioni principali:');
    topExtensions.forEach(([ext, data]) => {
        console.log(`     ${ext}: ${data.count} file (${formatFileSize(data.size)})`);
    });
    console.log('');
    
    // 3. Struttura progetto
    console.log('🏗️ STRUTTURA PROGETTO:');
    const structure = analyzeProjectStructure();
    Object.entries(structure).forEach(([key, count]) => {
        if (count > 0) {
            const label = key.charAt(0).toUpperCase() + key.slice(1);
            console.log(`   ${label}: ${count} file`);
        }
    });
    console.log('');
    
    // 4. Dipendenze
    if (pkgInfo) {
        console.log('📚 DIPENDENZE:');
        console.log(`   Dipendenze produzione: ${pkgInfo.dependencies}`);
        console.log(`   Dipendenze sviluppo: ${pkgInfo.devDependencies}`);
        console.log(`   Script npm: ${pkgInfo.scripts}`);
        console.log('');
    }
    
    // 5. Configurazioni
    console.log('⚙️ CONFIGURAZIONI:');
    const configs = checkConfigurations();
    Object.entries(configs).forEach(([config, exists]) => {
        const status = exists ? '✅' : '❌';
        const label = config.charAt(0).toUpperCase() + config.slice(1);
        console.log(`   ${status} ${label}`);
    });
    console.log('');
    
    // 6. Git info
    console.log('🔀 GIT:');
    const gitInfo = getGitInfo();
    console.log(`   Branch: ${gitInfo.branch}`);
    console.log(`   Ultimo commit: ${gitInfo.lastCommit}`);
    if (gitInfo.hasChanges) {
        console.log(`   ⚠️ File modificati: ${gitInfo.modifiedFiles}`);
    } else {
        console.log(`   ✅ Working tree pulito`);
    }
    console.log('');
    
    // 7. Backup status
    console.log('💾 BACKUP:');
    const backupStatus = getBackupStatus();
    if (backupStatus.exists) {
        console.log(`   ✅ Sistema backup attivo`);
        console.log(`   Backup disponibili: ${backupStatus.count}`);
        if (backupStatus.lastBackup) {
            const lastDate = backupStatus.lastBackup.stats.mtime.toLocaleString('it-IT', {
                timeZone: 'Europe/Rome'
            });
            console.log(`   Ultimo backup: ${lastDate}`);
        }
    } else {
        console.log(`   ❌ Sistema backup non configurato`);
    }
    console.log('');
    
    // 8. Salute progetto
    console.log('🏥 SALUTE PROGETTO:');
    let healthScore = 0;
    let maxScore = 0;
    
    // Configurazioni essenziali
    maxScore += 6;
    healthScore += Object.values(configs).filter(Boolean).length;
    
    // Git pulito
    maxScore += 1;
    if (!gitInfo.hasChanges) healthScore += 1;
    
    // Backup attivo
    maxScore += 1;
    if (backupStatus.exists) healthScore += 1;
    
    // Struttura organizzata
    maxScore += 1;
    if (structure.components > 0 && structure.hooks > 0) healthScore += 1;
    
    const healthPercentage = Math.round((healthScore / maxScore) * 100);
    const healthEmoji = healthPercentage >= 80 ? '💚' : healthPercentage >= 60 ? '💛' : '❤️';
    
    console.log(`   ${healthEmoji} Punteggio salute: ${healthScore}/${maxScore} (${healthPercentage}%)`);
    
    if (healthPercentage < 80) {
        console.log('\n💡 SUGGERIMENTI MIGLIORAMENTO:');
        
        if (!configs.typescript) {
            console.log('   - Configura TypeScript per type safety');
        }
        
        if (!configs.eslint) {
            console.log('   - Configura ESLint per qualità codice');
        }
        
        if (!configs.env) {
            console.log('   - Crea file .env per configurazioni');
        }
        
        if (!backupStatus.exists) {
            console.log('   - Attiva sistema backup automatico');
        }
        
        if (gitInfo.hasChanges) {
            console.log('   - Committa le modifiche pendenti');
        }
    }
    
    console.log('');
    
    return {
        package: pkgInfo,
        files: fileStats,
        structure,
        configs,
        git: gitInfo,
        backup: backupStatus,
        health: { score: healthScore, max: maxScore, percentage: healthPercentage }
    };
}

/**
 * Main function
 */
async function main() {
    const info = showProjectInfo();
    
    if (info.health.percentage >= 80) {
        log('Progetto in ottima salute', 'SUCCESS');
    } else if (info.health.percentage >= 60) {
        log('Progetto in buone condizioni, alcuni miglioramenti possibili', 'WARN');
    } else {
        log('Progetto necessita di attenzione', 'WARN');
    }
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        log(`❌ Errore fatale: ${error.message}`, 'ERROR');
        process.exit(1);
    });
}

export { showProjectInfo };

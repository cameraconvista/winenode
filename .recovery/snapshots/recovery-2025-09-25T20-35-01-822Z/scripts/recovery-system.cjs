#!/usr/bin/env node

/**
 * SISTEMA DI RECOVERY AUTOMATICO - WineNode
 * 
 * Questo script permette di riprendere automaticamente le modifiche
 * in caso di interruzioni durante lo sviluppo.
 * 
 * Uso: npm run recovery [action]
 * 
 * Azioni disponibili:
 * - save: Salva lo stato corrente
 * - restore: Ripristina l'ultimo stato salvato
 * - list: Lista tutti i punti di recovery
 * - auto: Modalità automatica (salva ogni 5 minuti)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RECOVERY_DIR = path.join(__dirname, '..', '.recovery');
const STATE_FILE = path.join(RECOVERY_DIR, 'current-state.json');
const SNAPSHOTS_DIR = path.join(RECOVERY_DIR, 'snapshots');

// Assicura che le directory esistano
function ensureDirectories() {
  if (!fs.existsSync(RECOVERY_DIR)) {
    fs.mkdirSync(RECOVERY_DIR, { recursive: true });
  }
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  }
}

// Salva lo stato corrente del progetto
function saveCurrentState() {
  ensureDirectories();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapshotId = `recovery-${timestamp}`;
  
  console.log('🔄 Salvando stato corrente...');
  
  // Informazioni sullo stato
  const state = {
    timestamp: new Date().toISOString(),
    snapshotId,
    branch: getCurrentBranch(),
    lastCommit: getLastCommit(),
    modifiedFiles: getModifiedFiles(),
    activeTask: getActiveTask(),
    reports: getRecentReports()
  };
  
  // Salva lo stato
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  
  // Crea snapshot dei file modificati
  const snapshotDir = path.join(SNAPSHOTS_DIR, snapshotId);
  fs.mkdirSync(snapshotDir, { recursive: true });
  
  state.modifiedFiles.forEach(file => {
    const sourcePath = path.join(__dirname, '..', file);
    const targetPath = path.join(snapshotDir, file);
    
    // Crea directory se necessaria
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Copia il file
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
  
  console.log(`✅ Stato salvato: ${snapshotId}`);
  console.log(`📁 File modificati: ${state.modifiedFiles.length}`);
  console.log(`📝 Task attivo: ${state.activeTask}`);
  
  return snapshotId;
}

// Ripristina l'ultimo stato salvato
function restoreLastState() {
  if (!fs.existsSync(STATE_FILE)) {
    console.log('❌ Nessuno stato da ripristinare');
    return false;
  }
  
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  const snapshotDir = path.join(SNAPSHOTS_DIR, state.snapshotId);
  
  if (!fs.existsSync(snapshotDir)) {
    console.log('❌ Snapshot non trovato');
    return false;
  }
  
  console.log(`🔄 Ripristinando stato: ${state.snapshotId}`);
  console.log(`📅 Salvato il: ${new Date(state.timestamp).toLocaleString()}`);
  
  // Ripristina i file
  state.modifiedFiles.forEach(file => {
    const sourcePath = path.join(snapshotDir, file);
    const targetPath = path.join(__dirname, '..', file);
    
    if (fs.existsSync(sourcePath)) {
      // Crea directory se necessaria
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Ripristinato: ${file}`);
    }
  });
  
  console.log('🎯 Stato ripristinato con successo!');
  console.log(`📝 Task da continuare: ${state.activeTask}`);
  
  return true;
}

// Lista tutti i punti di recovery
function listRecoveryPoints() {
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    console.log('❌ Nessun punto di recovery trovato');
    return;
  }
  
  const snapshots = fs.readdirSync(SNAPSHOTS_DIR)
    .filter(dir => dir.startsWith('recovery-'))
    .sort()
    .reverse();
  
  if (snapshots.length === 0) {
    console.log('❌ Nessun punto di recovery trovato');
    return;
  }
  
  console.log('📋 Punti di recovery disponibili:');
  console.log('');
  
  snapshots.forEach((snapshot, index) => {
    const snapshotPath = path.join(SNAPSHOTS_DIR, snapshot);
    const stats = fs.statSync(snapshotPath);
    const date = stats.mtime.toLocaleString();
    
    // Cerca file di stato associato
    let taskInfo = 'Task sconosciuto';
    try {
      const stateFiles = fs.readdirSync(snapshotPath).filter(f => f.endsWith('.json'));
      if (stateFiles.length > 0) {
        const stateData = JSON.parse(fs.readFileSync(path.join(snapshotPath, stateFiles[0]), 'utf8'));
        taskInfo = stateData.activeTask || 'Task sconosciuto';
      }
    } catch (e) {
      // Ignora errori
    }
    
    console.log(`${index + 1}. ${snapshot}`);
    console.log(`   📅 ${date}`);
    console.log(`   📝 ${taskInfo}`);
    console.log('');
  });
}

// Modalità automatica (salva ogni 5 minuti)
function startAutoMode() {
  console.log('🔄 Modalità automatica attivata');
  console.log('💾 Salvataggio automatico ogni 5 minuti');
  console.log('⏹️  Premi Ctrl+C per fermare');
  
  // Salva immediatamente
  saveCurrentState();
  
  // Salva ogni 5 minuti
  const interval = setInterval(() => {
    const modifiedFiles = getModifiedFiles();
    if (modifiedFiles.length > 0) {
      console.log(`\n🔄 Auto-save: ${modifiedFiles.length} file modificati`);
      saveCurrentState();
    }
  }, 5 * 60 * 1000); // 5 minuti
  
  // Gestisci Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n⏹️  Modalità automatica fermata');
    clearInterval(interval);
    process.exit(0);
  });
}

// Utility functions
function getCurrentBranch() {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  } catch (e) {
    return 'unknown';
  }
}

function getLastCommit() {
  try {
    return execSync('git log -1 --format="%H %s"', { encoding: 'utf8' }).trim();
  } catch (e) {
    return 'unknown';
  }
}

function getModifiedFiles() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    return status.split('\n')
      .filter(line => line.trim())
      .map(line => line.substring(3))
      .filter(file => file && !file.startsWith('.git'));
  } catch (e) {
    return [];
  }
}

function getActiveTask() {
  // Cerca nei report recenti per determinare il task attivo
  const reports = getRecentReports();
  if (reports.length > 0) {
    const lastReport = reports[0];
    if (lastReport.includes('RIMOZIONE_ICONE')) return 'Rimozione icone Gestisci Ordini';
    if (lastReport.includes('CENTRALIZZAZIONE_LABELS')) return 'Centralizzazione labels';
    if (lastReport.includes('RINOMINA_PULSANTI')) return 'Rinomina pulsanti';
    if (lastReport.includes('CONSOLIDATO')) return 'Report consolidato';
  }
  return 'Task generico';
}

function getRecentReports() {
  try {
    const files = fs.readdirSync(path.join(__dirname, '..'))
      .filter(file => file.startsWith('REPORT_') && file.endsWith('.txt'))
      .map(file => {
        const stats = fs.statSync(path.join(__dirname, '..', file));
        return { file, mtime: stats.mtime };
      })
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 5)
      .map(item => item.file);
    
    return files;
  } catch (e) {
    return [];
  }
}

// Main execution
const action = process.argv[2] || 'help';

switch (action) {
  case 'save':
    saveCurrentState();
    break;
    
  case 'restore':
    restoreLastState();
    break;
    
  case 'list':
    listRecoveryPoints();
    break;
    
  case 'auto':
    startAutoMode();
    break;
    
  case 'help':
  default:
    console.log('🔧 Sistema di Recovery WineNode');
    console.log('');
    console.log('Uso: npm run recovery [action]');
    console.log('');
    console.log('Azioni disponibili:');
    console.log('  save     - Salva lo stato corrente');
    console.log('  restore  - Ripristina l\'ultimo stato salvato');
    console.log('  list     - Lista tutti i punti di recovery');
    console.log('  auto     - Modalità automatica (salva ogni 5 min)');
    console.log('  help     - Mostra questo aiuto');
    console.log('');
    console.log('Esempi:');
    console.log('  npm run recovery save');
    console.log('  npm run recovery restore');
    console.log('  npm run recovery auto');
    break;
}

#!/usr/bin/env node

/**
 * 💬 CHAT COMMANDS HANDLER - WINENODE
 * 
 * Funzionalità:
 * - Gestisce trigger da chat Cascade
 * - Mapping comandi chat -> script npm
 * - Esecuzione automatica comandi
 * - Response formatting per chat
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Mapping comandi chat -> script npm
 */
const CHAT_COMMANDS = {
    // Trigger principali dal file informativo
    'esegui backup': 'backup',
    'esegui analisi': 'diagnose:force',
    'esegui commit': 'commit:auto',
    
    // Comandi aggiuntivi
    'aggiorna supabase': 'supabase:doc',
    'info progetto': 'project-info',
    'verifica config': 'config-check',
    'cleanup progetto': 'cleanup',
    'setup locale': 'setup:local',
    
    // Alias comuni
    'backup': 'backup',
    'diagnosi': 'diagnose:force',
    'commit': 'commit:auto',
    'analisi': 'diagnose:force'
};

/**
 * Logger
 */
function log(message, type = 'INFO') {
    const timestamp = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
    const prefix = type === 'ERROR' ? '❌' : type === 'SUCCESS' ? '✅' : type === 'WARN' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

/**
 * Esegue comando npm
 */
function runNpmCommand(command) {
    try {
        log(`🚀 Esecuzione: npm run ${command}`, 'INFO');
        
        const result = execSync(`npm run ${command}`, {
            cwd: PROJECT_ROOT,
            encoding: 'utf8',
            stdio: 'inherit'
        });
        
        log(`✅ Comando completato: ${command}`, 'SUCCESS');
        return { success: true, output: result };
        
    } catch (error) {
        log(`❌ Errore comando: ${command}`, 'ERROR');
        return { success: false, error: error.message };
    }
}

/**
 * Processa comando da chat
 */
function processChatCommand(input) {
    const normalizedInput = input.toLowerCase().trim();
    
    // Cerca comando esatto
    if (CHAT_COMMANDS[normalizedInput]) {
        return runNpmCommand(CHAT_COMMANDS[normalizedInput]);
    }
    
    // Cerca comando parziale
    for (const [trigger, command] of Object.entries(CHAT_COMMANDS)) {
        if (normalizedInput.includes(trigger)) {
            return runNpmCommand(command);
        }
    }
    
    // Comando non trovato
    log(`⚠️ Comando non riconosciuto: ${input}`, 'WARN');
    showAvailableCommands();
    
    return { success: false, error: 'Comando non riconosciuto' };
}

/**
 * Mostra comandi disponibili
 */
function showAvailableCommands() {
    console.log('\n💬 COMANDI CHAT DISPONIBILI:\n');
    
    const categories = {
        'Comandi Principali': [
            'esegui backup',
            'esegui analisi', 
            'esegui commit'
        ],
        'Gestione Progetto': [
            'info progetto',
            'verifica config',
            'cleanup progetto',
            'setup locale'
        ],
        'Database': [
            'aggiorna supabase'
        ]
    };
    
    Object.entries(categories).forEach(([category, commands]) => {
        console.log(`📋 ${category}:`);
        commands.forEach(cmd => {
            const npmCommand = CHAT_COMMANDS[cmd];
            console.log(`   "${cmd}" → npm run ${npmCommand}`);
        });
        console.log('');
    });
    
    console.log('💡 Scrivi semplicemente il comando in chat per eseguirlo automaticamente!');
    console.log('');
}

/**
 * Main function
 */
async function main() {
    const input = process.argv.slice(2).join(' ');
    
    if (!input || input === '--help' || input === '-h') {
        console.log('💬 CHAT COMMANDS HANDLER\n');
        console.log('Uso: node chat-commands.js "<comando>"\n');
        showAvailableCommands();
        return;
    }
    
    log(`💬 Comando ricevuto: "${input}"`, 'INFO');
    
    const result = processChatCommand(input);
    
    if (result.success) {
        console.log('\n🎉 COMANDO COMPLETATO CON SUCCESSO!');
    } else {
        console.log('\n❌ COMANDO FALLITO');
        process.exit(1);
    }
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        log(`❌ Errore fatale: ${error.message}`, 'ERROR');
        process.exit(1);
    });
}

export { processChatCommand, CHAT_COMMANDS };

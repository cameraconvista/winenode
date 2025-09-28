#!/usr/bin/env node

/**
 * 📊 SUPABASE DOC GENERATOR - WINENODE
 * 
 * Funzionalità:
 * - Genera documentazione live del database Supabase
 * - Sincronizza schema e configurazioni
 * - Gestisce credenziali in modo sicuro
 * - Aggiorna automaticamente la documentazione
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DOCS_PATH = path.join(PROJECT_ROOT, 'DOCS', '01_database_api.md');

/**
 * Logger
 */
function log(message, type = 'INFO') {
    const timestamp = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
    const prefix = type === 'ERROR' ? '❌' : type === 'SUCCESS' ? '✅' : type === 'WARN' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

/**
 * Legge credenziali Supabase da .env
 */
function getSupabaseCredentials() {
    const envPath = path.join(PROJECT_ROOT, '.env');
    
    if (!fs.existsSync(envPath)) {
        return null;
    }
    
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        const urlMatch = envContent.match(/^VITE_SUPABASE_URL=(.+)$/m);
        const keyMatch = envContent.match(/^VITE_SUPABASE_ANON_KEY=(.+)$/m);
        
        if (!urlMatch || !keyMatch) {
            return null;
        }
        
        const url = urlMatch[1].trim();
        const key = keyMatch[1].trim();
        
        // Verifica che non siano placeholder
        if (url.includes('your_') || key.includes('your_') || url === '' || key === '') {
            return null;
        }
        
        return { url, key };
    } catch (error) {
        return null;
    }
}

/**
 * Crea client Supabase
 */
function createSupabaseClient() {
    const credentials = getSupabaseCredentials();
    
    if (!credentials) {
        return null;
    }
    
    try {
        return createClient(credentials.url, credentials.key);
    } catch (error) {
        log(`Errore creazione client Supabase: ${error.message}`, 'ERROR');
        return null;
    }
}

/**
 * Ottiene informazioni tabelle dal database
 */
async function getTableInfo(supabase) {
    try {
        // Query per ottenere informazioni tabelle
        const { data: tables, error } = await supabase
            .from('information_schema.tables')
            .select('table_name, table_type')
            .eq('table_schema', 'public')
            .order('table_name');
        
        if (error) {
            log(`Errore query tabelle: ${error.message}`, 'ERROR');
            return [];
        }
        
        return tables || [];
    } catch (error) {
        log(`Errore ottenimento tabelle: ${error.message}`, 'ERROR');
        return [];
    }
}

/**
 * Ottiene struttura colonne per una tabella
 */
async function getTableColumns(supabase, tableName) {
    try {
        const { data: columns, error } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable, column_default')
            .eq('table_schema', 'public')
            .eq('table_name', tableName)
            .order('ordinal_position');
        
        if (error) {
            return [];
        }
        
        return columns || [];
    } catch (error) {
        return [];
    }
}

/**
 * Conta record in una tabella
 */
async function getTableCount(supabase, tableName) {
    try {
        const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
        
        if (error) {
            return 'N/A';
        }
        
        return count || 0;
    } catch (error) {
        return 'N/A';
    }
}

/**
 * Genera documentazione markdown
 */
async function generateDocumentation(supabase) {
    const timestamp = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
    const credentials = getSupabaseCredentials();
    
    let doc = `# 📊 Database Schema & API Documentation

*Documentazione generata automaticamente - ${timestamp}*

## 🔗 Configurazione Supabase

### Stato Connessione
- ✅ **Connesso**: ${credentials ? 'Sì' : 'No'}
- 🌐 **URL**: ${credentials ? `${credentials.url.substring(0, 30)}...` : 'Non configurato'}
- 🔑 **API Key**: ${credentials ? 'Configurata' : 'Non configurata'}
- 📅 **Ultimo aggiornamento**: ${timestamp}

### Variabili d'Ambiente Richieste
\`\`\`env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
DATABASE_URL=postgresql://user:pass@host:port/db (opzionale)
\`\`\`

`;

    if (!supabase) {
        doc += `## ⚠️ Configurazione Mancante

Per generare la documentazione completa del database, configura le credenziali Supabase nel file \`.env\`.

### Setup Rapido
1. Copia \`.env.example\` in \`.env\`
2. Configura \`VITE_SUPABASE_URL\` e \`VITE_SUPABASE_ANON_KEY\`
3. Esegui \`npm run supabase:doc\` per rigenerare questa documentazione

`;
        return doc;
    }

    // Ottieni informazioni tabelle
    log('📋 Ottenimento informazioni tabelle...', 'INFO');
    const tables = await getTableInfo(supabase);
    
    if (tables.length === 0) {
        doc += `## ⚠️ Nessuna Tabella Trovata

Il database sembra vuoto o non accessibile. Verifica:
- Le credenziali Supabase
- I permessi RLS
- La connessione di rete

`;
        return doc;
    }

    doc += `## 🗄️ Schema Database

### Panoramica Tabelle
| Tabella | Tipo | Record | Stato |
|---------|------|--------|-------|
`;

    // Analizza ogni tabella
    for (const table of tables) {
        const count = await getTableCount(supabase, table.table_name);
        const status = count === 'N/A' ? '⚠️ Errore' : count > 0 ? '✅ Dati' : '📝 Vuota';
        
        doc += `| ${table.table_name} | ${table.table_type} | ${count} | ${status} |\n`;
    }

    doc += `\n### Dettaglio Tabelle\n\n`;

    // Dettaglio per ogni tabella
    for (const table of tables) {
        log(`📊 Analisi tabella: ${table.table_name}`, 'INFO');
        
        const columns = await getTableColumns(supabase, table.table_name);
        const count = await getTableCount(supabase, table.table_name);
        
        doc += `#### ${table.table_name}\n`;
        doc += `**Record**: ${count} | **Tipo**: ${table.table_type}\n\n`;
        
        if (columns.length > 0) {
            doc += `| Colonna | Tipo | Nullable | Default |\n`;
            doc += `|---------|------|----------|----------|\n`;
            
            columns.forEach(col => {
                const nullable = col.is_nullable === 'YES' ? '✅' : '❌';
                const defaultVal = col.column_default || '-';
                doc += `| ${col.column_name} | ${col.data_type} | ${nullable} | ${defaultVal} |\n`;
            });
            
            doc += '\n';
        } else {
            doc += '*Struttura non accessibile*\n\n';
        }
    }

    // Sezione RLS e Policy
    doc += `## 🔐 Row Level Security (RLS)

### Stato RLS per Tabella
`;

    for (const table of tables) {
        try {
            // Prova a fare una query per testare l'accesso
            const { error } = await supabase
                .from(table.table_name)
                .select('*', { count: 'exact', head: true });
            
            const status = error ? '🔒 Bloccato' : '🔓 Accessibile';
            doc += `- **${table.table_name}**: ${status}\n`;
            
            if (error && error.message) {
                doc += `  - Errore: ${error.message}\n`;
            }
        } catch (err) {
            doc += `- **${table.table_name}**: ⚠️ Errore test\n`;
        }
    }

    // Sezione API Endpoints
    doc += `\n## 🌐 API REST Endpoints

### Base URL
\`\`\`
${credentials.url}/rest/v1/
\`\`\`

### Endpoints Disponibili
`;

    tables.forEach(table => {
        doc += `
#### ${table.table_name}
- **GET** \`/${table.table_name}\` - Lista record
- **POST** \`/${table.table_name}\` - Crea record
- **PATCH** \`/${table.table_name}?id=eq.{id}\` - Aggiorna record
- **DELETE** \`/${table.table_name}?id=eq.{id}\` - Elimina record
`;
    });

    // Change Log
    doc += `\n## 📝 Change Log

### ${timestamp}
- Documentazione rigenerata automaticamente
- Tabelle analizzate: ${tables.length}
- Stato connessione verificato

*Per aggiornare questa documentazione, esegui: \`npm run supabase:doc\`*

`;

    return doc;
}

/**
 * Salva documentazione su file
 */
function saveDocumentation(content) {
    try {
        // Crea directory DOCS se non esiste
        const docsDir = path.dirname(DOCS_PATH);
        if (!fs.existsSync(docsDir)) {
            fs.mkdirSync(docsDir, { recursive: true });
        }
        
        fs.writeFileSync(DOCS_PATH, content);
        log(`Documentazione salvata: ${path.relative(PROJECT_ROOT, DOCS_PATH)}`, 'SUCCESS');
        return true;
    } catch (error) {
        log(`Errore salvataggio documentazione: ${error.message}`, 'ERROR');
        return false;
    }
}

/**
 * Controlla se la documentazione è aggiornata
 */
function checkDocumentationFreshness() {
    if (!fs.existsSync(DOCS_PATH)) {
        return false;
    }
    
    try {
        const stats = fs.statSync(DOCS_PATH);
        const lastModified = stats.mtime;
        const now = new Date();
        const hoursSinceUpdate = (now - lastModified) / (1000 * 60 * 60);
        
        // Considera aggiornata se modificata nelle ultime 24 ore
        return hoursSinceUpdate < 24;
    } catch (error) {
        return false;
    }
}

/**
 * Main function
 */
async function main() {
    const command = process.argv[2];
    
    if (command === 'check') {
        const isFresh = checkDocumentationFreshness();
        if (isFresh) {
            log('Documentazione aggiornata (< 24h)', 'SUCCESS');
        } else {
            log('Documentazione da aggiornare', 'WARN');
        }
        process.exit(isFresh ? 0 : 1);
    }
    
    log('📊 Generazione documentazione Supabase...', 'INFO');
    
    const supabase = createSupabaseClient();
    
    if (!supabase) {
        log('⚠️ Credenziali Supabase non configurate, genero documentazione base', 'WARN');
    } else {
        log('✅ Client Supabase creato con successo', 'SUCCESS');
    }
    
    const documentation = await generateDocumentation(supabase);
    
    if (saveDocumentation(documentation)) {
        log('📚 Documentazione Supabase aggiornata con successo', 'SUCCESS');
    } else {
        log('❌ Errore aggiornamento documentazione', 'ERROR');
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

export { generateDocumentation, getSupabaseCredentials };

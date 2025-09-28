#!/usr/bin/env node

/**
 * 🧩 TEMPLATE COMPONENT - WINENODE
 * 
 * Funzionalità:
 * - Genera componenti React/TypeScript standardizzati
 * - Template per componenti, hook, utility
 * - Struttura modulare e best practices
 * - Configurabile per diversi tipi di moduli
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
 * Template per componente React
 */
function getComponentTemplate(name, props = []) {
    const propsInterface = props.length > 0 ? `
interface ${name}Props {
${props.map(prop => `  ${prop.name}${prop.optional ? '?' : ''}: ${prop.type};`).join('\n')}
}` : '';

    const propsParam = props.length > 0 ? `{ ${props.map(p => p.name).join(', ')} }: ${name}Props` : '';

    return `import React from 'react';

${propsInterface}

/**
 * ${name} Component
 * 
 * @description Descrizione del componente
 */
const ${name}: React.FC${props.length > 0 ? `<${name}Props>` : ''} = (${propsParam}) => {
  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-semibold text-app-text">
        ${name}
      </h2>
      {/* TODO: Implementa il contenuto del componente */}
    </div>
  );
};

export default ${name};
export type { ${props.length > 0 ? `${name}Props` : `${name}Props`} };`;
}

/**
 * Template per hook personalizzato
 */
function getHookTemplate(name, returnType = 'void') {
    const hookName = name.startsWith('use') ? name : `use${name}`;
    
    return `import { useState, useEffect } from 'react';

/**
 * ${hookName} Hook
 * 
 * @description Descrizione del hook
 * @returns ${returnType}
 */
const ${hookName} = (): ${returnType} => {
  // TODO: Implementa la logica del hook
  
  return;
};

export default ${hookName};`;
}

/**
 * Template per utility function
 */
function getUtilityTemplate(name, params = [], returnType = 'void') {
    const paramsStr = params.map(p => `${p.name}: ${p.type}`).join(', ');
    
    return `/**
 * ${name} Utility
 * 
 * @description Descrizione della utility function
${params.map(p => ` * @param ${p.name} - ${p.description || 'Parametro'}`).join('\n')}
 * @returns ${returnType}
 */
export const ${name} = (${paramsStr}): ${returnType} => {
  // TODO: Implementa la logica della utility
  
  return;
};

export default ${name};`;
}

/**
 * Template per context
 */
function getContextTemplate(name) {
    return `import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
interface ${name}State {
  // TODO: Definisci lo stato del context
}

interface ${name}Actions {
  // TODO: Definisci le azioni del context
}

type ${name}Action = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

interface ${name}ContextType {
  state: ${name}State;
  actions: ${name}Actions;
}

// Initial state
const initialState: ${name}State = {
  // TODO: Stato iniziale
};

// Reducer
const ${name.toLowerCase()}Reducer = (state: ${name}State, action: ${name}Action): ${name}State => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

// Context
const ${name}Context = createContext<${name}ContextType | undefined>(undefined);

// Provider
interface ${name}ProviderProps {
  children: ReactNode;
}

export const ${name}Provider: React.FC<${name}ProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(${name.toLowerCase()}Reducer, initialState);
  
  const actions: ${name}Actions = {
    // TODO: Implementa le azioni
  };
  
  return (
    <${name}Context.Provider value={{ state, actions }}>
      {children}
    </${name}Context.Provider>
  );
};

// Hook
export const use${name} = (): ${name}ContextType => {
  const context = useContext(${name}Context);
  if (context === undefined) {
    throw new Error('use${name} must be used within a ${name}Provider');
  }
  return context;
};`;
}

/**
 * Template per page component
 */
function getPageTemplate(name) {
    return `import React from 'react';

/**
 * ${name}Page Component
 * 
 * @description Pagina ${name}
 */
const ${name}Page: React.FC = () => {
  return (
    <div className="min-h-screen bg-app-bg">
      {/* Header */}
      <header className="bg-app-surface border-b border-app-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-app-text">
            ${name}
          </h1>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-app-surface rounded-lg border border-app-border p-6">
          {/* TODO: Implementa il contenuto della pagina */}
          <p className="text-app-muted">
            Contenuto della pagina ${name}
          </p>
        </div>
      </main>
    </div>
  );
};

export default ${name}Page;`;
}

/**
 * Crea file da template
 */
function createFromTemplate(type, name, targetPath, options = {}) {
    let content = '';
    let fileName = '';
    
    switch (type) {
        case 'component':
            content = getComponentTemplate(name, options.props || []);
            fileName = `${name}.tsx`;
            break;
            
        case 'hook':
            content = getHookTemplate(name, options.returnType);
            fileName = `${name.startsWith('use') ? name : `use${name}`}.ts`;
            break;
            
        case 'utility':
            content = getUtilityTemplate(name, options.params || [], options.returnType || 'void');
            fileName = `${name}.ts`;
            break;
            
        case 'context':
            content = getContextTemplate(name);
            fileName = `${name}Context.tsx`;
            break;
            
        case 'page':
            content = getPageTemplate(name);
            fileName = `${name}Page.tsx`;
            break;
            
        default:
            throw new Error(`Tipo template non supportato: ${type}`);
    }
    
    const fullPath = path.join(targetPath, fileName);
    
    // Verifica se il file esiste già
    if (fs.existsSync(fullPath)) {
        throw new Error(`File già esistente: ${fullPath}`);
    }
    
    // Crea directory se non esiste
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    // Scrivi file
    fs.writeFileSync(fullPath, content);
    
    return { fullPath, fileName };
}

/**
 * Parsing argomenti command line
 */
function parseArguments() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log(`
🧩 TEMPLATE COMPONENT GENERATOR

Uso:
  npm run template <tipo> <nome> [opzioni]

Tipi disponibili:
  component  - Componente React
  hook       - Hook personalizzato
  utility    - Utility function
  context    - Context React
  page       - Page component

Esempi:
  npm run template component UserCard
  npm run template hook useLocalStorage
  npm run template utility formatDate
  npm run template context Auth
  npm run template page Dashboard

Opzioni:
  --path <percorso>    - Directory di destinazione (default: src/components)
  --props <props>      - Props per componente (formato: name:type:optional)
  --params <params>    - Parametri per utility (formato: name:type:description)
  --return <type>      - Tipo di ritorno per hook/utility
        `);
        process.exit(1);
    }
    
    const type = args[0];
    const name = args[1];
    
    // Parse opzioni
    const options = {};
    let targetPath = path.join(PROJECT_ROOT, 'src', 'components');
    
    for (let i = 2; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '--path' && i + 1 < args.length) {
            targetPath = path.resolve(PROJECT_ROOT, args[i + 1]);
            i++;
        } else if (arg === '--props' && i + 1 < args.length) {
            const propsStr = args[i + 1];
            options.props = propsStr.split(',').map(prop => {
                const [propName, propType, optional] = prop.split(':');
                return {
                    name: propName,
                    type: propType || 'string',
                    optional: optional === 'true'
                };
            });
            i++;
        } else if (arg === '--params' && i + 1 < args.length) {
            const paramsStr = args[i + 1];
            options.params = paramsStr.split(',').map(param => {
                const [paramName, paramType, description] = param.split(':');
                return {
                    name: paramName,
                    type: paramType || 'string',
                    description: description || 'Parametro'
                };
            });
            i++;
        } else if (arg === '--return' && i + 1 < args.length) {
            options.returnType = args[i + 1];
            i++;
        }
    }
    
    // Adjust target path based on type
    if (type === 'hook') {
        targetPath = path.join(PROJECT_ROOT, 'src', 'hooks');
    } else if (type === 'utility') {
        targetPath = path.join(PROJECT_ROOT, 'src', 'utils');
    } else if (type === 'context') {
        targetPath = path.join(PROJECT_ROOT, 'src', 'contexts');
    } else if (type === 'page') {
        targetPath = path.join(PROJECT_ROOT, 'src', 'pages');
    }
    
    return { type, name, targetPath, options };
}

/**
 * Main function
 */
async function main() {
    try {
        const { type, name, targetPath, options } = parseArguments();
        
        log(`🧩 Creazione ${type}: ${name}`, 'INFO');
        log(`📁 Percorso: ${path.relative(PROJECT_ROOT, targetPath)}`, 'INFO');
        
        const result = createFromTemplate(type, name, targetPath, options);
        
        log(`✅ File creato: ${result.fileName}`, 'SUCCESS');
        log(`📄 Percorso completo: ${result.fullPath}`, 'INFO');
        
        // Suggerimenti post-creazione
        console.log('\n💡 PROSSIMI PASSI:');
        
        if (type === 'component') {
            console.log('   - Implementa la logica del componente');
            console.log('   - Aggiungi stili Tailwind se necessario');
            console.log('   - Crea test per il componente');
        } else if (type === 'hook') {
            console.log('   - Implementa la logica del hook');
            console.log('   - Aggiungi gestione errori se necessario');
            console.log('   - Crea test per il hook');
        } else if (type === 'utility') {
            console.log('   - Implementa la logica della utility');
            console.log('   - Aggiungi validazione parametri');
            console.log('   - Crea test unitari');
        } else if (type === 'context') {
            console.log('   - Definisci stato e azioni del context');
            console.log('   - Implementa reducer logic');
            console.log('   - Aggiungi il provider nell\'app');
        } else if (type === 'page') {
            console.log('   - Implementa il contenuto della pagina');
            console.log('   - Aggiungi routing se necessario');
            console.log('   - Configura meta tags e SEO');
        }
        
        console.log('');
        
    } catch (error) {
        log(`❌ Errore: ${error.message}`, 'ERROR');
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

export { createFromTemplate };

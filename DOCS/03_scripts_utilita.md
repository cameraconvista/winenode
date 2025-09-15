
# 🛠️ Script di Utilità WineNode

## 📂 Script Disponibili

### `/scripts/` Directory
Contenitore per script di automazione, monitoraggio e manutenzione del progetto.

## 📊 Script di Monitoraggio

### 1. **Monitor Dimensioni File**
```bash
#!/bin/bash
# scripts/monitor-sizes.sh

echo "📊 REPORT DIMENSIONI FILE WINENODE"
echo "=================================="

# Dimensioni totali progetto
echo "📦 Dimensione totale progetto:"
du -sh . | head -1

echo ""
echo "📁 Dimensioni directory principali:"
du -sh src/ server/ shared/ public/ DOCS/ 2>/dev/null | sort -hr

echo ""
echo "📄 File più grandi (>100KB):"
find . -type f -size +100k -not -path "./node_modules/*" -not -path "./.git/*" | xargs ls -lh | sort -k5 -hr | head -10

echo ""
echo "🧩 Conteggio file per tipo:"
echo "TypeScript: $(find . -name "*.ts" -o -name "*.tsx" | wc -l)"
echo "JavaScript: $(find . -name "*.js" -o -name "*.jsx" | wc -l)"
echo "CSS: $(find . -name "*.css" | wc -l)"
echo "SQL: $(find . -name "*.sql" | wc -l)"
echo "Markdown: $(find . -name "*.md" | wc -l)"
```

### 2. **Check Configurazioni**
```bash
#!/bin/bash
# scripts/check-config.sh

echo "⚙️ VERIFICA CONFIGURAZIONI WINENODE"
echo "==================================="

# Variabili ambiente richieste
echo "🔐 Variabili ambiente:"
echo "VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:-'❌ MANCANTE'}"
echo "VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:0:10}... ${VITE_SUPABASE_ANON_KEY:+✅}${VITE_SUPABASE_ANON_KEY:-❌ MANCANTE}"
echo "DATABASE_URL: ${DATABASE_URL:0:20}... ${DATABASE_URL:+✅}${DATABASE_URL:-❌ MANCANTE}"

echo ""
echo "📦 Dipendenze principali:"
node -e "
const pkg = require('./package.json');
const deps = pkg.dependencies;
console.log('React:', deps.react || '❌');
console.log('Vite:', require('./package.json').devDependencies.vite || '❌');
console.log('Supabase:', deps['@supabase/supabase-js'] || '❌');
console.log('Drizzle:', deps['drizzle-orm'] || '❌');
"

echo ""
echo "🔧 Configurazioni build:"
echo "Vite config: $(test -f vite.config.ts && echo '✅' || echo '❌')"
echo "TypeScript: $(test -f tsconfig.json && echo '✅' || echo '❌')"
echo "Tailwind: $(test -f tailwind.config.js && echo '✅' || echo '❌')"
echo "Package.json: $(test -f package.json && echo '✅' || echo '❌')"
```

### 3. **Database Health Check**
```bash
#!/bin/bash
# scripts/db-health.sh

echo "🗄️ VERIFICA SALUTE DATABASE"
echo "=========================="

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL non configurato"
    exit 1
fi

echo "📊 Conteggio record principali:"
psql "$DATABASE_URL" -c "
SELECT 
    'vini' as tabella, 
    COUNT(*) as records 
FROM vini
UNION ALL
SELECT 
    'giacenza' as tabella, 
    COUNT(*) as records 
FROM giacenza
UNION ALL
SELECT 
    'ordini' as tabella, 
    COUNT(*) as records 
FROM ordini;
"

echo ""
echo "🔗 Verifica integrità relazioni:"
psql "$DATABASE_URL" -c "
SELECT 
    COUNT(*) as vini_senza_giacenza
FROM vini v 
LEFT JOIN giacenza g ON v.id = g.vino_id 
WHERE g.vino_id IS NULL;
"

echo ""
echo "⚠️ Controllo anomalie:"
psql "$DATABASE_URL" -c "
SELECT 
    'Vini senza nome' as anomalia,
    COUNT(*) as count
FROM vini 
WHERE nome_vino IS NULL OR nome_vino = ''
UNION ALL
SELECT 
    'Giacenze negative' as anomalia,
    COUNT(*) as count
FROM giacenza 
WHERE giacenza < 0;
"
```

## 🏗️ Template Generator Scripts

### 4. **Genera Componente React**
```bash
#!/bin/bash
# scripts/generate-component.sh

COMPONENT_NAME=$1
if [ -z "$COMPONENT_NAME" ]; then
    echo "❌ Usage: ./scripts/generate-component.sh ComponentName"
    exit 1
fi

COMPONENT_DIR="src/components"
COMPONENT_FILE="$COMPONENT_DIR/$COMPONENT_NAME.tsx"

# Verifica se esiste già
if [ -f "$COMPONENT_FILE" ]; then
    echo "❌ Componente $COMPONENT_NAME già esistente"
    exit 1
fi

# Template componente
cat > "$COMPONENT_FILE" << EOF
import React from 'react';
import { clsx } from 'clsx';

interface ${COMPONENT_NAME}Props {
  className?: string;
  children?: React.ReactNode;
}

const $COMPONENT_NAME: React.FC<${COMPONENT_NAME}Props> = ({ 
  className = '', 
  children 
}) => {
  return (
    <div className={clsx('${COMPONENT_NAME,,}', className)}>
      {children}
    </div>
  );
};

export default $COMPONENT_NAME;
EOF

echo "✅ Componente $COMPONENT_NAME creato in $COMPONENT_FILE"
echo "📝 Non dimenticare di aggiungere gli stili in index.css se necessario"
```

### 5. **Genera Hook Custom**
```bash
#!/bin/bash
# scripts/generate-hook.sh

HOOK_NAME=$1
if [ -z "$HOOK_NAME" ]; then
    echo "❌ Usage: ./scripts/generate-hook.sh useSomething"
    exit 1
fi

HOOK_DIR="src/hooks"
HOOK_FILE="$HOOK_DIR/$HOOK_NAME.ts"

# Verifica naming convention
if [[ ! $HOOK_NAME =~ ^use[A-Z] ]]; then
    echo "❌ Hook name must start with 'use' followed by uppercase letter"
    exit 1
fi

# Template hook
cat > "$HOOK_FILE" << EOF
import { useState, useEffect } from 'react';

export const $HOOK_NAME = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Implementare logica di fetch
      
      setData(null); // Sostituire con dati reali
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};
EOF

echo "✅ Hook $HOOK_NAME creato in $HOOK_FILE"
echo "📝 Implementare la logica di fetch nel TODO"
```

### 6. **Genera Pagina**
```bash
#!/bin/bash
# scripts/generate-page.sh

PAGE_NAME=$1
if [ -z "$PAGE_NAME" ]; then
    echo "❌ Usage: ./scripts/generate-page.sh PageName"
    exit 1
fi

PAGE_DIR="src/pages"
PAGE_FILE="$PAGE_DIR/${PAGE_NAME}Page.tsx"

# Template pagina
cat > "$PAGE_FILE" << EOF
import React from 'react';

const ${PAGE_NAME}Page: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 to-red-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">$PAGE_NAME</h1>
        
        <div className="bg-red-900/20 rounded-lg p-6 border border-red-800/30">
          {/* Contenuto pagina */}
          <p className="text-red-200">
            Contenuto della pagina $PAGE_NAME
          </p>
        </div>
      </div>
    </div>
  );
};

export default ${PAGE_NAME}Page;
EOF

echo "✅ Pagina ${PAGE_NAME}Page creata in $PAGE_FILE"
echo "📝 Aggiungere la route in App.tsx"
```

## 🧹 Script Manutenzione

### 7. **Cleanup Development**
```bash
#!/bin/bash
# scripts/cleanup-dev.sh

echo "🧹 PULIZIA AMBIENTE SVILUPPO"
echo "============================"

# Pulisci cache Node
echo "📦 Pulisco cache npm..."
npm cache clean --force

# Rimuovi node_modules e reinstalla
echo "🗑️ Rimuovo node_modules..."
rm -rf node_modules package-lock.json

echo "📥 Reinstallo dipendenze..."
npm install

# Pulisci build artifacts
echo "🏗️ Pulisco build artifacts..."
rm -rf dist/ .vite/

# Pulisci log files
echo "📝 Pulisco log files..."
find . -name "*.log" -type f -delete

echo "✅ Cleanup completato!"
echo "🚀 Pronto per riavviare: npm run dev"
```

### 8. **Backup Essentials**
```bash
#!/bin/bash
# scripts/backup-essentials.sh

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "💾 BACKUP ESSENTIALS WINENODE"
echo "============================="

# Backup configurazioni
echo "⚙️ Backup configurazioni..."
cp package.json vite.config.ts tsconfig.json "$BACKUP_DIR/"

# Backup schema e script SQL
echo "🗄️ Backup database schema..."
cp -r *.sql "$BACKUP_DIR/" 2>/dev/null || true

# Backup environment template
echo "🔐 Backup environment template..."
if [ -f ".env.example" ]; then
    cp .env.example "$BACKUP_DIR/"
fi

# Backup documentazione
echo "📚 Backup documentazione..."
cp -r DOCS/ "$BACKUP_DIR/" 2>/dev/null || true

echo "✅ Backup salvato in: $BACKUP_DIR"
echo "📁 Contenuto:"
ls -la "$BACKUP_DIR"
```

## 🚀 Script di Deployment

### 9. **Pre-Deploy Check**
```bash
#!/bin/bash
# scripts/pre-deploy.sh

echo "🚀 PRE-DEPLOY CHECKLIST"
echo "======================"

# Build test
echo "🏗️ Test build..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build fallito"
    exit 1
fi

# TypeScript check
echo "📝 TypeScript check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo "❌ Errori TypeScript"
    exit 1
fi

# Environment check
echo "🔐 Environment check..."
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Variabili ambiente mancanti"
    exit 1
fi

echo "✅ Pre-deploy check completato!"
echo "🚀 Ready to deploy!"
```

## 📋 Quick Reference

### Esecuzione Script
```bash
# Rendi eseguibili
chmod +x scripts/*.sh

# Esegui
./scripts/monitor-sizes.sh
./scripts/check-config.sh
./scripts/db-health.sh
```

### Template Usage
```bash
# Nuovo componente
./scripts/generate-component.sh WineSelector

# Nuovo hook
./scripts/generate-hook.sh useWineFilters

# Nuova pagina
./scripts/generate-page.sh Analytics
```

---

💡 **Tip**: Aggiungi gli script al PATH per uso globale o crea alias in `~/.bashrc`

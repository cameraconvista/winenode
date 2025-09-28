# GUIDA ESECUZIONE MIGRAZIONI DATABASE

**Target**: Supabase PostgreSQL WineNode  
**Azioni**: SH-06 (Indici), SH-02 (Enum), SH-03 (Constraints)  
**Rischio**: MEDIO - Richiede accesso amministrativo

---

## 🚨 PRE-REQUISITI OBBLIGATORI

### Accesso Database
- [ ] Console Supabase con privilegi amministratore
- [ ] Oppure connessione psql diretta: `psql -h [HOST] -U [USER] -d [DATABASE]`
- [ ] Verifica connessione: `SELECT version();`

### Backup Sicurezza
```bash
# Schema + Dati completi
pg_dump -h [HOST] -U [USER] -d [DATABASE] > db_backup_full_20250928_0141.sql

# Solo schema (per rollback veloce)
pg_dump -h [HOST] -U [USER] -d [DATABASE] --schema-only > db_backup_schema_20250928_0141.sql
```

### Verifica Stato Attuale
```sql
-- Conta record totali
SELECT COUNT(*) FROM wines;

-- Verifica valori type esistenti
SELECT type, COUNT(*) FROM wines GROUP BY type;

-- Verifica dati potenzialmente problematici
SELECT COUNT(*) FROM wines WHERE price::numeric <= 0 OR inventory < 0 OR min_stock < 0;
```

---

## 📋 SEQUENZA ESECUZIONE

### STEP 1: SH-06 - Indici Performance

**Tempo stimato**: 2-5 minuti  
**Rischio**: BASSO (operazione non bloccante)

```sql
-- Crea indici in modalità CONCURRENTLY (non blocca tabella)
CREATE INDEX CONCURRENTLY idx_wines_supplier ON wines(supplier);
CREATE INDEX CONCURRENTLY idx_wines_type ON wines(type);
CREATE INDEX CONCURRENTLY idx_wines_user_id ON wines(user_id);

-- Verifica creazione
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'wines' AND indexname LIKE 'idx_wines_%';
```

**✅ Verifica successo**: 3 indici creati  
**❌ Rollback**: `DROP INDEX CONCURRENTLY idx_wines_[nome];`

---

### STEP 2: SH-02 - Enum Wine Type

**Tempo stimato**: 1-3 minuti  
**Rischio**: MEDIO (modifica schema)

#### 2.1 Verifica Prerequisiti
```sql
-- CRITICO: Verifica che tutti i valori siano conformi
SELECT DISTINCT type FROM wines WHERE type NOT IN ('rosso', 'bianco', 'bollicine', 'rosato');
```

**⚠️ SE LA QUERY RESTITUISCE RIGHE**: STOP! Documenta i valori non conformi e richiedi approvazione per la correzione.

#### 2.2 Esecuzione Migrazione
```sql
BEGIN;
  -- Crea enum
  CREATE TYPE wine_type AS ENUM ('rosso', 'bianco', 'bollicine', 'rosato');
  
  -- Aggiungi colonna temporanea
  ALTER TABLE wines ADD COLUMN type_new wine_type;
  
  -- Migra dati
  UPDATE wines SET type_new = type::wine_type;
  
  -- Verifica migrazione completa
  SELECT COUNT(*) as total FROM wines;
  SELECT COUNT(*) as migrated FROM wines WHERE type_new IS NOT NULL;
  -- I due conteggi DEVONO essere uguali
  
  -- Sostituisci colonna
  ALTER TABLE wines DROP COLUMN type;
  ALTER TABLE wines RENAME COLUMN type_new TO type;
  ALTER TABLE wines ALTER COLUMN type SET NOT NULL;
COMMIT;
```

**✅ Verifica successo**: `\d wines` mostra `type | wine_type | not null`  
**❌ Rollback**: Ripristina backup o esegui script rollback

---

### STEP 3: SH-03 - Check Constraints

**Tempo stimato**: 1-2 minuti  
**Rischio**: MEDIO (può fallire con dati non conformi)

#### 3.1 Verifica Prerequisiti
```sql
-- Identifica record problematici
SELECT id, name, price, inventory, min_stock 
FROM wines 
WHERE price::numeric <= 0 OR inventory < 0 OR min_stock < 0;
```

**⚠️ SE LA QUERY RESTITUISCE RIGHE**: STOP! Documenta i record e richiedi approvazione per la correzione.

#### 3.2 Esecuzione Constraints
```sql
-- Aggiungi constraints uno alla volta
ALTER TABLE wines ADD CONSTRAINT chk_wines_price_positive 
CHECK (price::numeric > 0);

ALTER TABLE wines ADD CONSTRAINT chk_wines_inventory_non_negative 
CHECK (inventory >= 0);

ALTER TABLE wines ADD CONSTRAINT chk_wines_min_stock_non_negative 
CHECK (min_stock >= 0);
```

**✅ Verifica successo**: 
```sql
SELECT conname FROM pg_constraint WHERE conrelid = 'wines'::regclass AND contype = 'c';
```

**❌ Rollback**: `ALTER TABLE wines DROP CONSTRAINT [nome_constraint];`

---

## 🧪 POST-CHECK OBBLIGATORI

### Test Database
```sql
-- Test inserimento valido (deve riuscire)
INSERT INTO wines (name, type, supplier, inventory, min_stock, price, user_id) 
VALUES ('Test Valid', 'rosso', 'Test Supplier', 10, 2, '15.99', '00000000-0000-0000-0000-000000000001');

-- Test inserimento non valido (deve fallire)
INSERT INTO wines (name, type, supplier, inventory, min_stock, price, user_id) 
VALUES ('Test Invalid', 'rosso', 'Test Supplier', -1, -1, '-10.00', '00000000-0000-0000-0000-000000000001');

-- Pulizia
DELETE FROM wines WHERE name LIKE 'Test %';
```

### Test Applicazione
```bash
# Test build
npm run typecheck
npm run build

# Test server (se locale)
curl http://localhost:3001/api/health
curl http://localhost:3001/api/wines
```

---

## 🚨 GESTIONE EMERGENZE

### Dati Non Conformi Trovati

**SH-02 - Valori type non validi:**
```sql
-- Mostra record problematici
SELECT id, name, type FROM wines WHERE type NOT IN ('rosso', 'bianco', 'bollicine', 'rosato');

-- Opzioni correzione (SOLO con approvazione):
-- 1. Mappatura: 'red' → 'rosso', 'white' → 'bianco'
-- 2. Default: valori sconosciuti → 'rosso'
-- 3. Eliminazione: record con type NULL o invalido
```

**SH-03 - Valori numerici non validi:**
```sql
-- Mostra record problematici
SELECT id, name, price, inventory, min_stock FROM wines 
WHERE price::numeric <= 0 OR inventory < 0 OR min_stock < 0;

-- Opzioni correzione (SOLO con approvazione):
-- 1. Fix price: price <= 0 → '1.00'
-- 2. Fix inventory: inventory < 0 → 0
-- 3. Fix min_stock: min_stock < 0 → 0
```

### Rollback Completo
```sql
-- Rimuovi tutto in ordine inverso
ALTER TABLE wines DROP CONSTRAINT IF EXISTS chk_wines_price_positive;
ALTER TABLE wines DROP CONSTRAINT IF EXISTS chk_wines_inventory_non_negative;
ALTER TABLE wines DROP CONSTRAINT IF EXISTS chk_wines_min_stock_non_negative;

ALTER TABLE wines ALTER COLUMN type TYPE varchar(20);
DROP TYPE IF EXISTS wine_type;

DROP INDEX CONCURRENTLY IF EXISTS idx_wines_supplier;
DROP INDEX CONCURRENTLY IF EXISTS idx_wines_type;
DROP INDEX CONCURRENTLY IF EXISTS idx_wines_user_id;
```

---

## 📝 DOCUMENTAZIONE FINALE

Dopo l'esecuzione, aggiorna:
1. **DOCS/LOG_DB_MIGRATIONS.txt** con risultati effettivi
2. **DOCS/REPORT_ULTIMA_MODIFICA.md** sezione migrazioni
3. **shared/schemas/wines.schema.ts** commenti se necessario

---

**⚠️ IMPORTANTE**: Questa guida richiede esecuzione manuale da parte di un amministratore database con accesso diretto a Supabase.

-- =====================================================
-- WINENODE DATABASE MIGRATIONS
-- Data: 28/09/2025 01:56 (Aggiornato con PRE-CHECK)
-- Ambito: SH-06, SH-02, SH-03 (Indici, Enum, Constraints)
-- =====================================================

-- BACKUP COMANDO (eseguire prima delle migrazioni)
-- pg_dump -h [HOST] -U [USER] -d [DATABASE] --schema-only > db_backup_schema_20250928_0156.sql
-- pg_dump -h [HOST] -U [USER] -d [DATABASE] --data-only > db_backup_data_20250928_0156.sql

-- =====================================================
-- SEZIONE PRE-CHECK (READ-ONLY) - ESEGUIRE PRIMA DI TUTTO
-- =====================================================

-- Verifica generale stato database
SELECT 
  'Database Info' as check_type,
  current_database() as database_name,
  current_user as current_user,
  version() as postgres_version;

-- Verifica esistenza tabella wines
SELECT 
  'Table Check' as check_type,
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename = 'wines';

-- Cardinalità generale tabella wines
SELECT 
  'Wines Count' as check_type,
  COUNT(*) as total_wines,
  COUNT(DISTINCT supplier) as unique_suppliers,
  COUNT(DISTINCT type) as unique_types,
  COUNT(DISTINCT user_id) as unique_users
FROM wines;

-- Analisi valori wine.type (per SH-02 enum)
SELECT 
  'Wine Types Analysis' as check_type,
  type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM wines 
GROUP BY type 
ORDER BY count DESC;

-- Verifica valori type NON conformi a enum futuro
SELECT 
  'Non-Conforming Types' as check_type,
  type,
  COUNT(*) as count
FROM wines 
WHERE type NOT IN ('rosso', 'bianco', 'bollicine', 'rosato')
GROUP BY type
ORDER BY count DESC;

-- ⚠️ SE LA QUERY SOPRA RESTITUISCE RIGHE: STOP E DOCUMENTA

-- Analisi valori numerici (per SH-03 constraints)
SELECT 
  'Numeric Analysis' as check_type,
  'price' as field,
  MIN(price::numeric) as min_value,
  MAX(price::numeric) as max_value,
  AVG(price::numeric) as avg_value,
  COUNT(CASE WHEN price::numeric <= 0 THEN 1 END) as invalid_count
FROM wines
UNION ALL
SELECT 
  'Numeric Analysis' as check_type,
  'inventory' as field,
  MIN(inventory) as min_value,
  MAX(inventory) as max_value,
  AVG(inventory) as avg_value,
  COUNT(CASE WHEN inventory < 0 THEN 1 END) as invalid_count
FROM wines
UNION ALL
SELECT 
  'Numeric Analysis' as check_type,
  'min_stock' as field,
  MIN(min_stock) as min_value,
  MAX(min_stock) as max_value,
  AVG(min_stock) as avg_value,
  COUNT(CASE WHEN min_stock < 0 THEN 1 END) as invalid_count
FROM wines;

-- Record specifici NON conformi a future constraints
SELECT 
  'Invalid Records' as check_type,
  id,
  name,
  price,
  inventory,
  min_stock,
  CASE 
    WHEN price::numeric <= 0 THEN 'price <= 0'
    WHEN inventory < 0 THEN 'inventory < 0'  
    WHEN min_stock < 0 THEN 'min_stock < 0'
  END as violation_type
FROM wines 
WHERE price::numeric <= 0 OR inventory < 0 OR min_stock < 0
ORDER BY id;

-- ⚠️ SE LA QUERY SOPRA RESTITUISCE RIGHE: STOP E DOCUMENTA

-- Verifica indici esistenti (per SH-06)
SELECT 
  'Existing Indices' as check_type,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'wines'
ORDER BY indexname;

-- Verifica performance query senza indici (sample)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM wines WHERE supplier = 'Test Supplier' LIMIT 10;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM wines WHERE type = 'rosso' LIMIT 10;

-- Verifica google_sheet_links
SELECT 
  'GoogleSheetLinks Count' as check_type,
  COUNT(*) as total_links,
  COUNT(DISTINCT user_id) as unique_users
FROM google_sheet_links;

-- Riepilogo pre-check
SELECT 
  'Pre-Check Summary' as check_type,
  CASE 
    WHEN EXISTS(SELECT 1 FROM wines WHERE type NOT IN ('rosso', 'bianco', 'bollicine', 'rosato')) 
    THEN 'FAIL: Non-conforming wine types found'
    WHEN EXISTS(SELECT 1 FROM wines WHERE price::numeric <= 0 OR inventory < 0 OR min_stock < 0)
    THEN 'FAIL: Invalid numeric values found'
    ELSE 'PASS: All data ready for migrations'
  END as status,
  NOW() as check_timestamp;

-- =====================================================
-- FINE SEZIONE PRE-CHECK (READ-ONLY)
-- =====================================================

-- =====================================================
-- SH-06: INDICI PERFORMANCE
-- =====================================================

-- Verifica indici esistenti
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'wines' 
ORDER BY indexname;

-- Crea indici per performance query
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wines_supplier 
ON wines(supplier);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wines_type 
ON wines(type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wines_user_id 
ON wines(user_id);

-- Verifica creazione indici
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'wines' AND indexname LIKE 'idx_wines_%'
ORDER BY indexname;

-- Test performance (opzionale)
EXPLAIN ANALYZE SELECT * FROM wines WHERE supplier = 'Fornitore Test';
EXPLAIN ANALYZE SELECT * FROM wines WHERE type = 'rosso';
EXPLAIN ANALYZE SELECT * FROM wines WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- =====================================================
-- SH-02: ENUM WINE_TYPE
-- =====================================================

-- Verifica valori esistenti nella colonna type
SELECT type, COUNT(*) as count 
FROM wines 
GROUP BY type 
ORDER BY count DESC;

-- Crea enum type
CREATE TYPE wine_type AS ENUM ('rosso', 'bianco', 'bollicine', 'rosato');

-- Verifica che tutti i valori esistenti siano conformi
SELECT DISTINCT type 
FROM wines 
WHERE type NOT IN ('rosso', 'bianco', 'bollicine', 'rosato');

-- ⚠️ SE LA QUERY SOPRA RESTITUISCE RIGHE: STOP E DOCUMENTA

-- Migra colonna a enum (solo se tutti i valori sono conformi)
BEGIN;
  -- Aggiungi colonna temporanea
  ALTER TABLE wines ADD COLUMN type_new wine_type;
  
  -- Migra dati
  UPDATE wines SET type_new = type::wine_type;
  
  -- Verifica migrazione
  SELECT COUNT(*) as total_rows FROM wines;
  SELECT COUNT(*) as migrated_rows FROM wines WHERE type_new IS NOT NULL;
  
  -- Se tutto OK, sostituisci colonna
  ALTER TABLE wines DROP COLUMN type;
  ALTER TABLE wines RENAME COLUMN type_new TO type;
  
  -- Aggiungi NOT NULL constraint
  ALTER TABLE wines ALTER COLUMN type SET NOT NULL;
COMMIT;

-- Verifica finale enum
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'wines' AND column_name = 'type';

-- =====================================================
-- SH-03: CHECK CONSTRAINTS
-- =====================================================

-- Verifica dati esistenti per price
SELECT COUNT(*) as total_rows FROM wines;
SELECT COUNT(*) as invalid_price FROM wines WHERE price::numeric <= 0;

-- Verifica dati esistenti per inventory
SELECT COUNT(*) as invalid_inventory FROM wines WHERE inventory < 0;

-- Verifica dati esistenti per minStock
SELECT COUNT(*) as invalid_min_stock FROM wines WHERE min_stock < 0;

-- ⚠️ SE QUALCHE COUNT > 0: STOP E DOCUMENTA I RECORD NON CONFORMI

-- Mostra record non conformi (se esistenti)
SELECT id, name, price, inventory, min_stock 
FROM wines 
WHERE price::numeric <= 0 OR inventory < 0 OR min_stock < 0;

-- Aggiungi check constraints (solo se tutti i dati sono conformi)
ALTER TABLE wines ADD CONSTRAINT chk_wines_price_positive 
CHECK (price::numeric > 0);

ALTER TABLE wines ADD CONSTRAINT chk_wines_inventory_non_negative 
CHECK (inventory >= 0);

ALTER TABLE wines ADD CONSTRAINT chk_wines_min_stock_non_negative 
CHECK (min_stock >= 0);

-- Verifica constraints creati
SELECT conname, contype, consrc 
FROM pg_constraint 
WHERE conrelid = 'wines'::regclass AND contype = 'c';

-- =====================================================
-- POST-CHECK VERIFICA
-- =====================================================

-- Test inserimento con valori validi
INSERT INTO wines (name, type, supplier, inventory, min_stock, price, user_id) 
VALUES ('Test Wine', 'rosso', 'Test Supplier', 10, 2, '15.99', '00000000-0000-0000-0000-000000000001');

-- Test inserimento con valori non validi (deve fallire)
-- INSERT INTO wines (name, type, supplier, inventory, min_stock, price, user_id) 
-- VALUES ('Invalid Wine', 'rosso', 'Test Supplier', -1, -1, '-10.00', '00000000-0000-0000-0000-000000000001');

-- Pulizia test
DELETE FROM wines WHERE name = 'Test Wine';

-- Verifica finale struttura
\d wines;

-- =====================================================
-- ROLLBACK SCRIPTS (in caso di problemi)
-- =====================================================

-- Rollback SH-06 (rimuovi indici)
-- DROP INDEX CONCURRENTLY IF EXISTS idx_wines_supplier;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_wines_type;
-- DROP INDEX CONCURRENTLY IF EXISTS idx_wines_user_id;

-- Rollback SH-02 (torna a varchar)
-- ALTER TABLE wines ALTER COLUMN type TYPE varchar(20);
-- DROP TYPE IF EXISTS wine_type;

-- Rollback SH-03 (rimuovi constraints)
-- ALTER TABLE wines DROP CONSTRAINT IF EXISTS chk_wines_price_positive;
-- ALTER TABLE wines DROP CONSTRAINT IF EXISTS chk_wines_inventory_non_negative;
-- ALTER TABLE wines DROP CONSTRAINT IF EXISTS chk_wines_min_stock_non_negative;

-- =====================================================
-- FINE SCRIPT
-- =====================================================

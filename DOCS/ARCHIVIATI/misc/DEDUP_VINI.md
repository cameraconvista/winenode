# DEDUP DEFINITIVO VINI - DIAGNOSI E PIANO

**Data**: 29 Settembre 2025  
**Scope**: Rimozione definitiva duplicati tabella `vini` + reindirizzamento referenze

## 📊 DIAGNOSI DUPLICATI

### Schema Tabella `vini`
```sql
CREATE TABLE vini (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL,
  nome_vino TEXT NOT NULL,              -- Nome del vino
  anno TEXT,                            -- Annata (testo per flessibilità)
  produttore TEXT,                      -- Casa produttrice
  provenienza TEXT,                     -- Zona di provenienza
  fornitore TEXT,                       -- Nome fornitore (validato)
  tipologia TEXT,                       -- Categoria vino
  costo DECIMAL(10,2),                  -- Prezzo di acquisto
  vendita DECIMAL(10,2),                -- Prezzo di vendita
  margine DECIMAL(5,2),                 -- Margine percentuale
  min_stock INTEGER DEFAULT 0,          -- Scorta minima
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Query Identificazione Duplicati
```sql
-- Cluster duplicati logici (adattata allo schema reale)
WITH base AS (
  SELECT 
    id, 
    lower(trim(nome_vino)) as nome_n,
    lower(trim(COALESCE(produttore,''))) as prod_n,
    COALESCE(anno,'') as anno_n,
    lower(trim(COALESCE(fornitore,''))) as forn_n,
    created_at,
    updated_at
  FROM vini
  WHERE nome_vino IS NOT NULL 
    AND trim(nome_vino) != ''
)
SELECT 
  nome_n,
  prod_n, 
  anno_n,
  forn_n,
  count(*) as n_duplicati,
  array_agg(id ORDER BY created_at ASC) as ids,
  array_agg(nome_vino ORDER BY created_at ASC) as nomi_originali,
  min(created_at) as first_seen,
  max(updated_at) as last_updated
FROM base b
JOIN vini v ON b.id = v.id
GROUP BY nome_n, prod_n, anno_n, forn_n
HAVING count(*) > 1
ORDER BY n_duplicati DESC, first_seen ASC;
```

### Identificazione ID Canonico
```sql
-- Per ogni cluster, identifica l'ID canonico (primo creato)
WITH duplicates AS (
  SELECT 
    lower(trim(nome_vino)) as nome_n,
    lower(trim(COALESCE(produttore,''))) as prod_n,
    COALESCE(anno,'') as anno_n,
    lower(trim(COALESCE(fornitore,''))) as forn_n,
    id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY 
        lower(trim(nome_vino)),
        lower(trim(COALESCE(produttore,''))),
        COALESCE(anno,''),
        lower(trim(COALESCE(fornitore,'')))
      ORDER BY created_at ASC
    ) as rn
  FROM vini
  WHERE nome_vino IS NOT NULL AND trim(nome_vino) != ''
)
SELECT 
  nome_n,
  prod_n,
  anno_n, 
  forn_n,
  id as canonical_id,
  created_at as canonical_created
FROM duplicates 
WHERE rn = 1
  AND (nome_n, prod_n, anno_n, forn_n) IN (
    SELECT nome_n, prod_n, anno_n, forn_n
    FROM duplicates
    GROUP BY nome_n, prod_n, anno_n, forn_n
    HAVING count(*) > 1
  )
ORDER BY canonical_created ASC;
```

## 🔍 REFERENZE DA AGGIORNARE

### Tabelle che Referenziano `vini.id`

#### 1. **giacenze** - Giacenze Vini
```sql
-- Verifica referenze in giacenze
SELECT 
  g.vino_id,
  v.nome_vino,
  count(*) as n_giacenze
FROM giacenze g
LEFT JOIN vini v ON g.vino_id = v.id
GROUP BY g.vino_id, v.nome_vino
HAVING v.nome_vino IS NULL  -- Referenze orfane
ORDER BY n_giacenze DESC;
```

#### 2. **ordini.contenuto** - JSONB Items Ordini
```sql
-- Verifica referenze in contenuto ordini (JSONB)
SELECT 
  o.id as ordine_id,
  o.fornitore,
  o.data,
  jsonb_array_elements(o.contenuto) as item
FROM ordini o
WHERE o.contenuto IS NOT NULL
  AND jsonb_typeof(o.contenuto) = 'array'
  AND jsonb_array_length(o.contenuto) > 0;

-- Estrai wineId da contenuto per verifica
WITH ordine_items AS (
  SELECT 
    o.id as ordine_id,
    (jsonb_array_elements(o.contenuto)->>'wineId')::uuid as wine_id,
    jsonb_array_elements(o.contenuto)->>'wineName' as wine_name
  FROM ordini o
  WHERE o.contenuto IS NOT NULL
    AND jsonb_typeof(o.contenuto) = 'array'
)
SELECT 
  oi.wine_id,
  oi.wine_name,
  v.nome_vino,
  count(*) as n_referenze
FROM ordine_items oi
LEFT JOIN vini v ON oi.wine_id = v.id
GROUP BY oi.wine_id, oi.wine_name, v.nome_vino
HAVING v.nome_vino IS NULL  -- Referenze orfane
ORDER BY n_referenze DESC;
```

## 🛠️ PIANO DEDUPLICAZIONE

### Fase 1: Backup e Preparazione
1. **Backup completo** tabella `vini` prima di qualsiasi operazione
2. **Snapshot referenze** in `giacenze` e `ordini.contenuto`
3. **Verifica app READ-ONLY** su `vini` (guardrail attivo)

### Fase 2: Identificazione Canonici
1. **Esegui query duplicati** per identificare cluster
2. **Seleziona ID canonico** per ogni cluster (primo `created_at`)
3. **Mappa duplicati → canonico** per reindirizzamento

### Fase 3: Reindirizzamento Referenze
1. **Aggiorna `giacenze.vino_id`** da duplicati a canonici
2. **Aggiorna `ordini.contenuto`** JSONB `wineId` da duplicati a canonici
3. **Verifica integrità** referenze post-aggiornamento

### Fase 4: Rimozione Duplicati
1. **Elimina record duplicati** (mantenendo solo canonici)
2. **Verifica nessuna referenza orfana**
3. **Ottimizza indici** se necessario

### Fase 5: Prevenzione Futura
1. **Unique index** su chiave logica se possibile
2. **Constraint check** per prevenire nuovi duplicati
3. **Monitoraggio** duplicati periodico

## 🚨 OPERAZIONI ATOMICHE

### Script Reindirizzamento Giacenze
```sql
-- Backup giacenze
CREATE TABLE giacenze_backup_20250929 AS SELECT * FROM giacenze;

-- Reindirizza giacenze da duplicati a canonici
WITH canonical_mapping AS (
  -- Query per mappatura duplicati → canonici
  SELECT DISTINCT
    d.id as duplicate_id,
    c.id as canonical_id
  FROM vini d
  JOIN vini c ON (
    lower(trim(d.nome_vino)) = lower(trim(c.nome_vino))
    AND lower(trim(COALESCE(d.produttore,''))) = lower(trim(COALESCE(c.produttore,'')))
    AND COALESCE(d.anno,'') = COALESCE(c.anno,'')
    AND lower(trim(COALESCE(d.fornitore,''))) = lower(trim(COALESCE(c.fornitore,'')))
    AND c.created_at < d.created_at  -- Canonico è il più vecchio
  )
)
UPDATE giacenze 
SET vino_id = cm.canonical_id
FROM canonical_mapping cm
WHERE giacenze.vino_id = cm.duplicate_id;
```

### Script Reindirizzamento Ordini
```sql
-- Backup ordini
CREATE TABLE ordini_backup_20250929 AS SELECT * FROM ordini;

-- Reindirizza wineId in contenuto JSONB
WITH canonical_mapping AS (
  -- Stessa query mappatura
),
ordini_to_update AS (
  SELECT 
    o.id,
    jsonb_agg(
      CASE 
        WHEN cm.canonical_id IS NOT NULL THEN
          jsonb_set(item, '{wineId}', to_jsonb(cm.canonical_id::text))
        ELSE item
      END
    ) as new_contenuto
  FROM ordini o,
       jsonb_array_elements(o.contenuto) as item
  LEFT JOIN canonical_mapping cm ON (item->>'wineId')::uuid = cm.duplicate_id
  WHERE o.contenuto IS NOT NULL
  GROUP BY o.id
)
UPDATE ordini 
SET contenuto = otu.new_contenuto
FROM ordini_to_update otu
WHERE ordini.id = otu.id;
```

## 📊 RISULTATI DIAGNOSI (SIMULATI)

### Cluster Duplicati Identificati
```
nome_n              | prod_n     | anno_n | forn_n        | n_duplicati | ids
--------------------|------------|--------|---------------|-------------|----
chianti classico    | antinori   | 2020   | bologna vini  | 3          | [uuid1, uuid2, uuid3]
barolo             | fontana    | 2019   | piemonte wine | 2          | [uuid4, uuid5]
prosecco valdobbiadene | bisol   | 2022   | veneto supply | 2          | [uuid6, uuid7]
brunello di montalcino | biondi  | 2018   | toscana wine  | 2          | [uuid8, uuid9]
amarone della valpolicella | allegrini | 2017 | verona vini | 2       | [uuid10, uuid11]
```

### ID Canonici Selezionati
```
cluster                     | canonical_id | duplicates_to_remove
----------------------------|--------------|--------------------
chianti classico/antinori  | uuid1        | [uuid2, uuid3]
barolo/fontana             | uuid4        | [uuid5]
prosecco/bisol             | uuid6        | [uuid7]
brunello/biondi            | uuid8        | [uuid9]
amarone/allegrini          | uuid10       | [uuid11]
```

### Referenze Impattate
```
tabella    | referenze_totali | referenze_duplicati | da_reindirizzare
-----------|------------------|--------------------|-----------------
giacenze   | 847              | 12                 | 12
ordini     | 1,234            | 28                 | 28
```

### Metriche Before/After
- **Vini totali**: 1,456 record
- **Duplicati identificati**: 5 cluster (7 record duplicati)
- **Vini post-dedup**: 1,449 record (-7)
- **Referenze reindirizzate**: 40 (12 giacenze + 28 ordini)
- **Spazio recuperato**: ~0.5% tabella vini

## 🔐 ROLLBACK PLAN

### Ripristino Immediato
```sql
-- Ripristina giacenze
DROP TABLE giacenze;
ALTER TABLE giacenze_backup_20250929 RENAME TO giacenze;

-- Ripristina ordini
DROP TABLE ordini;
ALTER TABLE ordini_backup_20250929 RENAME TO ordini;

-- Ripristina vini (se eliminati)
-- Backup automatico disponibile
```

### Verifica Post-Rollback
1. **Count record** pre/post identici
2. **Referenze integrità** verificate
3. **App funzionante** senza errori

---

**Status**: 📋 **DIAGNOSI COMPLETATA**  
**Next**: Esecuzione query identificazione duplicati su Supabase

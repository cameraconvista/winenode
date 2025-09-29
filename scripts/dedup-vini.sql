-- =====================================================
-- SCRIPT DEDUPLICAZIONE VINI - WINENODE
-- Data: 29 Settembre 2025
-- Scope: Rimozione duplicati + reindirizzamento referenze
-- =====================================================

-- IMPORTANTE: Eseguire in transazione per rollback sicuro
BEGIN;

-- =====================================================
-- FASE 1: BACKUP TABELLE
-- =====================================================

-- Backup vini
CREATE TABLE vini_backup_20250929 AS SELECT * FROM vini;

-- Backup giacenze  
CREATE TABLE giacenze_backup_20250929 AS SELECT * FROM giacenze;

-- Backup ordini
CREATE TABLE ordini_backup_20250929 AS SELECT * FROM ordini;

-- Verifica backup
SELECT 
  'vini' as tabella, count(*) as record_backup FROM vini_backup_20250929
UNION ALL
SELECT 
  'giacenze' as tabella, count(*) as record_backup FROM giacenze_backup_20250929  
UNION ALL
SELECT
  'ordini' as tabella, count(*) as record_backup FROM ordini_backup_20250929;

-- =====================================================
-- FASE 2: IDENTIFICAZIONE DUPLICATI
-- =====================================================

-- Vista duplicati con ID canonico
CREATE TEMPORARY VIEW duplicates_analysis AS
WITH base AS (
  SELECT 
    id, 
    lower(trim(nome_vino)) as nome_n,
    lower(trim(COALESCE(produttore,''))) as prod_n,
    COALESCE(anno,'') as anno_n,
    lower(trim(COALESCE(fornitore,''))) as forn_n,
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
  WHERE nome_vino IS NOT NULL 
    AND trim(nome_vino) != ''
),
clusters AS (
  SELECT 
    nome_n, prod_n, anno_n, forn_n,
    count(*) as cluster_size
  FROM base
  GROUP BY nome_n, prod_n, anno_n, forn_n
  HAVING count(*) > 1
)
SELECT 
  b.id,
  b.nome_n,
  b.prod_n, 
  b.anno_n,
  b.forn_n,
  b.rn,
  c.cluster_size,
  CASE WHEN b.rn = 1 THEN b.id ELSE NULL END as canonical_id,
  CASE WHEN b.rn > 1 THEN true ELSE false END as is_duplicate
FROM base b
JOIN clusters c ON (
  b.nome_n = c.nome_n AND 
  b.prod_n = c.prod_n AND 
  b.anno_n = c.anno_n AND 
  b.forn_n = c.forn_n
)
ORDER BY b.nome_n, b.prod_n, b.anno_n, b.forn_n, b.rn;

-- Report duplicati identificati
SELECT 
  nome_n || '/' || prod_n || '/' || anno_n as cluster_name,
  cluster_size,
  count(CASE WHEN is_duplicate THEN 1 END) as duplicates_to_remove,
  array_agg(id ORDER BY rn) as all_ids,
  array_agg(CASE WHEN NOT is_duplicate THEN id END) FILTER (WHERE NOT is_duplicate) as canonical_ids
FROM duplicates_analysis
GROUP BY nome_n, prod_n, anno_n, forn_n, cluster_size
ORDER BY cluster_size DESC;

-- =====================================================
-- FASE 3: MAPPATURA DUPLICATI → CANONICI
-- =====================================================

-- Tabella temporanea per mappatura
CREATE TEMPORARY TABLE canonical_mapping AS
WITH canonicals AS (
  SELECT DISTINCT
    nome_n, prod_n, anno_n, forn_n,
    id as canonical_id
  FROM duplicates_analysis 
  WHERE rn = 1
)
SELECT 
  d.id as duplicate_id,
  c.canonical_id
FROM duplicates_analysis d
JOIN canonicals c ON (
  d.nome_n = c.nome_n AND 
  d.prod_n = c.prod_n AND 
  d.anno_n = c.anno_n AND 
  d.forn_n = c.forn_n
)
WHERE d.is_duplicate = true;

-- Verifica mappatura
SELECT 
  count(*) as total_duplicates_to_redirect,
  count(DISTINCT canonical_id) as unique_canonicals
FROM canonical_mapping;

-- =====================================================
-- FASE 4: REINDIRIZZAMENTO GIACENZE
-- =====================================================

-- Aggiorna giacenze da duplicati a canonici
UPDATE giacenze 
SET vino_id = cm.canonical_id
FROM canonical_mapping cm
WHERE giacenze.vino_id = cm.duplicate_id;

-- Report giacenze aggiornate
SELECT 
  count(*) as giacenze_reindirizzate
FROM giacenze g
JOIN canonical_mapping cm ON g.vino_id = cm.canonical_id;

-- =====================================================
-- FASE 5: REINDIRIZZAMENTO ORDINI (JSONB)
-- =====================================================

-- Aggiorna wineId in contenuto JSONB degli ordini
WITH ordini_to_update AS (
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
    AND jsonb_typeof(o.contenuto) = 'array'
    AND jsonb_array_length(o.contenuto) > 0
  GROUP BY o.id
  HAVING bool_or(cm.canonical_id IS NOT NULL)  -- Solo ordini con duplicati
)
UPDATE ordini 
SET contenuto = otu.new_contenuto
FROM ordini_to_update otu
WHERE ordini.id = otu.id;

-- Report ordini aggiornati
WITH ordine_items AS (
  SELECT 
    o.id as ordine_id,
    (jsonb_array_elements(o.contenuto)->>'wineId')::uuid as wine_id
  FROM ordini o
  WHERE o.contenuto IS NOT NULL
    AND jsonb_typeof(o.contenuto) = 'array'
)
SELECT 
  count(DISTINCT oi.ordine_id) as ordini_con_referenze_reindirizzate,
  count(*) as items_reindirizzati
FROM ordine_items oi
JOIN canonical_mapping cm ON oi.wine_id = cm.canonical_id;

-- =====================================================
-- FASE 6: VERIFICA INTEGRITÀ PRE-ELIMINAZIONE
-- =====================================================

-- Verifica nessuna referenza orfana in giacenze
SELECT 
  count(*) as giacenze_orfane
FROM giacenze g
LEFT JOIN vini v ON g.vino_id = v.id
WHERE v.id IS NULL;

-- Verifica nessuna referenza orfana in ordini
WITH ordine_items AS (
  SELECT 
    (jsonb_array_elements(o.contenuto)->>'wineId')::uuid as wine_id
  FROM ordini o
  WHERE o.contenuto IS NOT NULL
    AND jsonb_typeof(o.contenuto) = 'array'
)
SELECT 
  count(*) as ordini_items_orfani
FROM ordine_items oi
LEFT JOIN vini v ON oi.wine_id = v.id
WHERE v.id IS NULL;

-- =====================================================
-- FASE 7: ELIMINAZIONE DUPLICATI
-- =====================================================

-- Elimina record duplicati (mantiene solo canonici)
DELETE FROM vini 
WHERE id IN (
  SELECT duplicate_id 
  FROM canonical_mapping
);

-- Report eliminazione
SELECT 
  (SELECT count(*) FROM vini_backup_20250929) as vini_before,
  (SELECT count(*) FROM vini) as vini_after,
  (SELECT count(*) FROM canonical_mapping) as duplicates_removed;

-- =====================================================
-- FASE 8: VERIFICA FINALE
-- =====================================================

-- Verifica nessun duplicato rimasto
WITH remaining_duplicates AS (
  SELECT 
    lower(trim(nome_vino)) as nome_n,
    lower(trim(COALESCE(produttore,''))) as prod_n,
    COALESCE(anno,'') as anno_n,
    lower(trim(COALESCE(fornitore,''))) as forn_n,
    count(*) as n
  FROM vini
  WHERE nome_vino IS NOT NULL AND trim(nome_vino) != ''
  GROUP BY 1,2,3,4
  HAVING count(*) > 1
)
SELECT 
  CASE 
    WHEN count(*) = 0 THEN 'SUCCESS: Nessun duplicato rimasto'
    ELSE 'ERROR: ' || count(*) || ' cluster duplicati ancora presenti'
  END as dedup_status
FROM remaining_duplicates;

-- Verifica integrità referenze
SELECT 
  'giacenze' as tabella,
  count(*) as total_referenze,
  count(v.id) as referenze_valide,
  count(*) - count(v.id) as referenze_orfane
FROM giacenze g
LEFT JOIN vini v ON g.vino_id = v.id
UNION ALL
SELECT 
  'ordini' as tabella,
  count(*) as total_referenze,
  count(v.id) as referenze_valide,
  count(*) - count(v.id) as referenze_orfane
FROM (
  SELECT (jsonb_array_elements(o.contenuto)->>'wineId')::uuid as wine_id
  FROM ordini o
  WHERE o.contenuto IS NOT NULL AND jsonb_typeof(o.contenuto) = 'array'
) oi
LEFT JOIN vini v ON oi.wine_id = v.id;

-- =====================================================
-- COMMIT O ROLLBACK
-- =====================================================

-- Se tutto OK, decommentare COMMIT; altrimenti ROLLBACK;
-- COMMIT;
ROLLBACK;  -- Default: rollback per sicurezza

-- =====================================================
-- CLEANUP BACKUP (SOLO DOPO VERIFICA SUCCESSO)
-- =====================================================

/*
-- Da eseguire SOLO dopo verifica successo completo
DROP TABLE vini_backup_20250929;
DROP TABLE giacenze_backup_20250929;
DROP TABLE ordini_backup_20250929;
*/

-- =====================================================
-- FINE SCRIPT
-- =====================================================

-- =====================================================
-- SCRIPT VERIFICA DEDUPLICAZIONE VINI
-- Data: 29 Settembre 2025
-- Scope: Verifica stato duplicati e integrità referenze
-- =====================================================

-- =====================================================
-- 1. ANALISI DUPLICATI CORRENTI
-- =====================================================

-- Cluster duplicati esistenti
WITH base AS (
  SELECT 
    id, 
    lower(trim(nome_vino)) as nome_n,
    lower(trim(COALESCE(produttore,''))) as prod_n,
    COALESCE(anno,'') as anno_n,
    lower(trim(COALESCE(fornitore,''))) as forn_n,
    created_at
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
  min(created_at) as first_seen,
  max(created_at) as last_seen
FROM base
GROUP BY nome_n, prod_n, anno_n, forn_n
HAVING count(*) > 1
ORDER BY n_duplicati DESC, first_seen ASC;

-- =====================================================
-- 2. STATISTICHE GENERALI
-- =====================================================

-- Conteggi tabelle principali
SELECT 
  'vini' as tabella, 
  count(*) as total_records,
  count(DISTINCT lower(trim(nome_vino))) as unique_names,
  count(DISTINCT lower(trim(COALESCE(produttore,'')))) as unique_producers
FROM vini
UNION ALL
SELECT 
  'giacenze' as tabella,
  count(*) as total_records,
  count(DISTINCT vino_id) as unique_wine_ids,
  NULL as unique_producers
FROM giacenze
UNION ALL
SELECT 
  'ordini' as tabella,
  count(*) as total_records,
  count(*) FILTER (WHERE contenuto IS NOT NULL) as with_contenuto,
  NULL as unique_producers
FROM ordini;

-- =====================================================
-- 3. VERIFICA INTEGRITÀ REFERENZE
-- =====================================================

-- Giacenze con referenze orfane
SELECT 
  'GIACENZE ORFANE' as check_type,
  count(*) as count_issues,
  array_agg(g.vino_id) FILTER (WHERE v.id IS NULL) as orphaned_ids
FROM giacenze g
LEFT JOIN vini v ON g.vino_id = v.id
WHERE v.id IS NULL;

-- Ordini con wineId orfani nel contenuto JSONB
WITH ordine_items AS (
  SELECT 
    o.id as ordine_id,
    (jsonb_array_elements(o.contenuto)->>'wineId')::uuid as wine_id,
    jsonb_array_elements(o.contenuto)->>'wineName' as wine_name
  FROM ordini o
  WHERE o.contenuto IS NOT NULL
    AND jsonb_typeof(o.contenuto) = 'array'
    AND jsonb_array_length(o.contenuto) > 0
)
SELECT 
  'ORDINI ITEMS ORFANI' as check_type,
  count(*) as count_issues,
  array_agg(DISTINCT oi.wine_id) FILTER (WHERE v.id IS NULL) as orphaned_wine_ids
FROM ordine_items oi
LEFT JOIN vini v ON oi.wine_id = v.id
WHERE v.id IS NULL;

-- =====================================================
-- 4. ANALISI IMPATTO DEDUPLICAZIONE
-- =====================================================

-- Stima referenze da reindirizzare
WITH duplicates AS (
  SELECT 
    id,
    lower(trim(nome_vino)) as nome_n,
    lower(trim(COALESCE(produttore,''))) as prod_n,
    COALESCE(anno,'') as anno_n,
    lower(trim(COALESCE(fornitore,''))) as forn_n,
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
),
duplicate_ids AS (
  SELECT id as duplicate_id
  FROM duplicates d1
  WHERE rn > 1
    AND EXISTS (
      SELECT 1 FROM duplicates d2 
      WHERE d2.nome_n = d1.nome_n 
        AND d2.prod_n = d1.prod_n 
        AND d2.anno_n = d1.anno_n 
        AND d2.forn_n = d1.forn_n 
        AND d2.rn = 1
    )
)
SELECT 
  'GIACENZE DA REINDIRIZZARE' as impact_type,
  count(*) as affected_records
FROM giacenze g
JOIN duplicate_ids di ON g.vino_id = di.duplicate_id
UNION ALL
SELECT 
  'ORDINI ITEMS DA REINDIRIZZARE' as impact_type,
  count(*) as affected_records
FROM (
  SELECT (jsonb_array_elements(o.contenuto)->>'wineId')::uuid as wine_id
  FROM ordini o
  WHERE o.contenuto IS NOT NULL AND jsonb_typeof(o.contenuto) = 'array'
) oi
JOIN duplicate_ids di ON oi.wine_id = di.duplicate_id;

-- =====================================================
-- 5. VERIFICA GUARDRAIL APP
-- =====================================================

-- Verifica che l'app non stia creando nuovi vini
-- (Controlla vini creati nelle ultime 24 ore)
SELECT 
  'VINI CREATI RECENTI' as check_type,
  count(*) as count_recent,
  array_agg(id) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as recent_ids,
  max(created_at) as last_created
FROM vini
WHERE created_at > NOW() - INTERVAL '7 days';

-- =====================================================
-- 6. REPORT RIEPILOGATIVO
-- =====================================================

WITH stats AS (
  SELECT 
    (SELECT count(*) FROM vini) as total_vini,
    (SELECT count(*) FROM giacenze) as total_giacenze,
    (SELECT count(*) FROM ordini WHERE contenuto IS NOT NULL) as total_ordini_with_items,
    (
      SELECT count(*)
      FROM (
        SELECT 
          lower(trim(nome_vino)),
          lower(trim(COALESCE(produttore,''))),
          COALESCE(anno,''),
          lower(trim(COALESCE(fornitore,'')))
        FROM vini
        WHERE nome_vino IS NOT NULL AND trim(nome_vino) != ''
        GROUP BY 1,2,3,4
        HAVING count(*) > 1
      ) duplicates
    ) as duplicate_clusters,
    (
      SELECT count(*)
      FROM vini v1
      WHERE EXISTS (
        SELECT 1 FROM vini v2
        WHERE v2.id != v1.id
          AND lower(trim(v2.nome_vino)) = lower(trim(v1.nome_vino))
          AND lower(trim(COALESCE(v2.produttore,''))) = lower(trim(COALESCE(v1.produttore,'')))
          AND COALESCE(v2.anno,'') = COALESCE(v1.anno,'')
          AND lower(trim(COALESCE(v2.fornitore,''))) = lower(trim(COALESCE(v1.fornitore,'')))
      )
    ) as duplicate_records
)
SELECT 
  'RIEPILOGO STATO DUPLICATI' as report_section,
  json_build_object(
    'vini_totali', total_vini,
    'giacenze_totali', total_giacenze,
    'ordini_con_items', total_ordini_with_items,
    'cluster_duplicati', duplicate_clusters,
    'record_duplicati', duplicate_records,
    'percentuale_duplicati', 
      CASE 
        WHEN total_vini > 0 THEN round((duplicate_records::decimal / total_vini * 100), 2)
        ELSE 0 
      END || '%'
  ) as statistics
FROM stats;

-- =====================================================
-- FINE VERIFICA
-- =====================================================

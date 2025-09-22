# 🗄️ WineNode - Documentazione Database

## 📋 Panoramica

WineNode utilizza **PostgreSQL** tramite **Supabase** come database principale. Il sistema è progettato per essere **multi-tenant** con Row Level Security (RLS) per garantire l'isolamento dei dati tra utenti.

## 🏗️ Architettura Database

### Schema Principale
- **Database**: PostgreSQL 15+ (Supabase)
- **Autenticazione**: Supabase Auth con RLS
- **Sicurezza**: Row Level Security su tutte le tabelle
- **Backup**: Automatico tramite Supabase + backup locali

## 📊 Tabelle Principali

### 1. `tipologie`
Gestisce le categorie di vini.

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | UUID | Chiave primaria |
| `nome` | TEXT | Nome tipologia (es. "ROSSI", "BIANCHI") |
| `colore` | TEXT | Colore per UI |
| `user_id` | UUID | Proprietario (FK auth.users) |

**Esempi**: ROSSI, BIANCHI, BOLLICINE ITALIANE, BOLLICINE FRANCESI, ROSATI, VINI DOLCI

### 2. `fornitori`
Anagrafica fornitori di vini.

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | UUID | Chiave primaria |
| `nome` | TEXT | Nome fornitore |
| `telefono` | TEXT | Contatto telefonico |
| `email` | TEXT | Email contatto |
| `min_ordine_importo` | NUMERIC | Importo minimo ordine |
| `user_id` | UUID | Proprietario (FK auth.users) |

### 3. `vini` ⭐ **Tabella Centrale**
Catalogo principale dei vini.

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | UUID | Chiave primaria |
| `nome_vino` | TEXT | Nome del vino |
| `anno` | TEXT | Annata (flessibile) |
| `produttore` | TEXT | Casa produttrice |
| `provenienza` | TEXT | Zona di provenienza |
| `fornitore` | UUID | FK a fornitori |
| `costo` | NUMERIC | Costo di acquisto |
| `vendita` | NUMERIC | Prezzo di vendita |
| `margine` | NUMERIC | Margine calcolato |
| `tipologia` | UUID | FK a tipologie |
| `min_stock` | INTEGER | Soglia minima giacenza |
| `user_id` | UUID | Proprietario (FK auth.users) |

### 4. `giacenza`
Gestione scorte (relazione 1:1 con vini).

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | UUID | Chiave primaria |
| `vino_id` | UUID | FK a vini (UNIQUE per user) |
| `giacenza` | INTEGER | Quantità disponibile |
| `user_id` | UUID | Proprietario (FK auth.users) |

**Constraint**: `UNIQUE (vino_id, user_id)` - Un solo record giacenza per vino per utente.

### 5. `ordini`
Sistema gestione ordini.

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | UUID | Chiave primaria |
| `fornitore` | UUID | FK a fornitori |
| `stato` | TEXT | sospeso, inviato, ricevuto, archiviato |
| `data` | TIMESTAMP | Data creazione |
| `contenuto` | JSONB | Dettagli ordine in JSON |
| `contenuto_ricevuto` | JSONB | Quantità ricevute |
| `totale` | NUMERIC | Totale ordine |
| `user_id` | UUID | Proprietario (FK auth.users) |

## 🔐 Sicurezza (Row Level Security)

### Principi RLS
- **Isolamento utenti**: Ogni utente vede solo i propri dati
- **Condivisione controllata**: Tipologie e fornitori leggibili da tutti
- **Sicurezza automatica**: RLS gestito da Supabase Auth

### Policy Implementate

#### Vini, Giacenze, Ordini
```sql
-- Solo dati propri
user_id = auth.uid()
```

#### Tipologie, Fornitori
```sql
-- Lettura pubblica, scrittura per proprietario
SELECT: true
INSERT/UPDATE/DELETE: user_id = auth.uid()
```

## 📈 Performance

### Indici Ottimizzati
- `idx_vini_user_id` - Filtro per utente
- `idx_vini_tipologia` - Filtro per categoria
- `idx_giacenza_vino_id` - Join vini-giacenze
- `idx_ordini_stato` - Filtro stato ordini

### Query Patterns
```sql
-- Vini con giacenze (query frequente)
SELECT v.*, g.giacenza 
FROM vini v 
LEFT JOIN giacenza g ON v.id = g.vino_id 
WHERE v.user_id = auth.uid();

-- Ordini per stato
SELECT * FROM ordini 
WHERE user_id = auth.uid() 
AND stato = 'inviato';
```

## 🔄 Evoluzione Schema

### Cronologia Versioni

| Data | File Origine | Descrizione |
|------|--------------|-------------|
| 2024-07-15 | `supabase-schema-final.sql` | Schema base con RLS |
| 2024-07-15 | `setup-giacenza-complete.sql` | Sistema giacenze separato |
| 2024-07-15 | `supabase-ordini-schema.sql` | Sistema ordini completo |
| 2024-07-16 | `add-missing-ordini-columns.sql` | Colonne ordini aggiuntive |
| 2024-07-16 | `fix-missing-colore-column.sql` | Colonna colore tipologie |
| 2025-09-22 | `SCHEMA_UNICO.sql` | **Schema consolidato** |

### Migrazioni Applicate
1. **Giacenze separate**: Da colonna in `vini` a tabella dedicata
2. **Ordini JSONB**: Contenuto ordini in formato JSON flessibile
3. **Colonna colore**: Aggiunta per UI tipologie
4. **Stato ordini**: Enum per workflow ordini
5. **Contenuto ricevuto**: Tracking quantità ricevute vs ordinate

## 🛠️ Setup e Manutenzione

### Setup Iniziale
1. Eseguire `SCHEMA_UNICO.sql` su database Supabase
2. Verificare RLS attivo su tutte le tabelle
3. Testare policy con utente di test
4. Popolare tipologie base se necessario

### Backup e Recovery
- **Backup automatico**: Supabase (point-in-time recovery)
- **Backup locali**: Sistema automatico ogni operazione critica
- **Export dati**: Via Supabase Dashboard o API

### Monitoring
- **Performance**: Query lente via Supabase Dashboard
- **Utilizzo**: Statistiche tabelle e indici
- **Errori**: Log RLS violations

## 🔧 Troubleshooting

### Problemi Comuni

#### RLS Violations
```
Error: new row violates row-level security policy
```
**Soluzione**: Verificare che `user_id = auth.uid()` nelle insert.

#### Constraint Violations
```
Error: duplicate key value violates unique constraint
```
**Soluzione**: Verificare UNIQUE constraints, specie su giacenze.

#### Performance Lente
**Soluzione**: Verificare indici, ottimizzare query con EXPLAIN.

## 📚 Riferimenti

### File Storici (Archiviati)
- `ARCHIVIATI/LEGACY/sql_schemas/` - Tutti i file SQL storici
- `supabase-schema-final.sql` - Schema base di riferimento
- `setup-giacenza-complete.sql` - Setup giacenze dettagliato

### Documentazione Esterna
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase API Reference](https://supabase.com/docs/reference/javascript)

---

**Nota**: Questo documento è stato generato durante le operazioni chirurgiche STEP 4 del 22/09/2025. Per modifiche al database, consultare sempre questo schema unificato come riferimento.

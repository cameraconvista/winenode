# REPORT DIAGNOSTICA QUERY - WINENODE

**Modulo:** Query Performance Diagnostics  
**File:** `server/utils/queryDiagnostics.ts`  
**Stato:** Disponibile (disattivo di default)  
**Data:** 28/09/2025 01:56

---

## 🎯 OBIETTIVO

Monitoraggio read-only delle performance delle 3 query più critiche per identificare quando eseguire le ottimizzazioni database (SH-06 - indici performance).

---

## ⚙️ CONFIGURAZIONE

### Abilitazione Diagnostica
```bash
# Nel file .env
DIAGNOSTICS_ENABLED=true
```

**Default:** `false` (disattivato)  
**Impatto:** Zero overhead quando disattivato

### Soglia Performance
- **Soglia "lento":** 120ms per query
- **Alert automatico:** ≥25% query lente
- **Finestra rolling:** Ultimi 100 measurements per tipo

---

## 📊 QUERY MONITORATE

### 1. Query Filtro Supplier
**Metodo:** `getWinesBySupplier(supplier: string)`  
**SQL:** `SELECT * FROM wines WHERE supplier = ?`  
**Utilizzo:** Filtri homepage, ricerca fornitore  
**Wrapper:** `queryDiagnostics.measureSupplierQuery()`

### 2. Query Filtro Type  
**Metodo:** `getWinesByType(type: string)`  
**SQL:** `SELECT * FROM wines WHERE type = ?`  
**Utilizzo:** Filtri tipologia vino (rosso, bianco, etc.)  
**Wrapper:** `queryDiagnostics.measureTypeQuery()`

### 3. Query Filtro User ID
**Metodo:** `getGoogleSheetLink(userId: string)`  
**SQL:** `SELECT * FROM google_sheet_links WHERE user_id = ?`  
**Utilizzo:** Configurazione Google Sheets per utente  
**Wrapper:** `queryDiagnostics.measureUserIdQuery()`

---

## 📋 LETTURA LOG

### Formato Log Debug
```
[DIAGNOSTICS] Query Performance Summary:
  Supplier: 45 queries, avg 89.2ms, 12.3% slow
  Type: 32 queries, avg 156.7ms, 31.2% slow  
  UserId: 8 queries, avg 45.1ms, 0.0% slow
```

### Log Singole Query Lente
```
[DIAGNOSTICS] SLOW type query: 187ms (threshold: 120ms)
```

### Alert Automatico
```
[DIAGNOSTICS] ⚠️ HIGH SLOW QUERY RATE: 28.4% - Consider executing SH-06 (database indices)
```

---

## 🔍 DOVE LEGGERE I LOG

### Development (locale)
```bash
# Avvia server con diagnostica
DIAGNOSTICS_ENABLED=true npm run dev

# I log appaiono nella console server
```

### Production (se abilitato)
```bash
# Log applicazione server
tail -f /var/log/winenode/server.log | grep DIAGNOSTICS

# Docker logs
docker logs winenode-server | grep DIAGNOSTICS
```

### Frequenza Log
- **Summary**: Ogni 5 minuti (se ci sono dati)
- **Query lente**: Immediatamente quando > 120ms
- **Alert**: Quando % lente ≥ 25%

---

## 🚨 SOGLIE E ALERT

### Definizione "Query Lenta"
- **Soglia:** >120ms per singola query
- **Baseline:** Tipico 20-80ms per query semplici
- **Target post-indici:** <50ms per 95% query

### Trigger Azione SH-06
**Condizione:** ≥25% delle query supera 120ms  
**Azione:** Eseguire migrazioni indici database  
**Riferimento:** [DOCS/TODO_SUPABASE.md](./TODO_SUPABASE.md)

### Metriche Raccolte
- **Count:** Numero query eseguite
- **Average:** Tempo medio esecuzione
- **Max:** Tempo massimo registrato  
- **Last:** Ultimo tempo misurato
- **Slow %:** Percentuale query > soglia

---

## 🔧 UTILIZZO PRATICO

### Scenario Tipico
1. **Abilitare diagnostica** in ambiente test/staging
2. **Simulare carico** normale applicazione
3. **Monitorare log** per 24-48h
4. **Analizzare metriche** e identificare bottleneck
5. **Eseguire SH-06** se necessario

### Interpretazione Risultati

#### ✅ Performance Buone
```
Supplier: 100 queries, avg 45.2ms, 5.0% slow
Type: 80 queries, avg 52.1ms, 8.7% slow
UserId: 20 queries, avg 28.3ms, 0.0% slow
```
**Azione:** Nessuna, performance ottimali

#### ⚠️ Performance Degradate  
```
Supplier: 100 queries, avg 145.8ms, 35.0% slow
Type: 80 queries, avg 189.2ms, 42.5% slow
UserId: 20 queries, avg 156.7ms, 30.0% slow
```
**Azione:** Eseguire SH-06 (indici) nella prima finestra utile

#### 🚨 Performance Critiche
```
Supplier: 100 queries, avg 287.4ms, 78.0% slow
Type: 80 queries, avg 345.1ms, 85.0% slow
UserId: 20 queries, avg 298.9ms, 75.0% slow
```
**Azione:** Eseguire SH-06 URGENTEMENTE + investigare altri bottleneck

---

## 📈 BENEFICI ATTESI POST-SH-06

### Miglioramenti Target
- **Query supplier:** 50-80% più veloci
- **Query type:** 60-90% più veloci  
- **Query user_id:** 70-95% più veloci

### Esempio Before/After
```
BEFORE (senza indici):
  Supplier: avg 145ms, 35% slow
  Type: avg 189ms, 42% slow
  UserId: avg 157ms, 30% slow

AFTER (con indici SH-06):  
  Supplier: avg 29ms, 2% slow
  Type: avg 19ms, 0% slow
  UserId: avg 8ms, 0% slow
```

---

## 🛠️ TROUBLESHOOTING

### Diagnostica Non Funziona
1. Verificare `DIAGNOSTICS_ENABLED=true` in .env
2. Riavviare server dopo cambio configurazione
3. Verificare log level include DEBUG
4. Testare con query effettive (non solo health check)

### Log Non Visibili
1. Controllare configurazione logging server
2. Verificare permessi file log
3. Usare `console.log` temporaneo per debug
4. Controllare filtri log applicazione

### Metriche Inconsistenti
1. Reset statistiche: riavvio server
2. Verificare carico database esterno
3. Controllare connessioni database pool
4. Monitorare risorse sistema (CPU/RAM)

---

## 🔒 SICUREZZA E PRIVACY

### Dati Sensibili
- **NON logga:** Contenuto query, parametri utente
- **Logga solo:** Tempi esecuzione, conteggi, statistiche
- **Nessun dato:** PII, password, token

### Overhead Performance
- **Disattivato:** Zero overhead
- **Attivato:** <1ms per query (Date.now() calls)
- **Memoria:** ~1KB per statistiche rolling

### Produzione
- **Raccomandazione:** Abilitare solo per troubleshooting
- **Durata:** Massimo 24-48h per raccolta dati
- **Disabilitare:** Dopo raccolta metriche sufficienti

---

**⚠️ IMPORTANTE**: Questa diagnostica è uno strumento di monitoraggio read-only. Non modifica database o comportamento applicazione, serve solo per identificare quando eseguire le ottimizzazioni SH-06.

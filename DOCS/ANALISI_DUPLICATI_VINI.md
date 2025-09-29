# ANALISI DUPLICATI VINI - AUDIT TOUCHPOINTS

**Data**: 29 Settembre 2025  
**Scope**: Identificazione e rimozione touchpoint che creano duplicati nella tabella `vini`

## 📊 PROBLEMA IDENTIFICATO

L'applicazione **non dovrebbe creare/modificare** vini; deve solo **leggere** quelli sincronizzati da Google Sheet → Supabase. Tuttavia, sono stati trovati touchpoint che scrivono sulla tabella `vini`, causando potenziali duplicati.

## 🔍 CODE TOUCHPOINTS IDENTIFICATI

### Tabella Touchpoints Scrittura su `vini`

| File | Funzione | Operazione | Motivo Dichiarato | Chiamanti |
|------|----------|------------|-------------------|-----------|
| `hooks/useWineData.ts:101` | `upsertToSupabase()` | `update` | Aggiornamento vino esistente | `fetchAndParseCSV()` |
| `hooks/useWineData.ts:102` | `upsertToSupabase()` | `insert` | Inserimento nuovo vino | `fetchAndParseCSV()` |
| `hooks/useWines.ts:156` | `updateWine()` | `update` | Aggiornamento metadati vino | `HomePage.tsx`, UI diretta |

### Dettaglio Operazioni

#### 1. **useWineData.ts - upsertToSupabase()**
```typescript
// LINEA 77-102: Funzione che crea/aggiorna vini
const upsertToSupabase = async (wine: WineRow, fallbackTipologia?: string) => {
  const { data: existing } = await supabase
    .from('vini')
    .select('id')
    .eq('nome_vino', nome)
    .single();

  const query = existing
    ? supabase.from('vini').update(wineData).eq('id', existing.id)  // ❌ UPDATE
    : supabase.from('vini').insert(wineData);                       // ❌ INSERT
}
```

**Chiamanti:**
- `fetchAndParseCSV()` → loop su `winesFromCsv` → `upsertToSupabase(wine, categoria)`
- **Motivo**: Sincronizzazione CSV → Supabase (dovrebbe essere read-only per l'app)

#### 2. **useWines.ts - updateWine()**
```typescript
// LINEA 141-156: Aggiornamento metadati vino
const updateWine = async (id: string, updates: Partial<WineType>) => {
  const { error } = await supabase.from('vini').update(updatesDb).eq('id', id); // ❌ UPDATE
}
```

**Chiamanti:**
- `HomePage.tsx` → `handleUpdateWine()` → `updateWine(id, updates)`
- **Motivo**: Modifica metadati vino da UI (non dovrebbe essere permesso)

#### 3. **useWines.ts - updateWineInventory() [SAFE]**
```typescript
// LINEA 72-89: Aggiornamento giacenze (TABELLA SEPARATA)
const updateWineInventory = async (id: string, newInventory: number) => {
  // Scrive su 'giacenze', NON su 'vini' ✅ SAFE
  await supabase.from('giacenze').upsert({
    vino_id: id,
    giacenza: newInventory
  });
}
```

**Chiamanti:**
- `HomePage.tsx` → gestione giacenze
- `OrdiniContext.tsx` → aggiornamento giacenze post-archiviazione
- **Motivo**: Aggiornamento giacenze (corretto, tabella separata)

## 🚨 QUANDO ACCADONO I DUPLICATI

### Scenario 1: Sincronizzazione CSV
1. **fetchAndParseCSV()** carica CSV da Google Sheets
2. Per ogni vino nel CSV → **upsertToSupabase()**
3. Se match per nome fallisce → **INSERT** nuovo record
4. **DUPLICATO CREATO** se stesso vino con nome leggermente diverso

### Scenario 2: Modifica UI
1. Utente modifica metadati vino da HomePage
2. **updateWine()** esegue UPDATE su tabella `vini`
3. **SIDE EFFECT** non previsto (app dovrebbe essere read-only)

### Scenario 3: Gestione Ordini (SAFE)
1. Archiviazione ordine → aggiornamento giacenze
2. **updateWineInventory()** scrive su `giacenze` ✅
3. **NESSUN DUPLICATO** (tabella corretta)

## 📋 CLUSTER DUPLICATI POTENZIALI

### Query SQL per Identificazione Duplicati
```sql
-- Cluster duplicati logici (stesso vino, nomi simili)
SELECT 
  lower(trim(nome_vino)) as nome_normalizzato,
  lower(trim(produttore)) as produttore_normalizzato,
  anno,
  fornitore,
  count(*) as duplicati_count,
  array_agg(id) as wine_ids,
  array_agg(nome_vino) as nomi_originali
FROM vini 
GROUP BY 
  lower(trim(nome_vino)), 
  lower(trim(produttore)), 
  anno, 
  fornitore
HAVING count(*) > 1
ORDER BY duplicati_count DESC;
```

### Risultati Cluster (Esempio)
*Nota: Query da eseguire su Supabase per identificare duplicati effettivi*

| Nome Normalizzato | Produttore | Anno | Fornitore | Count | Wine IDs |
|-------------------|------------|------|-----------|-------|----------|
| `chianti classico` | `antinori` | 2020 | `bologna vini` | 3 | `[uuid1, uuid2, uuid3]` |
| `barolo` | `fontana` | 2019 | `piemonte wine` | 2 | `[uuid4, uuid5]` |

## 🎯 STRATEGIA FIX

### 1. **Rimozione Touchpoint Scrittura**
- **useWineData.ts**: Rimuovere `upsertToSupabase()` o renderla read-only
- **useWines.ts**: Rimuovere `updateWine()` o bloccare operazioni su `vini`

### 2. **Runtime Read-Only su `vini`**
- Tutti i punti che scrivono su `vini` → **ABORT SOFT** con errore
- Mantenere solo lettura per popolamento liste
- Usare sempre **vinoId** esistente negli ordini

### 3. **Guardrail Service**
- Wrapper Supabase che blocca write operations su `vini`
- Log warning in dev, throw error in runtime
- Preservare operazioni su altre tabelle (`giacenze`, `ordini`)

### 4. **Risoluzione vinoId**
- Negli ordini, salvare sempre **vinoId** (UUID)
- Evitare match per nome/produttore a runtime
- Se vinoId non risolvibile → errore applicativo pulito

## 🔧 AZIONI IMMEDIATE

### Priority 1 - Blocco Scritture
1. **useWineData.ts**: Disabilitare `upsertToSupabase()`
2. **useWines.ts**: Disabilitare `updateWine()`
3. **Guardrail**: Wrapper service per blocco write su `vini`

### Priority 2 - Validazione
1. **Test scenario**: Crea ordine → modifica quantità → archivia
2. **Verifica**: Nessun nuovo record in `vini`
3. **Controllo**: Giacenze aggiornate correttamente

### Priority 3 - Cleanup
1. **Identificazione duplicati**: Eseguire query SQL
2. **Merge duplicati**: Consolidamento manuale se necessario
3. **Prevenzione**: Guardrail permanenti

## 📊 IMPATTO STIMATO

### Benefici
- **Zero duplicati** futuri nella tabella `vini`
- **Performance migliorata** (meno record duplicati)
- **Data integrity** garantita
- **Separazione concerns** (app read-only, sync write-only)

### Rischi
- **Nessun rischio UI/UX** (solo backend changes)
- **Compatibilità**: Mantenuta (stessi vinoId)
- **Rollback**: Facile (riattivare funzioni)

## 🎯 SUCCESS CRITERIA

### Test Obbligatori
1. ✅ **Crea ordine** → modifica quantità → archivia
2. ✅ **Verifica Supabase**: Nessun nuovo record in `vini`
3. ✅ **Giacenze**: Aggiornate correttamente su tabella separata
4. ✅ **UI/UX**: Invariata, nessuna regressione
5. ✅ **Build**: TypeScript 0 errors, ESLint 0 errors

### Metriche
- **Duplicati creati**: 0 (target)
- **Write operations su `vini`**: 0 (target)
- **Read operations**: Mantenute
- **Performance**: Invariata o migliorata

---

**Status**: 📋 **AUDIT COMPLETATO**  
**Next**: Implementazione fix read-only + guardrail service

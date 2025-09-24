# REPORT FIX ORDINI - DIAGNOSI E CORREZIONI

**Data:** 25/09/2025 00:16  
**Backup:** backup_25092025_001644.tar.gz  
**Versione:** WineNode v1.0.0

## FASE 0 — VINCOLI & BACKUP

### ✅ Backup Completato
- **File:** backup_25092025_001644.tar.gz
- **Dimensione:** 953.9 KB
- **Timestamp:** 25/09/2025, 00:16:44

### 🔒 Vincoli Rispettati
- ❌ Nessuna modifica a layout esistente
- ❌ Nessuna modifica a colori/temi
- ❌ Nessuna modifica a componenti UI strutturali
- ✅ Solo correzioni funzionali mirate

---

## FASE 1 — DIAGNOSI GUIDATA ✅ COMPLETATA

### 🐛 Problemi Identificati

#### Problema 1: RiepilogoOrdine → CONFERMA
**Sintomo:** Click CONFERMA → compare conferma, poi blocco su "Caricamento ordini…"
**Status:** ✅ **CAUSA IDENTIFICATA**

#### Problema 2: Modale Carrello → Gestisci Ordini  
**Sintomo:** Pagina resta su "Caricamento ordini…"
**Status:** ✅ **CAUSA IDENTIFICATA**

### 📋 Log Console Confermati
```
PGRST204: Could not find the 'bottiglie' column of 'ordini'
PGRST200: Could not find a relationship between 'ordini' and 'ordini_dettaglio' ... hint: Perhaps you meant 'vini'
```

### 🔍 Schema Supabase ANALIZZATO

#### ❌ **MISMATCH CRITICI IDENTIFICATI:**

**1. SCHEMA CONFLITTO - Due versioni diverse:**
- **SCHEMA_UNICO.sql** (vecchio): tabella `ordini` con colonne `data`, `contenuto` JSONB
- **08_configurazione_supabase.md** (nuovo): tabelle `ordini` + `ordini_dettaglio` separate

**2. COLONNE MANCANTI in tabella `ordini`:**
- ❌ **Codice cerca:** `bottiglie` → **Schema:** NON ESISTE
- ❌ **Codice cerca:** `tipo` → **Schema:** NON ESISTE  
- ❌ **Codice cerca:** `data_ordine` → **Schema:** ha `data_ordine` ✅

**3. TABELLA `ordini_dettaglio`:**
- ❌ **Codice cerca:** `ordini_dettaglio` con campi specifici
- ❌ **Schema UNICO:** NON ESISTE (usa JSONB)
- ✅ **Schema CONFIG:** ESISTE ma con campi diversi

### 📊 **MAPPING CAMPI - CODICE vs SCHEMA:**

#### Tabella `ordini` - INSERT payload:
```typescript
// CODICE INVIA:
{
  fornitore: string,
  totale: number,
  bottiglie: number,     // ❌ COLONNA NON ESISTE
  data_ordine: string,   // ✅ ESISTE  
  stato: string,         // ✅ ESISTE
  tipo: string          // ❌ COLONNA NON ESISTE
}

// SCHEMA ATTUALE:
{
  id: UUID,
  user_id: UUID,
  fornitore: TEXT,       // ✅ MATCH
  stato: TEXT,           // ✅ MATCH  
  data_ordine: TIMESTAMP,// ✅ MATCH (ma formato diverso)
  totale_euro: DECIMAL,  // ❌ NOME DIVERSO (totale vs totale_euro)
  contenuto: JSONB,      // ❌ NON USATO DAL CODICE
  note: TEXT
}
```

#### Tabella `ordini_dettaglio` - SELECT query:
```typescript
// CODICE CERCA:
ordini_dettaglio (
  id,
  vino_id,           // ✅ ESISTE
  nome_vino,         // ❌ NON ESISTE (schema ha solo vino_id)
  quantita,          // ❌ NOME DIVERSO (quantita vs quantita_ordinata)
  unita,             // ❌ NON ESISTE
  prezzo_unitario,   // ✅ ESISTE
  prezzo_totale      // ❌ NOME DIVERSO (prezzo_totale vs subtotale)
)

// SCHEMA ATTUALE:
{
  id: UUID,
  ordine_id: UUID,
  vino_id: INTEGER,      // ✅ MATCH
  quantita_ordinata: INT,// ❌ NOME DIVERSO
  quantita_ricevuta: INT,
  prezzo_unitario: DECIMAL,// ✅ MATCH
  subtotale: DECIMAL     // ❌ NOME DIVERSO (computed)
}
```

### 🔐 RLS/Policies - Status
- ✅ SELECT consentito su ordini (policy esistente)
- ✅ INSERT consentito su ordini (policy esistente)  
- ✅ SELECT consentito su ordini_dettaglio (policy con JOIN)
- ✅ INSERT consentito su ordini_dettaglio (policy esistente)

### 📅 **FORMATO DATA PROBLEMA:**
- **Codice invia:** `new Date().toLocaleDateString('it-IT')` → "25/09/2025"
- **Schema aspetta:** TIMESTAMP WITH TIME ZONE → ISO format

---

## MODIFICHE PRECEDENTI (da rollback se necessario)

### File: `/src/pages/RiepilogoOrdinePage.tsx`

#### Aggiunte:
```typescript
// Importazioni
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

// Stati per feedback
const [isConfirming, setIsConfirming] = useState(false);
const [showSuccess, setShowSuccess] = useState(false);

// Funzione handleConferma modificata (async/await)
const handleConferma = async () => {
  // ... logica con try/catch e feedback visivo
};
```

#### Componenti UI Aggiunti:
- Modale successo con overlay
- Spinner di loading nel pulsante
- Messaggio "SALVANDO..." durante processo

---

## FASE 2 — SOLUZIONI IDENTIFICATE

### 🎯 **STRATEGIA CORREZIONE:**

**OPZIONE A: Adattare codice allo schema esistente (RACCOMANDATO)**
- ✅ Meno invasivo
- ✅ Non richiede modifiche database
- ✅ Mantiene compatibilità esistente

**OPZIONE B: Modificare schema database**
- ❌ Più rischioso
- ❌ Richiede migrazione dati
- ❌ Potrebbe rompere altre funzionalità

### 🔧 **CORREZIONI SPECIFICHE RICHIESTE:**

#### 1. **Tabella `ordini` - INSERT payload:**
```typescript
// PRIMA (ERRATO):
{
  fornitore: string,
  totale: number,        // ❌ nome sbagliato
  bottiglie: number,     // ❌ colonna non esiste
  data_ordine: string,   // ❌ formato sbagliato
  stato: string,
  tipo: string          // ❌ colonna non esiste
}

// DOPO (CORRETTO):
{
  fornitore: string,
  totale_euro: number,   // ✅ nome corretto
  data_ordine: Date,     // ✅ formato ISO
  stato: string,
  contenuto: JSONB       // ✅ dettagli in JSON
}
```

#### 2. **Tabella `ordini_dettaglio` - SELECT query:**
```typescript
// PRIMA (ERRATO):
ordini_dettaglio (
  vino_id,
  nome_vino,         // ❌ non esiste
  quantita,          // ❌ nome sbagliato
  unita,             // ❌ non esiste
  prezzo_unitario,
  prezzo_totale      // ❌ nome sbagliato
)

// DOPO (CORRETTO):
ordini_dettaglio (
  vino_id,
  quantita_ordinata, // ✅ nome corretto
  prezzo_unitario,
  subtotale          // ✅ nome corretto
)
```

#### 3. **Gestione `nome_vino` e `unita`:**
- **nome_vino**: JOIN con tabella `vini` tramite `vino_id`
- **unita**: Aggiungere al campo `contenuto` JSONB

### 📋 **PIANO IMPLEMENTAZIONE:**

1. **useSupabaseOrdini.ts:**
   - ✅ Correggere INSERT payload (totale → totale_euro)
   - ✅ Rimuovere campi `bottiglie` e `tipo`
   - ✅ Correggere formato data (ISO invece di locale)
   - ✅ Correggere SELECT query per `ordini_dettaglio`

2. **OrdiniContext.tsx:**
   - ✅ Aggiornare interface `Ordine` per rimuovere campi non supportati
   - ✅ Mantenere compatibilità UI esistente

3. **RiepilogoOrdinePage.tsx:**
   - ✅ Adattare payload ordine al nuovo formato
   - ✅ Gestire `bottiglie` come campo calcolato

---

## FASE 3 — IMPLEMENTAZIONE CORREZIONI

### 🛠️ **MODIFICHE APPLICATE:**

#### File: `src/hooks/useSupabaseOrdini.ts`
```diff
// INSERT ordini - CORREZIONE CAMPI
- bottiglie: ordine.bottiglie,     // ❌ RIMOSSO
- data_ordine: ordine.data,        // ❌ FORMATO ERRATO
- totale: ordine.totale,           // ❌ NOME ERRATO
- tipo: ordine.tipo                // ❌ RIMOSSO

+ totale_euro: ordine.totale,      // ✅ NOME CORRETTO
+ data_ordine: new Date(ordine.data).toISOString(), // ✅ FORMATO ISO
+ contenuto: ordine.dettagli       // ✅ DETTAGLI IN JSONB

// SELECT ordini - CORREZIONE QUERY
- ordini_dettaglio (
-   nome_vino,                     // ❌ RIMOSSO
-   quantita,                      // ❌ NOME ERRATO
-   unita,                         // ❌ RIMOSSO
-   prezzo_totale                  // ❌ NOME ERRATO
- )

+ ordini_dettaglio (
+   quantita_ordinata,             // ✅ NOME CORRETTO
+   subtotale                      // ✅ NOME CORRETTO
+ )
```

#### File: `src/contexts/OrdiniContext.tsx`
```diff
// Interface Ordine - RIMOZIONE CAMPI NON SUPPORTATI
export interface Ordine {
  id: string;
  fornitore: string;
  totale: number;
- bottiglie: number;               // ❌ RIMOSSO
  data: string;
  stato: 'in_corso' | 'completato' | 'annullato';
- tipo: 'inviato' | 'ricevuto';    // ❌ RIMOSSO
  dettagli?: OrdineDettaglio[];
}
```

---

## RISULTATI ATTESI

### ✅ **DOPO LE CORREZIONI:**

1. **RiepilogoOrdine → CONFERMA:**
   - ✅ Click CONFERMA → salvataggio corretto in database
   - ✅ Messaggio successo → navigazione a GestisciOrdini
   - ✅ NESSUN errore PGRST204/PGRST200

2. **Modale Carrello → Gestisci Ordini:**
   - ✅ Click Gestisci Ordini → caricamento ordini corretto
   - ✅ Lista ordini visualizzata correttamente
   - ✅ NESSUN blocco su "Caricamento ordini…"

3. **Database:**
   - ✅ Ordini salvati con schema corretto
   - ✅ Dettagli ordine in `ordini_dettaglio` o `contenuto` JSONB
   - ✅ Compatibilità con RLS policies esistenti

---

## CHECKLIST FINALE

- [x] **Backup completato:** backup_25092025_001644.tar.gz
- [x] **Diagnosi completata:** Mismatch schema identificati
- [x] **Soluzioni definite:** Adattamento codice a schema esistente
- [x] **Correzioni implementate:** ✅ COMPLETATE
- [ ] **Test funzionalità:** In corso...
- [ ] **Validazione finale:** Pending

### 🛠️ **CORREZIONI EFFETTIVAMENTE APPLICATE:**

#### 1. **File: `src/hooks/useSupabaseOrdini.ts`**
```diff
// INSERT ordini - CORREZIONI APPLICATE:
- bottiglie: ordine.bottiglie,           // ❌ RIMOSSO
- totale: ordine.totale,                 // ❌ CORRETTO
- tipo: ordine.tipo,                     // ❌ RIMOSSO
- data_ordine: ordine.data,              // ❌ CORRETTO

+ totale_euro: ordine.totale,            // ✅ NOME CORRETTO
+ data_ordine: new Date().toISOString(), // ✅ FORMATO ISO
+ contenuto: ordine.dettagli || []       // ✅ DETTAGLI IN JSONB

// SELECT ordini - CORREZIONI APPLICATE:
- totale,                                // ❌ CORRETTO
- bottiglie,                             // ❌ RIMOSSO
- tipo,                                  // ❌ RIMOSSO
- ordini_dettaglio (nome_vino, quantita, unita, prezzo_totale) // ❌ CORRETTO

+ totale_euro,                           // ✅ NOME CORRETTO
+ contenuto,                             // ✅ JSONB AGGIUNTO
+ ordini_dettaglio (quantita_ordinata, subtotale) // ✅ NOMI CORRETTI

// MAPPING - CORREZIONI APPLICATE:
+ Calcolo bottiglie dai dettagli        // ✅ CAMPO DERIVATO
+ Derivazione tipo dallo stato           // ✅ CAMPO DERIVATO
+ Gestione doppia fonte (ordini_dettaglio + contenuto) // ✅ COMPATIBILITÀ
```

#### 2. **File: `src/contexts/OrdiniContext.tsx`**
```diff
// Interface Ordine - CORREZIONI APPLICATE:
export interface Ordine {
  id: string;
  fornitore: string;
  totale: number;
- bottiglie: number;                     // ❌ RIMOSSO
  data: string;
  stato: 'in_corso' | 'completato' | 'annullato';
- tipo: 'inviato' | 'ricevuto';          // ❌ RIMOSSO
  dettagli?: OrdineDettaglio[];
+ bottiglie?: number;                    // ✅ CAMPO OPZIONALE CALCOLATO
+ tipo?: 'inviato' | 'ricevuto';         // ✅ CAMPO OPZIONALE DERIVATO
}
```

#### 3. **File: `src/pages/RiepilogoOrdinePage.tsx`**
```diff
// Payload ordine - CORREZIONI APPLICATE:
const nuovoOrdine = {
  fornitore,
  totale: totalOrdine,
- bottiglie: totalBottiglie,             // ❌ RIMOSSO
  data: new Date().toLocaleDateString('it-IT'),
  stato: 'in_corso' as const,
- tipo: 'inviato' as const,              // ❌ RIMOSSO
  dettagli: ordineDetails.map(...)       // ✅ MANTENUTO
};
```

---

*Report aggiornato: 25/09/2025 00:20*

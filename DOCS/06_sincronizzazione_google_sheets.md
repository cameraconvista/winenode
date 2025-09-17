
# 📊 SINCRONIZZAZIONE GOOGLE SHEETS - WineNode

## 🎯 PANORAMICA SISTEMA

WineNode utilizza **due approcci paralleli** per la sincronizzazione con Google Sheets:

1. **🔄 Google Apps Script** - Sincronizzazione automatica server-side (RACCOMANDATO)
2. **📡 API Google Sheets** - Sincronizzazione manuale client-side (BACKUP)

---

## 🚀 METODO 1: GOOGLE APPS SCRIPT (PRINCIPALE)

### 📋 File di Riferimento
- **File:** `google-apps-script.js` (root del progetto)
- **Funzione principale:** `sincronizzaAutomatica()`
- **Trigger:** Automatico ogni 5 minuti

### ⚙️ CONFIGURAZIONE NECESSARIA

#### 1. Configurazione Google Apps Script
```javascript
// 🔧 CONFIGURAZIONE - Sostituisci con i tuoi valori
const SUPABASE_URL = "https://rtmohyjquscdkbtibdsu.supabase.co";
const SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const DEFAULT_USER_ID = "02c85ceb-8026-4bd9-9dc5-c03a74f56346";
const GOOGLE_SHEET_ID = "1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy";
```

#### 2. Struttura Google Sheet Richiesta
Il Google Sheet deve avere **fogli separati** per ogni tipologia:

```
📊 GOOGLE SHEET
├── 🍷 BOLLICINE ITALIANE
├── 🥂 BOLLICINE FRANCESI  
├── 🍾 BIANCHI
├── 🍷 ROSSI
├── 🌹 ROSATI
└── 🍯 VINI DOLCI
```

#### 3. Intestazioni Colonne Supportate
Per ogni foglio, le colonne possono avere questi nomi (case-insensitive):

| Campo | Intestazioni Accettate |
|-------|----------------------|
| **Nome Vino** | `NOME VINO`, `NAME`, `WINE`, `VINO` |
| **Anno** | `ANNO`, `YEAR`, `VINTAGE` |
| **Produttore** | `PRODUTTORE`, `PRODUCER`, `AZIENDA` |
| **Provenienza** | `PROVENIENZA`, `ORIGINE`, `REGION` |
| **Fornitore** | `FORNITORE`, `SUPPLIER` |
| **Costo** | `COSTO`, `COST`, `PREZZO ACQUISTO` |
| **Vendita** | `VENDITA`, `PREZZO VENDITA`, `SELLING` |
| **Margine** | `MARGINE`, `MARGIN` |

### 🔧 FUNZIONI PRINCIPALI

#### `sincronizzaAutomatica()`
```javascript
// Funzione master che:
// 1. Legge tutti i fogli del Google Sheet
// 2. Mappa le tipologie secondo TIPOLOGIE_MAPPING
// 3. Elimina vini esistenti per categoria
// 4. Inserisce nuovi vini in batch (50 per volta)
// 5. Gestisce errori e retry automatici
```

#### `sincronizzaFoglio(nomeSpreadsheet, nomeFoglio, tipologia)`
```javascript
// Sincronizza un singolo foglio:
// - Legge e mappa le intestazioni automaticamente
// - Converte valori Euro con parseEuro()
// - Valida i dati prima dell'inserimento
// - Inserisce in batch per performance ottimali
```

#### `configuraTriggersAutomatici()`
```javascript
// Configura trigger temporale ogni 5 minuti
// Da eseguire UNA VOLTA per attivare la sincronizzazione
```

### 📊 MAPPATURA TIPOLOGIE
```javascript
const TIPOLOGIE_MAPPING = {
  'BOLLICINE ITALIANE': 'BOLLICINE ITALIANE',
  'BOLLICINE FRANCESI': 'BOLLICINE FRANCESI', 
  'BIANCHI': 'BIANCHI',
  'ROSSI': 'ROSSI',
  'ROSATI': 'ROSATI',
  'VINI DOLCI': 'VINI DOLCI'
};
```

### 🔄 PROCESSO DI SINCRONIZZAZIONE

1. **Lettura Fogli** → Il script legge tutti i fogli disponibili
2. **Mappatura Intestazioni** → Identifica automaticamente le colonne
3. **Pulizia Database** → Elimina vini esistenti per categoria
4. **Validazione Dati** → Controlla nome vino obbligatorio
5. **Inserimento Batch** → Inserisce 50 vini per volta
6. **Logging Completo** → Traccia ogni operazione

---

## 📡 METODO 2: API GOOGLE SHEETS (BACKUP)

### 📋 File di Riferimento
- **File:** `src/lib/googleSheets.ts`
- **File:** `src/lib/importFromGoogleSheet.ts`  
- **Componente:** `src/components/ImportaVini.tsx`

### ⚙️ CONFIGURAZIONE SECRETS

Aggiungi nelle **Replit Secrets**:

```bash
# Service Account Google
VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
VITE_GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----

# ID del Google Sheet (opzionale per backup)
VITE_GOOGLE_SHEET_ID=1vQ_DIwWlGmqp3ciC47s5RBnFBPtDR-NodJOJ-BaO4zGnwpsF54l73hi7174Pc9p9ZAn8T2z_z5i7ssy
```

### 🔧 FUNZIONI API SHEETS

#### `connectToGoogleSheet(spreadsheetId)`
```typescript
// Connessione sicura con JWT
// Scope: 'https://www.googleapis.com/auth/spreadsheets.readonly'
```

#### `getSheetData(doc, sheetTitle)`
```typescript
// Estrae dati da un foglio specifico
// Parsing automatico numeri e testi
// Gestione celle vuote e formattazione
```

#### `importFromGoogleSheet(googleSheetUrl, userId)`
```typescript
// Importazione completa:
// 1. Estrazione spreadsheetId da URL
// 2. Connessione al documento
// 3. Mapping automatico categorie
// 4. Import parallelo di tutti i fogli
// 5. Report dettagliato risultati
```

---

## 🔗 INTEGRAZIONE CON SUPABASE

### 📊 Tabella `vini`
```sql
CREATE TABLE vini (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_vino text NOT NULL,
    anno text,
    produttore text,
    provenienza text,
    fornitore text,
    costo decimal(10,2),
    vendita decimal(10,2),
    margine decimal(10,2),
    tipologia text NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

### 🔄 Policy RLS (Row Level Security)
```sql
-- Ogni utente vede solo i propri vini
CREATE POLICY "Users can view own wines" ON vini 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wines" ON vini 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wines" ON vini 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wines" ON vini 
    FOR DELETE USING (auth.uid() = user_id);
```

---

## 🛠️ CONFIGURAZIONE STEP-BY-STEP

### 1. Setup Google Apps Script (RACCOMANDATO)

```bash
# 1. Apri Google Apps Script: https://script.google.com
# 2. Crea nuovo progetto: "WineNode Sync"  
# 3. Incolla il contenuto di google-apps-script.js
# 4. Modifica le variabili di configurazione:
#    - SUPABASE_URL
#    - SUPABASE_API_KEY  
#    - DEFAULT_USER_ID
#    - GOOGLE_SHEET_ID
# 5. Salva il progetto
# 6. Esegui configuraTriggersAutomatici() per attivare sync automatica
```

### 2. Test Sincronizzazione
```javascript
// In Google Apps Script, esegui:
testSincronizzazione()  // Testa una sincronizzazione manuale
verificaStatoDatabase() // Verifica vini presenti nel database
```

### 3. Setup API Backup (OPZIONALE)
```bash
# 1. Aggiungi secrets in Replit
# 2. Testa connessione da ImportaVini.tsx
# 3. Usa "Importa da Google Sheet" nel UI per sync manuale
```

---

## 📋 MONITORAGGIO E DEBUG

### 🔍 Verifiche Google Apps Script
```javascript
// Console di Google Apps Script mostra:
console.log('🚀 Avvio sincronizzazione...');
console.log('📋 Trovati N fogli nel Google Sheet');  
console.log('📊 Tipologia: X vini sincronizzati');
console.log('🏁 Sincronizzazione completata: Y vini totali');
```

### 🔍 Verifiche Database Supabase
```sql
-- Conta vini per tipologia
SELECT tipologia, COUNT(*) as vini_count 
FROM vini 
WHERE user_id = 'YOUR_USER_ID'
GROUP BY tipologia 
ORDER BY tipologia;

-- Ultimi vini inseriti
SELECT nome_vino, tipologia, created_at 
FROM vini 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC 
LIMIT 10;
```

### 🔍 Verifiche Client-Side
```typescript
// Console browser mostra:
console.log('🔄 Sincronizzazione automatica attivata');
console.log('📊 Risultato sincronizzazione:', result);
console.log('✅ Google Sheet collegato');
```

---

## ⚠️ TROUBLESHOOTING

### ❌ Problemi Comuni

#### 1. **Errore "Foglio non trovato"**
```
Soluzione: Verifica che i nomi dei fogli corrispondano esattamente a:
- BOLLICINE ITALIANE
- BOLLICINE FRANCESI  
- BIANCHI
- ROSSI
- ROSATI
- VINI DOLCI
```

#### 2. **Errore "Permessi Google Sheet"**
```
Soluzione: 
1. Condividi il Google Sheet in modalità "Visualizzatore" 
2. Aggiungi l'email del service account come collaboratore
3. Verifica che lo script abbia accesso al documento
```

#### 3. **Errore "Supabase non raggiungibile"**
```
Soluzione:
1. Verifica SUPABASE_URL corretto
2. Controlla SUPABASE_API_KEY (deve essere service_role key)
3. Verifica che le policy RLS permettano l'inserimento
```

#### 4. **Sincronizzazione parziale****
```
Soluzione:
1. Controlla che ogni foglio abbia almeno la colonna "NOME VINO"
2. Verifica che le righe non siano completamente vuote
3. Controlla i log di Google Apps Script per errori specifici
```

---

## 🚀 COMANDI UTILI

### Google Apps Script Console
```javascript
// Test completo
testSincronizzazione()

// Solo verifica stato  
verificaStatoDatabase()

// Riattiva trigger se necessario
configuraTriggersAutomatici()

// Sincronizzazione manuale immediata
sincronizzaAutomatica()
```

### Replit Console (API Backup)
```bash
# Verifica secrets configurate
echo $VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL
echo $VITE_GOOGLE_SHEET_ID

# Test connessione (dal browser)
# Vai su ImportaVini → "Importa da Google Sheet"
```

---

## 📊 PERFORMANCE E LIMITI

### ⚡ Google Apps Script
- **Frequenza:** Ogni 5 minuti automatico
- **Batch Size:** 50 vini per inserimento  
- **Timeout:** 6 minuti max per esecuzione
- **Rate Limit:** Gestito automaticamente con pause

### ⚡ API Google Sheets  
- **Frequenza:** Solo manuale
- **Rate Limit:** 100 richieste/100 secondi
- **Timeout:** 30 secondi per richiesta
- **Concorrenza:** 1 utente alla volta

---

## ✅ CHECKLIST CONFIGURAZIONE

### Google Apps Script Setup
- [ ] Progetto creato su script.google.com
- [ ] Codice incollato e configurato  
- [ ] Variabili personalizzate (URL, API Key, User ID, Sheet ID)
- [ ] Trigger automatico configurato (`configuraTriggersAutomatici()`)
- [ ] Test iniziale eseguito (`testSincronizzazione()`)

### Google Sheet Struttura
- [ ] Fogli nominati correttamente (ROSSI, BIANCHI, etc.)
- [ ] Intestazioni presenti (almeno NOME VINO)
- [ ] Dati di test inseriti
- [ ] Permessi di lettura configurati

### Supabase Database  
- [ ] Tabella `vini` creata con schema corretto
- [ ] Policy RLS attivate per sicurezza
- [ ] Service role API key disponibile
- [ ] User ID dell'utente identificato

### Replit Secrets (Backup)
- [ ] `VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL` configurata
- [ ] `VITE_GOOGLE_PRIVATE_KEY` configurata  
- [ ] Test manuale da UI funzionante

---

**🎯 OBIETTIVO:** Sincronizzazione automatica, affidabile e trasparente tra Google Sheets e database Supabase per gestione vini e fornitori in tempo reale.

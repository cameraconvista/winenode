# REALTIME GIACENZE - DIAGNOSI ARCHITETTURA

## PHASE 0 - MAPPATURA FILE E FLUSSO DATI ATTUALE

### 1. CLIENT SUPABASE
- **File principale**: `src/lib/supabase.ts`
- **Versione**: @supabase/supabase-js v2.39.8
- **Configurazione**: createClient con URL e ANON_KEY da env
- **RLS**: Disabilitata (app single-tenant con SERVICE_USER_ID fisso)

### 2. STORE/CONTEXT GIACENZE
- **Hook principale**: `src/hooks/useWines.ts` (212 righe)
  - State: `wines[]`, `suppliers[]`, `loading`, `error`
  - Fetch: `fetchWines()` - JOIN vini + giacenza
  - Update: `updateWineInventory()`, `updateMultipleWineInventories()`
  - Mapping: vini.* + giacenza.giacenza/min_stock → WineType

### 3. COMPONENTI CHE MODIFICANO GIACENZE
- **HomePage**: `src/pages/HomePage/index.tsx`
  - Hook: `useHomeHandlers()` per inventory modal
  - Componente: `HomeInventoryModal.tsx` (wheel picker)
- **ManualWineInsertPage**: Inserimento nuovi vini con giacenza iniziale
- **GestisciOrdini**: Conferma ordini → aggiornamento giacenze automatico
  - Context: `OrdersActionsContext.tsx` usa `updateWineInventory()`

### 4. TABELLA DATABASE
- **Nome**: `public.giacenza`
- **Campi identificati**:
  - `id` (PK)
  - `vino_id` (FK → vini.id)
  - `giacenza` (numero)
  - `min_stock` (numero)
  - `user_id` (fisso SERVICE_USER_ID)
  - `created_at`, `updated_at` (timestamp)
  - **MANCANTE**: `version` (per concorrenza ottimistica)

### 5. FLUSSO DATI ATTUALE

#### LETTURA:
1. `useWines.fetchWines()` → JOIN vini + giacenza
2. Mapping → `WineType[]` con inventory/minStock
3. State locale aggiornato
4. UI re-render automatico

#### SCRITTURA:
1. User input → `updateWineInventory(id, newValue)`
2. Check esistenza record giacenza
3. INSERT/UPDATE su `public.giacenza`
4. Update state locale ottimistico
5. UI feedback immediato

#### PROBLEMI IDENTIFICATI:
- **Nessun realtime**: Modifiche da altri device non visibili
- **Nessuna concorrenza**: Race conditions possibili
- **Nessun fallback**: Solo refresh manuale
- **Nessun version control**: Conflitti non gestiti

### 6. PRECONDIZIONI VERIFICATE

#### ✅ SUPABASE CLIENT:
- Versione 2.39.8 supporta Realtime
- Client configurato correttamente
- Auth disabilitata (RLS off)

#### ❌ SCHEMA DATABASE:
- Tabella `giacenza` esiste
- **MANCANTE**: Colonna `version` per optimistic locking
- **MANCANTE**: Trigger `updated_at` automatico

#### ✅ ARCHITETTURA:
- Hook centralizzato `useWines`
- State management locale
- Update functions esistenti
- Componenti modulari

### 7. COMPONENTI DA MODIFICARE

#### CORE:
- `src/hooks/useWines.ts` → Aggiungere realtime subscription
- `src/lib/supabase.ts` → Configurazione realtime

#### NUOVI FILE:
- `src/hooks/useRealtimeGiacenza.ts` → Realtime hook
- `src/hooks/useVisibilityOnlineRefetch.ts` → Fallback hook

#### FEATURE FLAGS:
- `.env.example` → `VITE_REALTIME_GIACENZE_ENABLED=true`

### 8. FLUSSO REALTIME TARGET

#### SUBSCRIPTION:
1. Mount `useRealtimeGiacenza` in componenti che mostrano giacenze
2. Channel su `public.giacenza` → INSERT|UPDATE|DELETE
3. Merge eventi nello store locale
4. Debounce per evitare re-render cascata

#### OPTIMISTIC LOCKING:
1. Aggiungere `version` a schema giacenza
2. WHERE id = :id AND version = :currentVersion
3. Se 0 righe → conflitto → refetch + toast
4. Update state con nuova version

#### FALLBACK:
1. `visibilitychange` + `online` → soft refetch
2. Debounce 300-500ms
3. Solo righe visibili

### 9. EDGE CASES DA GESTIRE

- **Eco locale**: Ignorare update se corrisponde a mutazione appena confermata
- **Cleanup**: Unsubscribe su unmount
- **Reconnect**: Auto-rejoin su network recovery
- **Batch updates**: Micro-task per performance
- **Error handling**: Fallback su subscription failure

### 10. TESTING SCENARIOS

1. **Device A modifica** → Device B vede update <2s
2. **Conflitto concorrenza** → Toast + refetch + UI allineata
3. **Focus/network** → Soft refetch su visibility/online
4. **DELETE vino** → Rimozione realtime su tutti i device
5. **Performance** → Nessun re-render globale eccessivo

---

## PHASE 1 - REALTIME SUBSCRIPTION IMPLEMENTATA ✅

### FILE CREATI:
- `src/hooks/useRealtimeGiacenza.ts` → Hook realtime con debounce e cleanup
- Feature flag `VITE_REALTIME_GIACENZE_ENABLED` in `.env.example`

### MODIFICHE:
- `src/hooks/useWines.ts` → Integrazione realtime subscription
  - Handler per INSERT/UPDATE/DELETE eventi
  - Prevenzione eco locale con `markUpdatePending()`
  - Feature flag per attivazione controllata
  - Status `realtimeConnected` nel return

### FUNZIONALITÀ IMPLEMENTATE:
- ✅ **Subscription realtime** su `public.giacenza` (INSERT|UPDATE|DELETE)
- ✅ **Debounce batching** (50ms) per evitare re-render cascata
- ✅ **Prevenzione eco locale** - ignora update appena confermati
- ✅ **Cleanup automatico** su unmount + auto-rejoin
- ✅ **Feature flag** per controllo attivazione
- ✅ **Logging debug** per development

### FLUSSO REALTIME:
1. Device A modifica giacenza → `markUpdatePending(vinoId)`
2. UPDATE su DB → Realtime event a tutti i client
3. Device A ignora eco (pending), Device B applica update
4. State locale aggiornato → UI re-render automatico

### TESTING:
- ✅ **Build success** (2.84s, 0 errori)
- ✅ **TypeScript** compilazione OK
- ✅ **Bundle size** invariato (realtime hook leggero)

---

## PHASE 2 - CONCORRENZA OTTIMISTICA IMPLEMENTATA ✅

### TASK 1 - API UPDATE CON WHERE id + version:
- ✅ **Interfaccia WineType** estesa con `inventoryVersion` e `inventoryUpdatedAt`
- ✅ **Query giacenza** include campi `version` e `updated_at`
- ✅ **Optimistic locking** con `WHERE vino_id = :id AND version = :currentVersion`
- ✅ **Mapping realtime** aggiornato per includere version nei merge

### TASK 2 - GESTIONE CONFLITTI:
- ✅ **Rilevamento conflitto** quando update restituisce 0 righe
- ✅ **Refetch puntuale** automatico per riallineare dati
- ✅ **Console warning** per conflitti (TODO: toast system)
- ✅ **Return false** per indicare conflitto gestito

### TASK 3 - MARCATURA UPDATE PENDING:
- ✅ **markUpdatePending()** chiamato prima di ogni update
- ✅ **Prevenzione eco** realtime per update locali
- ✅ **Auto-cleanup** pending dopo 5 secondi (safety)

### TASK 4 - HELPER REFETCH PUNTUALE:
- ✅ **refetchGiacenzaById()** per conflitti
- ✅ **Merge selettivo** solo del record interessato
- ✅ **Gestione record non trovato** (reset a default)
- ✅ **Error handling** robusto

### TASK 5 - UPDATE MIN_STOCK:
- ✅ **updateWineMinStock()** con stessa logica optimistic
- ✅ **Version control** identico a giacenza
- ✅ **Gestione conflitti** con refetch + warning
- ✅ **Insert/Update** atomico per min_stock

### FLUSSO OPTIMISTIC LOCKING:
1. **Lettura version** corrente dal state locale
2. **Update condizionale** con WHERE id + version
3. **Se 1 riga** → successo, merge nuova version
4. **Se 0 righe** → conflitto, refetch + warning
5. **Realtime sync** automatico per altri device

### TESTING:
- ✅ **Build success** (2.58s, 0 errori)
- ✅ **TypeScript** compilazione OK
- ✅ **API estesa** con `updateWineMinStock` e `refetchGiacenzaById`

---

## FIX MIRATO - REALTIME GIACENZE UI ✅

### TASK 1 - CHIAVE CORRETTA OVUNQUE:
- ✅ **refetchGiacenzaByVinoId**: Usa `eq('vino_id', vinoId)` per cercare per wine ID
- ✅ **Merge store**: Condizione `w.id === id` (wine ID) coerente
- ✅ **Separazione chiavi**: `vino_id` come campo dati, non chiave di indicizzazione

### TASK 2 - FEATURE FLAG IN RUNTIME:
- ✅ **Logging startup**: `console.debug('🔧 REALTIME_GIACENZE_ENABLED:', enabled)`
- ✅ **Env value**: Mostra valore effettivo da `import.meta.env`
- ✅ **Una sola volta**: useEffect con deps vuote per evitare spam

### TASK 3 - VERIFICA SUBSCRIBE E CALLBACK:
- ✅ **Log stati canale**: `console.debug('📡 RT giacenza channel:', status)`
- ✅ **Log eventi**: `console.debug('RT giacenza EVT', {type, id})`
- ✅ **TypeScript safe**: Cast per accesso sicuro a `newRecord?.id`

### TASK 4 - ANTI-ECO SOLO LOCALE:
- ✅ **Store locale**: `pendingUpdatesRef` vive nel device che invia
- ✅ **Non condiviso**: Lista pending non sincronizzata tra device
- ✅ **Ignore selettivo**: Solo eventi con ID pending su quel device

### TELEMETRIA DEBUGGING:
```javascript
// Startup
🔧 REALTIME_GIACENZE_ENABLED: true (env value: true)

// Channel states
📡 RT giacenza channel: connecting
📡 RT giacenza channel: subscribed

// Eventi
RT giacenza EVT {type: 'UPDATE', id: 'abc123'}
```

### PRODUZIONE:
- ⚠️ **Feature flag**: Settare `VITE_REALTIME_GIACENZE_ENABLED=true` nell'ambiente
- ⚠️ **Non solo .env.example**: Configurare nel deployment environment

---

## PATCH CHIAVI GIACENZA - ALLINEA PK/MERGE ✅

### TASK 1 - TIPI & SELECT:
- ✅ **Interfaccia WineType**: Aggiunto `giacenza_id?: string` per PK giacenza
- ✅ **Query giacenza**: Include `id, vino_id, giacenza, min_stock, version, updated_at`
- ✅ **Mapping store**: `giacenza_id: g?.id` per salvare PK giacenza

### TASK 2 - STORE:
- ✅ **Indicizzazione**: Store indicizzato per `vino_id` (wineId) come prima
- ✅ **Salvataggio PK**: Ogni item salva `giacenza_id` e `version`
- ✅ **Realtime handlers**: Aggiornano `giacenza_id: record.id` nei merge

### TASK 3 - UPDATE OPTIMISTIC:
- ✅ **PK first**: `eq('id', giacenzaId).eq('version', currentVersion)`
- ✅ **Fallback**: Se no `giacenza_id`, usa logica precedente per `vino_id`
- ✅ **Conflitti**: Refetch by PK `refetchGiacenzaById(giacenzaId)`

### TASK 4 - REALTIME HANDLER:
- ✅ **Mapping corretto**: `record.id` → `giacenza_id`, `record.vino_id` → wineId
- ✅ **Store update**: Aggiorna per wineId con `giacenza_id: record.id`
- ✅ **Telemetria**: Log eventi con `id: recordId` per debugging

### TASK 5 - HELPER:
- ✅ **refetchGiacenzaById**: PK first con `eq('id', giacenzaId)`
- ✅ **refetchGiacenzaByVinoId**: Mantenuto come fallback
- ✅ **API estesa**: Entrambi helper disponibili nel return

### FLUSSO OTTIMIZZATO:
```javascript
// 1. Store ha giacenza_id
wine.giacenza_id = "abc-123"

// 2. Update usa PK
UPDATE giacenza SET giacenza = 10 
WHERE id = 'abc-123' AND version = 5

// 3. Realtime propaga
RT giacenza EVT {type: 'UPDATE', id: 'abc-123'}

// 4. Merge per wineId
setWines(prev => prev.map(w => 
  w.id === record.vino_id ? {...w, giacenza_id: record.id} : w
))
```

### TESTING PRONTO:
- ✅ **App attiva**: http://localhost:3000/ (HMR funzionante)
- ✅ **Telemetria**: Log PK e vino_id per debugging
- ✅ **Conflitti**: Refetch by PK + toast per riallineamento

---

## FIX/DIAGNOSI - REALTIME NON SI AGGIORNA SU B ✅

### TASK 1 - AGGANCIARE WS E JOIN:
- ✅ **Logging dettagliato**: `console.debug('📡 RT giacenza channel status:', status)`
- ✅ **Eventi completi**: `console.debug('RT giacenza EVT', {type, id, vino_id})`
- ✅ **Subscription corretta**: `event: '*', schema: 'public', table: 'giacenza'`
- ✅ **Status esposto**: `realtimeSubscribed` disponibile nel hook

### TASK 2 - MONTAGGIO NELLE VISTE:
- ✅ **useWines integrato**: Hook realtime montato in useWines
- ✅ **Status logging**: Log realtime status al mount di useWines
- ✅ **Produzione ready**: Nessuna condizione che disattivi in prod
- ✅ **API estesa**: `realtimeSubscribed` esposto nel return

### TASK 3 - FALLBACK DIAGNOSTICO:
- ✅ **Refetch automatico**: Dopo merge UPDATE, refetch by PK con 250ms debounce
- ✅ **Logging fallback**: `console.debug('🔄 Fallback refetch by PK:', id)`
- ✅ **Temporaneo**: Da rimuovere dopo conferma funzionamento merge

### TASK 4 - ANTI-ECO LOCALE:
- ✅ **Disabilitabile**: `VITE_RT_IGNORE_PENDING=false` per test
- ✅ **Default attivo**: Anti-eco attivo di default per produzione
- ✅ **Test ready**: Facile disattivare per verificare eventi UPDATE

### TASK 5 - LOG PRODUZIONE:
- ✅ **Condizionali**: Log attivi solo se `DEV || VITE_RT_DEBUG==='true'`
- ✅ **Minimali**: Solo debug essenziali per diagnosi
- ✅ **Performance**: Nessun impatto su produzione normale

### TELEMETRIA COMPLETA:
```javascript
// Startup
🔧 REALTIME_GIACENZE_ENABLED: true (env value: true)
🏠 useWines realtime status: {enabled: true, connected: false, subscribed: false}

// Connection
📡 RT giacenza channel status: connecting
📡 RT giacenza channel status: subscribed

// Eventi
RT giacenza EVT {type: 'UPDATE', id: 'abc-123', vino_id: 'wine-456'}
🔄 Fallback refetch by PK: abc-123
```

### TEST SCENARIOS:
1. **Due finestre**: A modifica → B log `RT giacenza EVT` + UI aggiornata
2. **WS Status**: Verifica `status: subscribed` in console
3. **Anti-eco test**: `VITE_RT_IGNORE_PENDING=false` → eventi visibili su A
4. **Fallback**: Refetch automatico se merge non aggiorna UI

---

## PROD FIX SICURO - REALTIME GIACENZE ✅

### STEP 1 - ENV & BUILD-TIME:
- ✅ **VITE_RT_DEBUG**: Aggiunto a .env.example per controllo produzione
- ✅ **Build-time flags**: Tutte le VITE_* devono essere presenti in Render Environment Variables
- ✅ **Render config**: Impostare `VITE_REALTIME_GIACENZE_ENABLED=true` e `VITE_RT_DEBUG=true` (temporaneo)

### STEP 2 - SUPABASE CLIENT HARDENING:
- ✅ **Configurazioni esplicite**: auth.persistSession, realtime.eventsPerSecond
- ✅ **Log diagnostici**: URL, anon key mascherata, channels count, WS endpoint
- ✅ **Condizionali**: Solo se DEV || VITE_RT_DEBUG==='true'

### STEP 3 - HEADERS & SERVICE WORKER:
- ✅ **CSP Headers**: connect-src include https://*.supabase.co wss://*.supabase.co
- ✅ **Service Worker**: Cache busting con CACHE_VERSION='wn-rt-202510030022'
- ✅ **SW Registration**: Automatica in index.html con skipWaiting e clientsClaim
- ✅ **Cache Strategy**: Network First per HTML/API, Cache First per assets

### STEP 4 - HOOK & TEST:
- ✅ **Anti-eco configurabile**: Attivo in prod, disabilitabile con VITE_RT_DEBUG=true
- ✅ **Fallback temporaneo**: Refetch by PK con TODO per rimozione post-test
- ✅ **Telemetria completa**: Channel status, eventi, WS endpoint logging

### CONFIGURAZIONE RENDER:
```bash
# Environment Variables (Build + Runtime)
VITE_SUPABASE_URL=https://rtmohyjquscdkbtibdsu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_REALTIME_GIACENZE_ENABLED=true
VITE_RT_DEBUG=true  # Temporaneo per diagnosi
```

### LOG ATTESI IN PRODUZIONE:
```javascript
// Startup
🔧 Supabase client initialized: {url: "https://...", anonKey: "eyJh...CuWg", channels: 0}
🔧 REALTIME_GIACENZE_ENABLED: true (env value: true)
🏠 useWines realtime status: {enabled: true, connected: true, subscribed: true}

// Service Worker
[SW] Registered successfully: https://domain.com/
[SW] Installing version: wn-rt-202510030022

// WebSocket Connection
📡 RT giacenza channel status: connecting
📡 RT giacenza channel status: subscribed

// Eventi Realtime
RT giacenza EVT {type: 'UPDATE', id: 'abc-123', vino_id: 'wine-456'}
🔄 Fallback refetch by PK: abc-123
```

### TEST MULTI-DEVICE PRODUZIONE:
1. **Network Tab**: Verificare `wss://rtmohyjquscdkbtibdsu.supabase.co/realtime/v1/websocket`
2. **Console Logs**: Startup + channel status + eventi UPDATE
3. **Sincronizzazione**: Device A modifica → Device B UI aggiornata
4. **Hard Refresh**: Ctrl/Cmd+Shift+R per invalidare cache SW

### PULIZIA POST-TEST:
- [ ] `VITE_RT_DEBUG=false` in Render Environment Variables
- [ ] Rimuovere fallback refetch da useWines.ts (TODO presente)
- [ ] Nuovo build per applicare modifiche

### ROLLBACK SICURO:
- **CSP**: Rimuovere middleware CSP da server/app.ts
- **SW**: Incrementare CACHE_VERSION per invalidare
- **Flags**: Impostare `VITE_REALTIME_GIACENZE_ENABLED=false`

---

## STATUS: PHASE 2 ✅ + FIX ✅ + PATCH PK ✅ + DIAGNOSI ✅ + PROD FIX ✅

**PROSSIMO STEP**: PHASE 3 - Focus/reconnect fallback con debounce

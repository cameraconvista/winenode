# REPORT — Stato Auto-Refresh Lista Vini (read-only) — 2025-11-06 22:40

## 1. Sintesi Esecutiva

- **Stato attuale auto-refresh**: Parziale
- **Meccanismi rilevati**: Realtime ✅ (giacenze), polling ❌, focus ❌
- **Rischio complessivo**: Medio - Realtime presente ma limitato, nessun fallback per disconnessioni

**Diagnosi**: L'app implementa Realtime Supabase solo per la tabella `giacenza` (inventario), ma non per la tabella `vini` (metadati). Non sono presenti meccanismi di fallback come polling o refresh on focus/reconnect. L'aggiornamento dei vini dal Google Apps Script non viene propagato automaticamente all'app.

## 2. File Coinvolti

### Architettura Data Layer
```
UI (HomePage) → useWines() → Supabase Client → Database
                    ↓
            useRealtimeGiacenza() → WebSocket → giacenza table
```

### File Critici

| File | Ruolo | Note |
|------|-------|------|
| `src/lib/supabase.ts` | Client Supabase | Configurazione realtime: eventsPerSecond: 10 |
| `src/hooks/useWines.ts` | Hook principale vini | 721 righe, gestisce fetch + realtime giacenze |
| `src/hooks/useRealtimeGiacenza.ts` | Realtime subscription | Solo tabella giacenza, debounce 50ms |
| `src/pages/HomePage/index.tsx` | UI principale | Consuma useWines, nessun refresh manuale |
| `src/pages/HomePage/hooks/useHomeHandlers.ts` | Handlers UI | refreshWines() disponibile ma non esposto |
| `src/services/supabaseGuard.ts` | Guardrail | Blocca scritture su tabella vini (read-only) |

## 3. React Query & Cache

**❌ ASSENTE**: L'app non utilizza React Query, TanStack Query o librerie di cache.

**Cache Strategy Attuale**:
- **State Management**: useState locale in useWines()
- **Invalidation**: Nessuna strategia di invalidazione automatica
- **Stale Time**: Non configurato
- **Background Refetch**: Solo via Realtime per giacenze

**Query Key Pattern**: Non applicabile - nessuna libreria di query caching.

## 4. Supabase & Realtime

### Client Configuration
```typescript
// src/lib/supabase.ts
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 }
  }
})
```

### Realtime Subscription (SOLO GIACENZE)
```typescript
// src/hooks/useRealtimeGiacenza.ts
const channel = supabase
  .channel('giacenza-changes')
  .on('postgres_changes', {
    event: '*', // INSERT | UPDATE | DELETE
    schema: 'public',
    table: 'giacenza'  // ⚠️ SOLO giacenze, NON vini
  }, handleRealtimeEvent)
```

### Gestione Ciclo di Vita
- ✅ **Subscribe**: Automatico su mount useWines()
- ✅ **Unsubscribe**: Cleanup su unmount
- ✅ **Debounce**: 50ms per batch processing
- ✅ **Anti-eco**: Previene loop su update locali
- ❌ **Reconnect**: Nessuna gestione esplicita di riconnessione

### Feature Flags
```bash
VITE_REALTIME_GIACENZE_ENABLED=true  # Attiva/disattiva realtime
VITE_RT_DEBUG=true                   # Debug logging
```

## 5. UX Refresh Manuale

### Pulsanti Refresh
- ❌ **Pulsante "Aggiorna"**: Non presente nell'UI
- ❌ **Pull-to-refresh**: Non implementato
- ❌ **Scorciatoie**: Nessuna (es. Ctrl+R intercettato)

### Refresh Disponibile ma Nascosto
```typescript
// src/hooks/useWines.ts - refreshWines() esiste ma non esposto
const { refreshWines } = useWines(); // ✅ Disponibile
// src/pages/HomePage/index.tsx - NON passato ai componenti
```

## 6. Rischi & Debolezze (Zero-impact)

### Rischi Architetturali
- **Realtime limitato**: Solo giacenze, non metadati vini
- **Nessun fallback**: Disconnessione WebSocket = nessun aggiornamento
- **Single point of failure**: Dipendenza totale da Realtime
- **Stale data**: Vini aggiunti/modificati da Apps Script non visibili

### Rischi UX
- **Frustrazione utente**: App "non aggiornata" dopo sync Google Sheets
- **Dati inconsistenti**: Giacenze aggiornate, metadati obsoleti
- **Nessun feedback**: Utente non sa se dati sono aggiornati

### Rischi Tecnici
- **Memory leak potenziale**: Subscription attiva anche su background
- **Race conditions**: Update simultanei senza coordinamento
- **Network issues**: Nessuna gestione offline/reconnect

## 7. Suggerimenti "Safe-Mode" (solo proposte)

### Hook Realtime Esteso (concept)
```typescript
// Estendere a tabella 'vini' per metadati
useRealtimeVini({
  onInsert: handleWineInsert,
  onUpdate: handleWineUpdate,
  onDelete: handleWineDelete
})
```

### Fallback Polling Leggero
```typescript
// Polling ogni 5 minuti quando Realtime disconnesso
useEffect(() => {
  if (!realtimeConnected) {
    const interval = setInterval(refreshWines, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }
}, [realtimeConnected]);
```

### Refresh on Focus/Reconnect
```typescript
// Standard web app pattern
useEffect(() => {
  const handleFocus = () => refreshWines();
  const handleOnline = () => refreshWines();
  
  window.addEventListener('focus', handleFocus);
  window.addEventListener('online', handleOnline);
  
  return () => {
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('online', handleOnline);
  };
}, []);
```

### Pulsante Refresh Opzionale
```typescript
// Header con pulsante discreto
<button onClick={refreshWines} className="refresh-btn">
  <RefreshIcon />
</button>
```

## 8. Next Step Proposto (minimo e reversibile)

### Intervento 1: Pulsante Refresh Manuale
- **Scopo**: Permettere refresh immediato quando necessario
- **File target**: `src/pages/HomePage/components/Header.tsx`
- **Rischi**: Nulli - solo aggiunta UI opzionale
- **Rollback**: Rimozione pulsante in <5 minuti

### Intervento 2: Refresh on Window Focus
- **Scopo**: Auto-refresh quando utente torna sull'app
- **File target**: `src/hooks/useWines.ts`
- **Rischi**: Nulli - pattern standard web
- **Rollback**: Rimozione listener in <2 minuti

### Intervento 3: Realtime su Tabella Vini
- **Scopo**: Propagare modifiche metadati da Apps Script
- **File target**: `src/hooks/useRealtimeVini.ts` (nuovo)
- **Rischi**: Bassi - stessa architettura di giacenze
- **Rollback**: Feature flag disable immediato

## 9. Allegati Tecnici

### Inizializzazione Supabase
```typescript
// src/lib/supabase.ts (mascherato)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } }
})
```

### useWines Hook (estratto)
```typescript
// src/hooks/useWines.ts
const useWines = () => {
  const [wines, setWines] = useState<WineType[]>([]);
  const realtimeEnabled = import.meta.env.VITE_REALTIME_GIACENZE_ENABLED === 'true';
  
  const fetchWines = async () => {
    const [{ data: viniData }, { data: giacenzeData }] = await Promise.all([
      supabase.from('vini').select('*').order('nome_vino', { ascending: true }),
      supabase.from('giacenza').select('id, vino_id, giacenza, min_stock, version, updated_at')
    ]);
    // Mapping e merge dati...
  };
  
  return {
    wines, loading, error,
    refreshWines: fetchWines, // ⚠️ Disponibile ma non esposto in UI
    realtimeConnected: realtimeEnabled ? realtimeConnected : false
  };
};
```

### Realtime Listener (estratto)
```typescript
// src/hooks/useRealtimeGiacenza.ts
const channel = supabase
  .channel('giacenza-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'giacenza'  // Solo giacenze
  }, (payload) => {
    // Debounce batch processing
    addToBatch(payload.eventType, payload.new);
  })
  .subscribe();
```

---

**Conclusione**: L'app ha una base Realtime solida per le giacenze ma manca di meccanismi per aggiornare i metadati vini e di fallback per disconnessioni. Gli interventi proposti sono minimali e reversibili, focalizzati su UX e robustezza senza modifiche architetturali invasive.

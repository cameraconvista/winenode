# 🔍 Feature: Ricerca Lente in Home

## Scopo
Implementa una funzionalità di ricerca locale e reattiva nella HomePage per filtrare i vini per nome in tempo reale.

## UX/UI
- **Icona lente**: Posizionata nella bottom navbar tra campanella e pulsante "Tutti"
- **Asset icona**: Lucide React Search con `fill="none"`, `strokeWidth="2px"`, dimensioni 22pt
- **Campo ricerca**: Appare sopra la lista vini quando attivato
- **Filtro reattivo**: Debounce 200ms, case-insensitive, accent-insensitive
- **Clear rapido**: Pulsante ✕ per svuotare, Esc per chiudere

## Layout Navbar
- **Gruppo icone**: Carrello, Filtri, Alert, **Lente** (con variabili spacing)
- **Pulsante "Tutti"**: Invariato, posizionato a destra con `margin-left: auto`
- **Variabili CSS**: `--nav-icon-gap: 8pt`, `--nav-icon-right-inset: 12pt`

## Feature Flag
```typescript
// src/config/features.ts
export const features = {
  searchLens: true, // Abilita/disabilita la ricerca
} as const;
```

## API Interna

### Hook useWineSearch
```typescript
const wineSearch = useWineSearch(wines);

// Stato
wineSearch.searchQuery      // Query corrente
wineSearch.isSearchOpen     // Se il campo è aperto
wineSearch.filteredWines    // Vini filtrati
wineSearch.hasResults       // Se ci sono risultati
wineSearch.isFiltering      // Se sta filtrando

// Actions
wineSearch.openSearch()     // Apre il campo
wineSearch.closeSearch()    // Chiude e resetta
wineSearch.clearSearch()    // Svuota query
wineSearch.updateQuery(q)   // Aggiorna query
```

### Componente WineSearchBar
```typescript
<WineSearchBar
  isOpen={boolean}
  searchQuery={string}
  onQueryChange={(query: string) => void}
  onClose={() => void}
  onClear={() => void}
/>
```

## Logica Filtro
1. **Solo nome vino**: Filtra esclusivamente su `wine.name`
2. **Normalizzazione**: Case-insensitive + rimozione accenti
3. **Debounce**: 200ms per performance
4. **Combinazione**: Applica ricerca sui vini già filtrati (categoria, fornitore, alert)

## Esempi
- `"AM"` → trova "AMARONE DELLA VALPOLICELLA"
- `"aligo"` → trova "BOURGOGNE ALIGOTÉ" 
- `"brut"` → trova tutti i vini con "BRUT" nel nome

## Performance
- **O(n)** sul dataset corrente (già filtrato)
- **Nessuna chiamata rete** aggiuntiva
- **Memoization** per evitare re-render inutili

## Fallback/Rollback
- **Disattiva flag**: `features.searchLens = false` nasconde completamente la funzione
- **Revert PR**: Rimuove codice senza impatti su funzionalità esistenti

## File Coinvolti
- `src/config/features.ts` - Feature flag
- `src/hooks/useWineSearch.ts` - Logica ricerca
- `src/hooks/useDebounce.ts` - Utility debounce
- `src/components/search/WineSearchBar.tsx` - UI ricerca
- `src/pages/HomePage.tsx` - Integrazione

## Test
- Unit: Normalizzazione stringhe, match case-insensitive
- UI: Toggle, input, clear, Esc, back-button mobile
- Regressioni: Campanella, navbar, scroll invariati

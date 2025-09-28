# REPORT SNELLIMENTO CHIRURGICO - CARTELLA `public/`

**Data Analisi:** 27 settembre 2025 - 11:10  
**Cartella Target:** `/public/`  
**Metodologia:** Analisi FASE 1 (ANALISI-ONLY) - Nessuna modifica applicata

---

## 📊 MAPPATURA GERARCHICA COMPLETA

### Struttura Cartella `public/` (12 items - 717.4 KB totali)

```
📁 public/ (717.4 KB totali)
├── 📄 allert.png (1.076 bytes) ✅ UTILIZZATO
├── 📄 carrello.png (670 bytes) ✅ UTILIZZATO  
├── 📄 filtro.png (507 bytes) ✅ UTILIZZATO
├── 📄 iconwinenode.png (38.321 bytes) ✅ UTILIZZATO (PWA)
├── 📄 logo 2 CCV.png (64.505 bytes) ✅ UTILIZZATO
├── 📄 logo 2 CCV.webp (137.222 bytes) ❌ NON UTILIZZATO
├── 📄 logo1.png (56.867 bytes) ✅ UTILIZZATO
├── 📄 logo1.webp (26.068 bytes) ✅ UTILIZZATO
├── 📄 logo2.png (140.300 bytes) ✅ UTILIZZATO
├── 📄 logo2.webp (154.542 bytes) ❌ NON UTILIZZATO
├── 📄 logoapp.webp (98.200 bytes) ❌ NON UTILIZZATO
└── 📄 manifest.json (623 bytes) ✅ UTILIZZATO
```

---

## 🔍 MATRICE DELLE DIPENDENZE

### ✅ FILE UTILIZZATI (9/12 - 75%)

#### **Icone Toolbar (Sistema Mask CSS)**
- **`allert.png`** (1.076 bytes)
  - **Riferimenti:** 6 occorrenze
  - **Utilizzo:** Sistema mask CSS per campanelle alert
  - **File:** `toolbar.css`, `mobile-standard.css`, `wine-cards.css`, `HomePage.tsx`
  - **Critico:** ✅ Sistema UI core

- **`carrello.png`** (670 bytes)
  - **Riferimenti:** 3 occorrenze  
  - **Utilizzo:** Sistema mask CSS per pulsante "Ordine"
  - **File:** `toolbar.css`, `mobile-standard.css`
  - **Critico:** ✅ Sistema UI core

- **`filtro.png`** (507 bytes)
  - **Riferimenti:** 3 occorrenze
  - **Utilizzo:** Sistema mask CSS per pulsante "Filtri"  
  - **File:** `toolbar.css`, `mobile-standard.css`
  - **Critico:** ✅ Sistema UI core

#### **PWA & Manifest**
- **`iconwinenode.png`** (38.321 bytes)
  - **Riferimenti:** 3 occorrenze
  - **Utilizzo:** PWA icon (192x192 e 512x512)
  - **File:** `manifest.json`, `index.html`
  - **Critico:** ✅ PWA essenziale

- **`manifest.json`** (623 bytes)
  - **Riferimenti:** 2 occorrenze
  - **Utilizzo:** PWA manifest
  - **File:** `index.html`, documentazione
  - **Critico:** ✅ PWA essenziale

#### **Loghi Brand**
- **`logo 2 CCV.png`** (64.505 bytes)
  - **Riferimenti:** 10 occorrenze
  - **Utilizzo:** Logo alternativo in pagine specifiche
  - **File:** `ImportaPage.tsx`, `ManualWineInsertPage.tsx`, `FornitoriPage.tsx`, `PreferenzePage.tsx`
  - **Critico:** ✅ Brand identity

- **`logo1.png`** (56.867 bytes)
  - **Riferimenti:** 15 occorrenze
  - **Utilizzo:** Logo principale + fallback per WebP
  - **File:** `HomePage.tsx`, `GestisciOrdiniPage.tsx`, `CreaOrdinePage.tsx`, `RiepilogoOrdinePage.tsx`, `SmartGestisciModal.tsx`
  - **Critico:** ✅ Brand identity core

- **`logo1.webp`** (26.068 bytes)
  - **Riferimenti:** 11 occorrenze
  - **Utilizzo:** Versione ottimizzata WebP di logo1.png
  - **File:** Stesso pattern di logo1.png (picture/source)
  - **Critico:** ✅ Performance optimization

- **`logo2.png`** (140.300 bytes)
  - **Riferimenti:** 1 occorrenza
  - **Utilizzo:** Logo specifico per `TabellaViniPage.tsx`
  - **File:** `TabellaViniPage.tsx`
  - **Critico:** ✅ Pagina specifica

### ❌ FILE NON UTILIZZATI (3/12 - 25%)

#### **Asset Orfani - 0 Occorrenze Reali**
- **`logo 2 CCV.webp`** (137.222 bytes)
  - **Riferimenti:** 0 occorrenze nel codice attivo
  - **Stato:** Solo menzionato in `REPORT_STRUTTURA_PROGETTO.txt` (documentazione)
  - **Rischio Rimozione:** BASSO - Nessun riferimento funzionale

- **`logo2.webp`** (154.542 bytes)
  - **Riferimenti:** 0 occorrenze nel codice attivo
  - **Stato:** Solo menzionato in `REPORT_STRUTTURA_PROGETTO.txt` (documentazione)
  - **Rischio Rimozione:** BASSO - Nessun riferimento funzionale

- **`logoapp.webp`** (98.200 bytes)
  - **Riferimenti:** 0 occorrenze nel codice attivo
  - **Stato:** Solo menzionato in `REPORT_STRUTTURA_PROGETTO.txt` (documentazione)
  - **Rischio Rimozione:** BASSO - Nessun riferimento funzionale

---

## 🔄 ANALISI DUPLICATI/NEAR-DUPLICATE

### Coppie Logo Duplicate (Stesso Contenuto, Formati Diversi)
- **`logo1.png` ↔ `logo1.webp`**: Stesso logo, formati diversi (PNG/WebP)
  - **Stato:** ✅ ENTRAMBI UTILIZZATI (pattern picture/source per performance)
  - **Azione:** MANTIENI - Sistema ottimizzazione performance

### Loghi Simili (Contenuto Diverso)
- **`logo 2 CCV.png` vs `logo1.png`**: Loghi brand diversi
  - **Differenza:** Design e dimensioni diverse
  - **Utilizzo:** Pagine diverse dell'app
  - **Azione:** MANTIENI - Brand identity multipla

### Asset Orfani WebP
- **`logo 2 CCV.webp`**: Versione WebP di `logo 2 CCV.png` mai utilizzata
- **`logo2.webp`**: Versione WebP di `logo2.png` mai utilizzata  
- **`logoapp.webp`**: Asset standalone mai referenziato

---

## 📏 ANALISI ASSET OVERSIZED

### File Pesanti (>50KB)
1. **`logo2.webp`** (154.542 bytes) ❌ NON UTILIZZATO
   - **Suggerimento:** ELIMINA - 154KB risparmiati
   
2. **`logo2.png`** (140.300 bytes) ✅ UTILIZZATO
   - **Suggerimento:** Ottimizza dimensioni se possibile (target: <100KB)
   
3. **`logo 2 CCV.webp`** (137.222 bytes) ❌ NON UTILIZZATO
   - **Suggerimento:** ELIMINA - 137KB risparmiati
   
4. **`logoapp.webp`** (98.200 bytes) ❌ NON UTILIZZATO
   - **Suggerimento:** ELIMINA - 98KB risparmiati

5. **`logo 2 CCV.png`** (64.505 bytes) ✅ UTILIZZATO
   - **Suggerimento:** Considera compressione PNG (target: <50KB)

6. **`logo1.png`** (56.867 bytes) ✅ UTILIZZATO
   - **Suggerimento:** Considera compressione PNG (target: <50KB)

### File Ottimali (<50KB)
- **`iconwinenode.png`** (38.321 bytes) ✅ Dimensione appropriata per PWA
- **`logo1.webp`** (26.068 bytes) ✅ Ottimizzazione WebP eccellente
- **`allert.png`** (1.076 bytes) ✅ Icona perfetta
- **`carrello.png`** (670 bytes) ✅ Icona perfetta
- **`filtro.png`** (507 bytes) ✅ Icona perfetta
- **`manifest.json`** (623 bytes) ✅ Configurazione PWA

---

## 💾 IMPATTO PREVISTO SUL BUNDLE/BUILD

### Peso Attuale Cartella `public/`
- **Totale:** 717.4 KB
- **Utilizzati:** 327.6 KB (45.7%)
- **Non utilizzati:** 389.8 KB (54.3%)

### Risparmio Potenziale
- **Eliminazione asset orfani:** 389.8 KB (-54.3%)
- **Ottimizzazione PNG utilizzati:** ~30-50 KB aggiuntivi
- **Risparmio totale stimato:** ~420-440 KB

### Impatto Performance
- **Bundle JS/CSS:** Nessun impatto (asset statici)
- **Network requests:** -3 richieste potenziali (asset orfani)
- **Cache browser:** Riduzione footprint cache
- **PWA size:** Riduzione dimensione app installata

---

## ⚠️ AMBIGUITÀ RILEVATE

### Nessuna Ambiguità Critica
Tutti i riferimenti sono stati verificati con ricerca case-insensitive su:
- Import/require (TS/TSX/JS)
- CSS url()
- HTML `<img>`, `<link>`, `<source>`
- manifest.json
- Documentazione MD

### File Recovery
I file in `.recovery/snapshots/` contengono riferimenti obsoleti a `logo 2 CCV` ma sono snapshot storici, non codice attivo.

---

## 🎯 CONCLUSIONI ANALISI

### Stato Salute Cartella `public/`
- **✅ Organizzazione:** Buona, asset categorizzati
- **✅ Utilizzo:** 75% asset utilizzati attivamente  
- **⚠️ Ottimizzazione:** 54% peso eliminabile (asset orfani)
- **✅ Performance:** Sistema WebP implementato correttamente

### Raccomandazioni Prioritarie
1. **ALTA:** Eliminazione asset orfani (389KB risparmiati)
2. **MEDIA:** Ottimizzazione PNG utilizzati (compressione lossless)
3. **BASSA:** Monitoraggio utilizzo futuro asset

### Sicurezza Operazione
- **Rischio:** BASSO - Asset orfani senza riferimenti
- **Rollback:** Backup automatico pre-operazione
- **Test:** Nessun impatto su funzionalità esistenti

---

**Report generato automaticamente - FASE 1 ANALISI COMPLETATA**  
**Prossimo step:** Generazione Piano Azione con ID specifici per esecuzione selettiva

# 📋 CHANGELOG - WineNode

## [2025-09-23 16:04] Step 4 — Ottimizzazione asset & Pulizia definitiva
- **Compressione PNG attivi** (near-lossless) con pngquant quality 75-90%:
  - logoapp.png: 272K → 186K (-32%, -86KB)  
  - iconwinenode.png: 126K → 37K (-71%, -89KB)
  - logo 2 CCV.png: 73K → 63K (-14%, -10KB)
  - **Totale risparmiato**: 185KB (-40%)
- **Eliminazione definitiva** staging areas (_DA_ELIMINARE*, LEGACY obsoleti): 3.616MB liberati
- **Zero regressioni**: build stabile 4.33s, bundle invariato 170KB
- **Qualità preservata**: lossless/near-lossless, trasparenza e colori brand mantenuti
- **Report completo**: DOCS/REPORT_STEP4_ASSET_OTTIMIZZAZIONE.md

## [2025-09-23 15:31] Modularizzazione CSS Completa  
- **Struttura modulare**: CSS suddiviso in 8 moduli organizzati per funzionalità
- **File originale**: 1711 righe → struttura ottimizzata con imports
- **Eliminati duplicati**: zero conflitti CSS, manutenzione semplificata
- **Performance migliorate**: CSS più leggero e organizzato
- **Backup sicuri**: file originali archiviati in src/styles/archived/

## [2025-09-23 15:43] Step 2 — Pulizia Legacy (Staging)
- **File legacy identificati**: 2.8MB spostati in staging (non eliminati)
- **Categorizzazione**: 25+ file obsoleti (screenshot, duplicate, script)
- **Staging sicuro**: ARCHIVIATI/_DA_ELIMINARE/ per eliminazione futura
- **Zero regressioni**: build e funzionalità integre
- **Report**: DOCS/REPORT_STEP2_LEGACY.md

## [2025-09-23 15:39] Step 1 — Sicurezza Dipendenze
- **Vulnerabilità HIGH risolta**: axios DoS fix (1 package aggiornato)
- **5 moderate residue**: esbuild dev-only (accettabili, no breaking changes)
- **Build stabile**: 3.96s mantenuto, zero regressioni
- **Report**: DOCS/REPORT_STEP1_SICUREZZA.md

## [2025-09-23 15:19] UI Polish v8.1 + Mobile Optimization
- **Logo ingrandito**: +40% (28px → 39px) su tutti i dispositivi
- **Toolbar ottimizzata**: abbassata ~8-10mm, icone uniformi #541111
- **Blocco rotazione**: solo orientamento verticale su smartphone
- **Touch optimization**: eliminato highlight, performance CSS
- **CSS modulare**: struttura organizzata per manutenzione

## [2025-09-22] Baseline Progetto
- **Tema light**: palette #fff9dc background, #541111 text
- **Toolbar bottom**: 4 pulsanti [Ordine|Filtri|Allert|TUTTI]
- **Assets ottimizzati**: logo1.png, allert.png, carrello.png, filtro.png
- **PWA ready**: manifest.json, iconwinenode.png
- **Mobile-first**: responsive design, safe-area insets

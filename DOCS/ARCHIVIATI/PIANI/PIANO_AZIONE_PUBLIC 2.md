# PIANO AZIONE SNELLIMENTO - CARTELLA `public/`

**Data Piano:** 27 settembre 2025 - 11:10  
**Cartella Target:** `/public/`  
**Risparmio Totale Stimato:** 389.8 KB (-54.3%)

---

## 🎯 AZIONI PROPOSTE

### **AZ-001** | Eliminazione Asset Orfano `logo 2 CCV.webp`
- **File:** `/public/logo 2 CCV.webp` (137.222 bytes)
- **Motivazione:** 0 occorrenze nel codice attivo, solo menzionato in documentazione
- **Rischio:** **BASSO** - Nessun riferimento funzionale verificato
- **Risparmio:** 137 KB
- **Rollback:** Ripristino da backup pre-operazione
- **Verifica:** Ricerca case-insensitive su tutto il repo = 0 risultati

### **AZ-002** | Eliminazione Asset Orfano `logo2.webp`
- **File:** `/public/logo2.webp` (154.542 bytes)
- **Motivazione:** 0 occorrenze nel codice attivo, solo menzionato in documentazione
- **Rischio:** **BASSO** - Nessun riferimento funzionale verificato
- **Risparmio:** 154 KB
- **Rollback:** Ripristino da backup pre-operazione
- **Verifica:** Ricerca case-insensitive su tutto il repo = 0 risultati

### **AZ-003** | Eliminazione Asset Orfano `logoapp.webp`
- **File:** `/public/logoapp.webp` (98.200 bytes)
- **Motivazione:** 0 occorrenze nel codice attivo, solo menzionato in documentazione
- **Rischio:** **BASSO** - Nessun riferimento funzionale verificato
- **Risparmio:** 98 KB
- **Rollback:** Ripristino da backup pre-operazione
- **Verifica:** Ricerca case-insensitive su tutto il repo = 0 risultati

### **AZ-004** | Ottimizzazione Lossless `logo2.png`
- **File:** `/public/logo2.png` (140.300 bytes)
- **Motivazione:** File utilizzato ma oversized, ottimizzazione possibile
- **Rischio:** **BASSO** - Compressione lossless senza alterazione visiva
- **Risparmio:** ~20-40 KB stimati
- **Rollback:** Backup originale pre-ottimizzazione
- **Verifica:** Utilizzato in `TabellaViniPage.tsx`

### **AZ-005** | Ottimizzazione Lossless `logo 2 CCV.png`
- **File:** `/public/logo 2 CCV.png` (64.505 bytes)
- **Motivazione:** File utilizzato ma ottimizzabile
- **Rischio:** **BASSO** - Compressione lossless senza alterazione visiva
- **Risparmio:** ~10-20 KB stimati
- **Rollback:** Backup originale pre-ottimizzazione
- **Verifica:** Utilizzato in `ImportaPage.tsx`, `ManualWineInsertPage.tsx`, etc.

### **AZ-006** | Ottimizzazione Lossless `logo1.png`
- **File:** `/public/logo1.png` (56.867 bytes)
- **Motivazione:** File core utilizzato ma ottimizzabile
- **Rischio:** **BASSO** - Compressione lossless senza alterazione visiva
- **Risparmio:** ~10-15 KB stimati
- **Rollback:** Backup originale pre-ottimizzazione
- **Verifica:** Utilizzato in 5 pagine principali + modale

### **AZ-007** | Ottimizzazione Lossless `iconwinenode.png`
- **File:** `/public/iconwinenode.png` (38.321 bytes)
- **Motivazione:** PWA icon ottimizzabile mantenendo qualità
- **Rischio:** **MEDIO** - Icon PWA critica, test approfonditi necessari
- **Risparmio:** ~5-10 KB stimati
- **Rollback:** Backup originale + test PWA
- **Verifica:** Utilizzato in `manifest.json` (192x192, 512x512)

---

## 📋 MATRICE ESECUZIONE

### Priorità ALTA (Esecuzione Immediata Raccomandata)
- **AZ-001** ✅ Eliminazione `logo 2 CCV.webp`
- **AZ-002** ✅ Eliminazione `logo2.webp`  
- **AZ-003** ✅ Eliminazione `logoapp.webp`

### Priorità MEDIA (Esecuzione Opzionale)
- **AZ-004** ⚠️ Ottimizzazione `logo2.png`
- **AZ-005** ⚠️ Ottimizzazione `logo 2 CCV.png`
- **AZ-006** ⚠️ Ottimizzazione `logo1.png`

### Priorità BASSA (Valutazione Futura)
- **AZ-007** ⏸️ Ottimizzazione `iconwinenode.png` (PWA critica)

---

## 🛡️ PROTOCOLLO SICUREZZA

### Pre-Esecuzione
1. **Backup Automatico:** `backup_YYYYMMDD_HHMM.tar.gz` in `Backup_Automatico/`
2. **Verifica Git:** Status pulito, nessuna modifica pending
3. **Test Build:** `npm run build` successful pre-operazione

### Durante Esecuzione
1. **Eliminazioni:** `rm` definitivo (no archiviazione)
2. **Ottimizzazioni:** Tool lossless (pngcrush, optipng, imagemin)
3. **Log Dettagliato:** Ogni azione in `DOCS/LOG_PUBLIC.txt`

### Post-Esecuzione
1. **Test Build:** `npm run build` successful post-operazione
2. **Test PWA:** Verifica manifest e icone funzionanti
3. **Test UI:** Verifica toolbar e loghi visibili
4. **Commit Atomico:** Messaggio descrittivo con ID azioni

---

## 📊 IMPATTO PREVISTO PER ID

| ID | Azione | File | Risparmio | Rischio | Test Richiesti |
|---|---|---|---|---|---|
| AZ-001 | Elimina | logo 2 CCV.webp | 137 KB | BASSO | Build |
| AZ-002 | Elimina | logo2.webp | 154 KB | BASSO | Build |
| AZ-003 | Elimina | logoapp.webp | 98 KB | BASSO | Build |
| AZ-004 | Ottimizza | logo2.png | ~30 KB | BASSO | Build + UI |
| AZ-005 | Ottimizza | logo 2 CCV.png | ~15 KB | BASSO | Build + UI |
| AZ-006 | Ottimizza | logo1.png | ~12 KB | BASSO | Build + UI |
| AZ-007 | Ottimizza | iconwinenode.png | ~8 KB | MEDIO | Build + PWA |

### Totale Risparmio
- **Solo Eliminazioni (AZ-001,002,003):** 389 KB garantiti
- **Con Ottimizzazioni (AZ-004,005,006):** ~446 KB stimati
- **Completo (tutti ID):** ~454 KB stimati

---

## 🔧 COMANDI ESECUZIONE

### Script Interno Generato
```bash
# FASE 2: ESECUZIONE SELETTIVA (solo dopo approvazione)
# Esempio per ID approvati: AZ-001,AZ-002,AZ-003

# Backup automatico
npm run backup

# Eliminazioni (ID approvati)
rm "/Users/liam/Documents/winenode_main/public/logo 2 CCV.webp"  # AZ-001
rm "/Users/liam/Documents/winenode_main/public/logo2.webp"       # AZ-002  
rm "/Users/liam/Documents/winenode_main/public/logoapp.webp"     # AZ-003

# Test build
npm run build

# Commit
git add -A
git commit -m "chore(public): snellimento chirurgico, rimozione asset orfani (AZ-001,002,003) - 389KB risparmiati"
```

### Ottimizzazioni (se approvate)
```bash
# Ottimizzazioni lossless (esempio AZ-004,005,006)
pngcrush -ow "/Users/liam/Documents/winenode_main/public/logo2.png"
pngcrush -ow "/Users/liam/Documents/winenode_main/public/logo 2 CCV.png"  
pngcrush -ow "/Users/liam/Documents/winenode_main/public/logo1.png"
```

---

## ✅ CHECKLIST APPROVAZIONE

### Prima dell'Esecuzione
- [ ] Backup automatico completato
- [ ] Build test successful
- [ ] Git status pulito
- [ ] ID azioni selezionati e approvati

### Durante l'Esecuzione  
- [ ] Log dettagliato attivo
- [ ] Ogni azione tracciata con timestamp
- [ ] Errori gestiti e loggati

### Dopo l'Esecuzione
- [ ] Build test successful
- [ ] UI test completato (loghi visibili)
- [ ] PWA test completato (se AZ-007)
- [ ] Commit atomico eseguito
- [ ] Log finale generato

---

## 🚨 ROLLBACK PROCEDURE

### In Caso di Problemi
1. **Stop immediato** esecuzione azioni rimanenti
2. **Ripristino da backup:** `npm run backup:restore`
3. **Verifica funzionalità** complete
4. **Report problema** in `DOCS/LOG_PUBLIC.txt`

### File Rollback Specifici
- **AZ-001:** Ripristina `logo 2 CCV.webp` da backup
- **AZ-002:** Ripristina `logo2.webp` da backup  
- **AZ-003:** Ripristina `logoapp.webp` da backup
- **AZ-004,005,006,007:** Ripristina originali da backup

---

## 🎯 AZIONI ESEGUITE

### FASE 2 COMPLETATA - 27/09/2025 11:39

**ID APPROVATI ED ESEGUITI:**
- ✅ **AZ-001** | Eliminato `logo 2 CCV.webp` (137KB risparmiati)
- ✅ **AZ-002** | Eliminato `logo2.webp` (154KB risparmiati)  
- ✅ **AZ-003** | Eliminato `logoapp.webp` (98KB risparmiati)

**RISULTATI:**
- **Risparmio totale:** 389KB (-54,3% cartella public/)
- **Build test:** ✅ SUCCESSO (4.36s, 0 errori)
- **Verifiche sicurezza:** ✅ Nessun riferimento rotto
- **Backup pre-operazione:** `backup_27092025_113932.tar.gz` (1.26MB)

**LOG DETTAGLIATO:** Vedi `DOCS/LOG_PUBLIC.txt`

---

**Piano Azione generato automaticamente - ESECUZIONE COMPLETATA**  
**Stato:** FASE 2 completata con successo per ID AZ-001, AZ-002, AZ-003

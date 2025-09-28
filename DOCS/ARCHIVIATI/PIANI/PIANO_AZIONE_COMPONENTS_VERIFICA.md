# PIANO AZIONE COMPONENTS - POST VERIFICA "DUBBI"

**Data Piano:** 27 settembre 2025 - 18:16  
**Basato su:** VERIFICA_COMPONENTS_DUBBI.md  
**Metodologia:** Azioni atomiche post-analisi approfondita  
**Risparmio Totale Stimato:** 4.420 bytes (-1.8% components dubbi)

---

## 🎯 AZIONI PROPOSTE (POST-VERIFICA)

### **AZ-C001** | Rimozione FornitoreModal Orfano
- **Tipo:** REMOVE
- **File:** `/src/components/FornitoreModal.tsx` (4.420 bytes)
- **Motivazione:** Componente orfano confermato - 0 occorrenze esterne
- **Verifica:** Ricerca approfondita in tutto il repo (src, server, scripts, docs)
- **Rischio:** **BASSO** - Nessun impatto funzionale
- **Risparmio:** 4.420 bytes
- **Rollback:** Ripristino da backup se necessario
- **Beneficio:** Pulizia codebase, riduzione manutenzione
- **Overlap:** Eliminazione ridondanza con AddSupplierModal + EditSupplierModal
- **Prerequisiti:** Backup completo repo
- **Test post-rimozione:** Build + TypeCheck + verifica funzionalità fornitori

### **AZ-C002** | Mantenimento WineDetailsModal
- **Tipo:** KEEP
- **File:** `/src/components/WineDetailsModal.tsx` (9.649 bytes)
- **Motivazione:** Utilizzato attivamente in HomePage per dettagli vini
- **Riferimenti:** 4 occorrenze in HomePage.tsx
- **Rischio:** **BASSO** - Componente stabile
- **Beneficio:** Funzionalità core dettagli vini mantenuta
- **Dipendenze:** WineType interface, suppliers array

### **AZ-C003** | Mantenimento CarrelloOrdiniModal
- **Tipo:** KEEP
- **File:** `/src/components/modals/CarrelloOrdiniModal.tsx` (2.605 bytes)
- **Motivazione:** Utilizzato attivamente in HomePage per carrello ordini
- **Riferimenti:** 2 occorrenze in HomePage.tsx
- **Rischio:** **BASSO** - Componente stabile
- **Beneficio:** Funzionalità carrello ordini mantenuta
- **Dipendenze:** useCarrelloOrdini hook

### **AZ-C004** | Mantenimento ConfermaEliminazioneModal
- **Tipo:** KEEP
- **File:** `/src/components/modals/ConfermaEliminazioneModal.tsx` (3.608 bytes)
- **Motivazione:** Utilizzato attivamente in GestisciOrdiniPage per conferme
- **Riferimenti:** 2 occorrenze in GestisciOrdiniPage.tsx
- **Rischio:** **BASSO** - Pattern UX importante
- **Beneficio:** UX conferma eliminazione mantenuta
- **Dipendenze:** Nessuna dipendenza esterna

### **AZ-C005** | Mantenimento NuovoOrdineModal
- **Tipo:** KEEP
- **File:** `/src/components/modals/NuovoOrdineModal.tsx` (3.662 bytes)
- **Motivazione:** Utilizzato attivamente in HomePage per nuovi ordini
- **Riferimenti:** 2 occorrenze in HomePage.tsx
- **Rischio:** **BASSO** - Funzionalità core
- **Beneficio:** Funzionalità creazione ordini mantenuta
- **Dipendenze:** useNuovoOrdine hook, suppliers array

### **AZ-C006** | Mantenimento OrdineRicevutoCard
- **Tipo:** KEEP
- **File:** `/src/components/orders/OrdineRicevutoCard.tsx` (7.421 bytes)
- **Motivazione:** Utilizzato attivamente in GestisciOrdiniPage per ordini archiviati
- **Riferimenti:** 2 occorrenze in GestisciOrdiniPage.tsx
- **Rischio:** **BASSO** - UI specializzata
- **Beneficio:** UI ordini archiviati mantenuta
- **Dipendenze:** Ordine interface, ORDINI_LABELS constants

---

## 📊 IMPATTO STIMATO

### Immediate (Post AZ-C001)
- **Risparmio:** 4.420 bytes (-1.8% components dubbi)
- **File rimossi:** 1/6 components dubbi
- **Manutenibilità:** +5% (meno overlap fornitori)

### A Medio Termine
- **Code clarity:** Eliminazione componente legacy
- **Architecture:** Architettura fornitori più pulita
- **Developer Experience:** Meno confusione su modali fornitori

### A Lungo Termine
- **Maintainability:** Riduzione superficie manutenzione
- **Performance:** Bundle leggermente più leggero
- **Consistency:** Architettura modali più coerente

---

## 🔄 SEQUENZA ESECUZIONE RACCOMANDATA

### Fase 1: Preparazione
1. **Backup completo** repository
2. **Verifica build** corrente funzionante
3. **Documentazione** stato pre-rimozione

### Fase 2: Rimozione Sicura (AZ-C001)
1. **Rimuovi** `/src/components/FornitoreModal.tsx`
2. **Verifica** nessun import rotto
3. **Test build** + TypeCheck
4. **Test funzionalità** fornitori (AddSupplier + EditSupplier)

### Fase 3: Validazione
1. **Smoke test** completo app
2. **Verifica** nessuna regressione UI
3. **Commit atomico** con messaggio descrittivo

---

## ⚠️ RISCHI E MITIGAZIONI

### Rischi Identificati
- **Rischio BASSO:** FornitoreModal potrebbe avere utilizzi nascosti
- **Mitigazione:** Ricerca approfondita già eseguita + backup disponibile

### Piani di Rollback
- **AZ-C001:** Ripristino FornitoreModal.tsx da backup
- **Verifica:** Test completo post-rollback

### Monitoraggio Post-Implementazione
- **Settimana 1:** Monitoraggio errori console
- **Settimana 2:** Verifica funzionalità fornitori
- **Mese 1:** Conferma nessuna regressione

---

## 📋 CHECKLIST ESECUZIONE

### Pre-Esecuzione
- [ ] Backup repository completato
- [ ] Build corrente funzionante
- [ ] Team informato della rimozione

### Esecuzione AZ-C001
- [ ] Rimosso FornitoreModal.tsx
- [ ] Verificato nessun import rotto
- [ ] Build test passato
- [ ] TypeCheck test passato
- [ ] Test funzionalità fornitori OK

### Post-Esecuzione
- [ ] Smoke test completo OK
- [ ] Commit atomico eseguito
- [ ] Documentazione aggiornata
- [ ] Team informato del completamento

---

## 🎯 AZIONI ESEGUITE (FASE 2B)

### ESECUZIONE COMPLETATA - 27/09/2025 18:21

**ID APPROVATI ED ESEGUITI:**
- ✅ **AZ-C001** | Eliminato `FornitoreModal.tsx` (4.420 bytes risparmiati)

**RISULTATI:**
- **Risparmio realizzato:** 4.420 bytes componente orfano
- **Components rimanenti:** 16/17 (tutti funzionanti)
- **Build test:** ✅ SUCCESSO (4.18s, 0 errori)
- **Verifiche sicurezza:** ✅ 0 occorrenze post-rimozione
- **Backup pre-operazione:** `backup_27092025_182128.tar.gz` (687.0KB)
- **Overlap eliminato:** Ridondanza fornitori risolta

**IMPATTO FUNZIONALE:** Zero impatto negativo, architettura fornitori più pulita

**ID MANTENUTI (KEEP):**
- ✅ **AZ-C002-006** | Tutti gli altri 5 componenti confermati USATI

**LOG DETTAGLIATO:** Vedi `DOCS/LOG_SRC_PRUNE_2.txt`

---

**Piano Azione generato automaticamente - ESECUZIONE COMPLETATA**  
**Stato:** AZ-C001 eseguito con successo, altri ID confermati KEEP**

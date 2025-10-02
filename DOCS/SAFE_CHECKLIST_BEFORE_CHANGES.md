# ✅ SAFE CHECKLIST - PRIMA DI QUALSIASI MODIFICA

## 🎯 PANORAMICA

Questa checklist deve essere seguita **prima** di qualsiasi modifica al codice WineNode per garantire sicurezza, stabilità e rollback rapido.

---

## 🚫 FILE VIETATI - NON TOCCARE MAI

### 🔒 ZONA ROSSA - FUNZIONALITÀ CRITICHE
```
❌ src/pages/CreaOrdinePage.tsx
❌ src/pages/CreaOrdinePage/**
❌ src/contexts/orders/**
❌ src/components/quantity/**
```

**Motivo**: Funzionalità core testate e stabili. Modifiche richiedono approvazione esplicita e testing estensivo.

### ⚠️ ZONA GIALLA - ALTA ATTENZIONE
```
⚠️ src/contexts/OrdersActionsContext.tsx
⚠️ src/contexts/ordersActions/**
⚠️ src/components/modals/SmartGestisciModal/**
⚠️ src/pages/GestisciOrdiniPage.tsx
⚠️ package.json (scripts section)
⚠️ .github/workflows/**
```

**Motivo**: Componenti complessi con logica business critica. Modifiche richiedono branch dedicato e testing completo.

---

## 📋 CHECKLIST PRE-MODIFICA

### ✅ FASE 1: PREPARAZIONE
- [ ] **Backup Completo**: `npm run smart-backup`
- [ ] **Branch Dedicato**: `git checkout -b feature/nome-modifica`
- [ ] **Stato Pulito**: `git status` deve essere clean
- [ ] **Dipendenze Aggiornate**: `npm ci` completato senza errori
- [ ] **Baseline Stabilita**: Audit corrente salvato

### ✅ FASE 2: ANALISI IMPATTO
- [ ] **File Coinvolti**: Lista completa file da modificare
- [ ] **Dipendenze**: Identificazione file dipendenti
- [ ] **Test Necessari**: Piano di testing definito
- [ ] **Rollback Plan**: Strategia di rollback documentata
- [ ] **Zona Rischio**: Verifica che non tocchi file vietati

### ✅ FASE 3: AMBIENTE
- [ ] **Node Version**: v22.17.1 confermata
- [ ] **npm Version**: 10.9.2 confermata
- [ ] **Build Baseline**: `npm run build` funziona (tempo: ~3.2s)
- [ ] **TypeScript**: `npm run typecheck` passa
- [ ] **Size Limits**: `npm run size` sotto soglie

### ✅ FASE 4: SICUREZZA
- [ ] **Staging Branch**: Modifiche su branch separato
- [ ] **No Direct Main**: Mai commit diretti su main
- [ ] **Backup Verificato**: Backup testato e funzionante
- [ ] **Team Notificato**: Modifiche comunicate al team

---

## 🧪 TEMPLATE PIANO DI PROVA

### 📝 INFORMAZIONI MODIFICA
```
Nome Modifica: _______________
Tipo: [ ] Feature [ ] Fix [ ] Refactor [ ] Docs
Rischio: [ ] Basso [ ] Medio [ ] Alto
Stima Tempo: _____ ore
```

### 🎯 OBIETTIVI
```
Obiettivo Primario: _______________
Obiettivi Secondari:
- _______________
- _______________

Metriche Successo:
- _______________
- _______________
```

### 🔍 ANALISI IMPATTO
```
File Modificati:
- _______________
- _______________

File Dipendenti:
- _______________
- _______________

Componenti Interessati:
- _______________
- _______________
```

### 🧪 PIANO TESTING
```
Test Unitari:
- [ ] _______________
- [ ] _______________

Test Integrazione:
- [ ] _______________
- [ ] _______________

Test Manuali:
- [ ] _______________
- [ ] _______________

Test Performance:
- [ ] Bundle size < soglia
- [ ] Build time < 5s
- [ ] TypeScript check passa
```

### 🔄 STRATEGIA ROLLBACK
```
Trigger Rollback:
- [ ] Build fallisce
- [ ] TypeScript errori
- [ ] Bundle size > soglia
- [ ] Test critici falliscono
- [ ] Performance degrada >20%

Procedura Rollback:
1. _______________
2. _______________
3. _______________

Tempo Rollback Stimato: _____ minuti
```

---

## 🚨 PROCEDURE DI EMERGENZA

### 🔥 ROLLBACK IMMEDIATO
```bash
# Se qualcosa va storto
git checkout main
git reset --hard HEAD~1  # Solo se ultimo commit
# OPPURE
git revert <commit-hash>  # Più sicuro
npm ci
npm run build
```

### 🛑 KILL SWITCH
```bash
# Disattivazione rapida feature
git checkout main
git pull origin main
npm ci
npm run build
npm run preview  # Verifica funzionamento
```

### 📞 ESCALATION
```
Livello 1: Rollback automatico
Livello 2: Notifica team
Livello 3: Ripristino da backup
Livello 4: Rollback repository
```

---

## 📊 METRICHE DI CONTROLLO

### ✅ SOGLIE CRITICHE
```
Bundle Size Total: < 167 kB gzipped
Build Time: < 5s
TypeScript Errors: 0
ESLint Errors: 0 (warning accettabili)
Test Coverage: > 80% (futuro)
```

### 📈 BASELINE ATTUALI
```
Bundle Size: 157.07 kB gzipped ✅
Build Time: 3.19s ✅
TypeScript: 0 errori ✅
ESLint: 10 errori, 6 warning ⚠️
Size Limits: Tutti rispettati ✅
```

---

## 🔍 CHECKLIST POST-MODIFICA

### ✅ VERIFICA TECNICA
- [ ] **Build**: `npm run build` completa senza errori
- [ ] **TypeScript**: `npm run typecheck` passa
- [ ] **Linting**: `npm run lint` non introduce nuovi errori
- [ ] **Size**: `npm run size` rispetta tutte le soglie
- [ ] **Funzionalità**: Test manuali core completati

### ✅ VERIFICA BUSINESS
- [ ] **CreaOrdine**: Pagina funziona correttamente
- [ ] **GestisciOrdini**: Workflow ordini intatto
- [ ] **Quantità**: Controlli +/- funzionanti
- [ ] **Backup**: Sistema backup operativo
- [ ] **Performance**: Nessuna regressione percettibile

### ✅ DOCUMENTAZIONE
- [ ] **Changelog**: Modifiche documentate
- [ ] **README**: Aggiornato se necessario
- [ ] **DOCS**: Report/guide aggiornate
- [ ] **Commit**: Messaggio descrittivo con [SAFE]

---

## 🎯 BEST PRACTICES

### 🔧 SVILUPPO
1. **Atomic Commits**: Un commit = una funzionalità
2. **Descriptive Messages**: Commit message chiari
3. **Branch Naming**: `feature/`, `fix/`, `refactor/`
4. **Small Changes**: Modifiche piccole e incrementali

### 🧪 TESTING
1. **Test First**: Scrivere test prima del codice
2. **Edge Cases**: Testare casi limite
3. **Integration**: Test di integrazione completi
4. **Manual Testing**: Verifica manuale UI/UX

### 📚 DOCUMENTAZIONE
1. **Code Comments**: Codice autodocumentato
2. **API Docs**: Interfacce documentate
3. **Change Log**: Storia modifiche tracciata
4. **Team Knowledge**: Condivisione conoscenza

---

**⚠️ RICORDA**: Questa checklist è obbligatoria per TUTTE le modifiche. Non saltare step per "risparmiare tempo" - la sicurezza è prioritaria.

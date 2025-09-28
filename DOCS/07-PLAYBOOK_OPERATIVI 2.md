# 07 - PLAYBOOK OPERATIVI WINENODE

**Sintesi Executive**: Raccolta completa di playbook operativi per recovery system, ripristino WhatsApp, manutenzione periodica e procedure di emergenza, con workflow testati e procedure di rollback garantite.

## 📚 INDICE PLAYBOOK

### 1. **Playbook Recovery System**
### 2. **Playbook Ripristino WhatsApp**  
### 3. **Playbook Manutenzione Periodica**
### 4. **Playbook Procedure Emergenza**

---

## 🔄 PLAYBOOK RECOVERY SYSTEM

### Overview
**Scopo**: Gestione snapshots incrementali e rollback rapidi per sviluppo
**Sistema**: `/scripts/recovery-system.cjs` + rotazione automatica
**Policy**: Retention configurabile, garbage collection

### Comandi Principali
```bash
# Recovery interattivo
npm run recovery

# Salvataggio snapshot
npm run recovery:save

# Ripristino snapshot  
npm run recovery:restore

# Recovery automatico
npm run recovery:auto

# Gestione snapshots
npm run recovery:snapshot    # Crea nuovo
npm run recovery:rotate      # Applica rotazione
npm run recovery:gc          # Garbage collection completa
```

### Procedure Operative

#### 1. **Salvataggio Pre-Modifica**
```bash
# Prima di modifiche critiche
npm run recovery:save
# Output: Snapshot salvato in .recovery/snapshots/recovery-YYYY-MM-DDTHH-MM-SS-sssZ/
```

#### 2. **Rollback Rapido**
```bash
# In caso di problemi
npm run recovery:restore
# Seleziona snapshot dalla lista
# Conferma ripristino
```

#### 3. **Manutenzione Snapshots**
```bash
# Pulizia periodica (settimanale)
npm run recovery:gc
# Crea snapshot corrente + applica rotazione
```

### Policy Retention
- **Max snapshots**: 10 (configurabile)
- **Rotazione**: Automatica per data
- **Dimensione media**: 50-100MB per snapshot
- **Esclusioni**: node_modules, .git, dist, cache

### Sicurezza
- **Backup pre-ripristino**: Automatico
- **Verifica integrità**: Pre e post operazione
- **Log operazioni**: Timestamp e risultati
- **Rollback del rollback**: Possibile via backup

---

## 📱 PLAYBOOK RIPRISTINO WHATSAPP

### Overview
**Stato Attuale**: Funzionalità disattivata
**Colonna DB**: `data_invio_whatsapp` PRESERVATA per compatibilità
**Implementazione**: Dietro feature flag `VITE_FEATURE_WHATSAPP`

### Flusso Funzionale Target
1. **Generazione testo**: Lato client, funzione pura
2. **Deep link WhatsApp**: Apertura app con testo precomposto
3. **Logging opzionale**: Timestamp in `data_invio_whatsapp`

### Formati Deep Link Supportati
```javascript
// Web/Desktop
https://wa.me/?text=<TEXT_ENCODED>
https://api.whatsapp.com/send?text=<TEXT_ENCODED>

// Mobile fallback
whatsapp://send?text=<TEXT_ENCODED>
```

### Requisiti Tecnici
```typescript
// Funzione pura composizione testo
function composeOrderText(order: Order): string {
  // Solo info ordine necessarie
  // No dati sensibili/PII
}

// Encoder sicuro
const encodedText = encodeURIComponent(orderText);

// Feature flag
const isWhatsAppEnabled = import.meta.env.VITE_FEATURE_WHATSAPP === 'true';
```

### Compliance & Sicurezza
- **Privacy**: No dati sensibili nel testo
- **Sicurezza**: No segreti in client, no numeri hardcoded
- **A11y/UX**: Pulsante visibile solo se flag attivo
- **DB Integration**: Update opzionale `data_invio_whatsapp`

### Piano Rilascio
1. **PR con feature flag** (default: false)
2. **QA su branch** dedicato
3. **Abilitazione graduale** per ambienti
4. **Monitor feedback** e bundle size

### Rollback
- **Disabilitazione flag**: `VITE_FEATURE_WHATSAPP=false`
- **Nessuna migrazione**: Richiesta
- **Pulsante invisibile**: Immediato

---

## 🔧 PLAYBOOK MANUTENZIONE PERIODICA

### Attività Settimanali

#### 1. **Update Dependencies**
```bash
# Verifica outdated packages
npm outdated

# Update patch versions
npm update

# Verifica vulnerabilità
npm audit

# Fix automatico
npm audit fix
```

#### 2. **Refresh Bundle Baseline**
```bash
# Build production
npm run build

# Update baseline se incremento accettabile
npm run bundle:guard
# Se OK, commit nuovo BUNDLE_BASELINE.json
```

#### 3. **Cleanup Automatico**
```bash
# Pulizia file obsoleti
npm run cleanup

# Rotazione backup
npm run backup && npm run backup:list

# Garbage collection recovery
npm run recovery:gc
```

### Attività Mensili

#### 1. **Test Suite Completa**
```bash
# Test con coverage
npm run test:ci

# Verifica quality gates
npm run lint && npm run typecheck

# Build verification
npm run build
```

#### 2. **Diagnostica Progetto**
```bash
# Analisi completa
npm run diagnose:force

# Verifica configurazioni
npm run config-check

# Info progetto aggiornate
npm run project-info
```

#### 3. **Documentazione Sync**
```bash
# Update Supabase docs
npm run supabase:doc

# Verifica file informativi
# Aggiornamento manuale se necessario
```

### Attività Trimestrali

#### 1. **Major Dependencies Update**
- Review major version updates
- Test in branch dedicato
- Update graduale con backup

#### 2. **Performance Audit**
- Bundle analysis dettagliata
- Performance profiling
- Ottimizzazioni mirate

#### 3. **Security Review**
- Dependency vulnerability scan
- Code security analysis
- Update security policies

---

## 🚨 PLAYBOOK PROCEDURE EMERGENZA

### Scenario 1: **Build Failure Critico**

#### Diagnosi
```bash
# Verifica errori build
npm run build

# Check TypeScript
npm run typecheck

# Verifica lint
npm run lint
```

#### Recovery
```bash
# Rollback via recovery
npm run recovery:restore

# O ripristino backup
npm run backup:restore

# Verifica funzionamento
npm run dev
```

### Scenario 2: **Database Schema Corruption**

#### Diagnosi
```bash
# Test connessione
npm run supabase:doc:check

# Verifica schema
# Controllo manuale Supabase dashboard
```

#### Recovery
```bash
# Ripristino schema da backup
# File: /DOCS/SCHEMA_UNICO.sql

# Verifica integrità dati
# Test CRUD operations

# Sync documentazione
npm run supabase:doc
```

### Scenario 3: **CI/CD Pipeline Failure**

#### Diagnosi
- Check GitHub Actions logs
- Verifica quality gates locali
- Identificazione job fallito

#### Recovery
```bash
# Fix locale
npm run lint:fix
npm run typecheck
npm run build
npm run test:ci

# Re-trigger CI
git commit --amend --no-edit
git push --force-with-lease
```

### Scenario 4: **Performance Degradation**

#### Diagnosi
```bash
# Bundle analysis
npm run bundle:guard

# Performance profiling
npm run build
# Analisi dimensioni in /dist/

# Diagnostica progetto
npm run diagnose
```

#### Recovery
- Identificazione bottleneck
- Rollback a versione stabile
- Ottimizzazioni mirate
- Re-deploy graduale

### Contatti Emergenza
- **Repository**: GitHub Issues
- **CI/CD**: GitHub Actions logs
- **Database**: Supabase Dashboard
- **Monitoring**: Bundle guard alerts

---

## 📋 CHECKLIST MANUTENZIONE

### Pre-Operazione
- [ ] Backup completo creato
- [ ] Recovery snapshot salvato
- [ ] Team notificato
- [ ] Finestra manutenzione pianificata

### Durante Operazione
- [ ] Quality gates verificati
- [ ] Build successful
- [ ] Test suite passed
- [ ] Performance mantenuta

### Post-Operazione
- [ ] Funzionalità verificate
- [ ] Documentazione aggiornata
- [ ] Team notificato
- [ ] Monitoring attivo

### Rollback (Se Necessario)
- [ ] Recovery/backup ripristinato
- [ ] Verifica funzionamento
- [ ] Root cause analysis
- [ ] Piano correzione

---

**Riferimenti**:
- Recovery: `/scripts/recovery-system.cjs`
- WhatsApp: `/DOCS/PLAYBOOK_RIPRISTINO_WHATSAPP.md`
- Migrazioni: `/DOCS/PLAYBOOK_MIGRAZIONI.md`
- Backup: `/scripts/backup-system.js`

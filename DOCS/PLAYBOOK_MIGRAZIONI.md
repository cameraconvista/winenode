# PLAYBOOK MIGRAZIONI DATABASE SUPABASE

**Progetto:** WineNode  
**Data:** 28/09/2025 01:55  
**Stato:** PREPARAZIONE COMPLETATA - PRONTO PER ESECUZIONE  
**Modalità:** NO-SUPABASE (script preparati, esecuzione rimandata)

---

## 🎯 INDICE MIGRAZIONI

### File Principali
1. **[DB_MIGRATIONS_SCRIPTS.sql](./DB_MIGRATIONS_SCRIPTS.sql)** - Script SQL completi
2. **[DB_MIGRATION_GUIDE.md](./DB_MIGRATION_GUIDE.md)** - Guida passo-passo amministratore
3. **[LOG_DB_MIGRATIONS.txt](./LOG_DB_MIGRATIONS.txt)** - Template documentazione esecuzione

### Migrazioni Pendenti
- **SH-06**: Indici Performance (wines.supplier, wines.type, wines.user_id)
- **SH-03**: Check Constraints (price > 0, inventory ≥ 0, minStock ≥ 0)  
- **SH-02**: Enum Wine Type (varchar → enum PostgreSQL)

---

## 📋 CHECKLIST ESECUZIONE

### PRIMA (Preparazione)
- [ ] **Backup database completo** (schema + dati)
- [ ] **Verifica accesso amministrativo** Supabase
- [ ] **Finestra manutenzione** pianificata (traffico minimo)
- [ ] **Team coordinato**: Admin DB + Backend + QA
- [ ] **Rollback plan** verificato e testato

### DURANTE (Esecuzione)
- [ ] **Sequenza ordinata**: SH-06 → SH-03 → SH-02
- [ ] **Verifica prerequisiti** per ogni migrazione
- [ ] **Transazioni atomiche** per operazioni critiche
- [ ] **Log dettagliato** in LOG_DB_MIGRATIONS.txt
- [ ] **Test intermedi** dopo ogni migrazione

### DOPO (Verifica)
- [ ] **Test CRUD completi** (wines, google-sheet import)
- [ ] **Performance query** verificata con nuovi indici
- [ ] **Health check** applicazione
- [ ] **Monitoraggio 24h** stabilità database
- [ ] **Documentazione finale** aggiornata

---

## ⏰ PIANIFICAZIONE ESECUZIONE

### Finestra Manutenzione Consigliata
- **Orario**: 02:00-04:00 (traffico minimo)
- **Durata stimata**: 5-10 minuti totali
- **Downtime**: <2 minuti (solo per SH-02 enum)

### Ordine Esecuzione Ottimale
1. **SH-06** (Indici Performance) - 2-5 min, rischio BASSO
2. **SH-03** (Check Constraints) - 1-2 min, rischio MEDIO  
3. **SH-02** (Enum Wine Type) - 1-3 min, rischio MEDIO

### Ruoli e Responsabilità

#### Admin Database (Esecutore)
- Esecuzione script SQL su Supabase
- Verifica prerequisiti e rollback
- Monitoraggio performance query
- Compilazione LOG_DB_MIGRATIONS.txt

#### Backend Developer (Supporto)
- Verifica API post-migrazione
- Test integrazione server/database
- Validazione business logic

#### QA Tester (Verifica)
- Test funzionalità critiche
- Verifica workflow completi
- Segnalazione regressioni

---

## 🚨 GESTIONE EMERGENZE

### Dati Non Conformi
**Se trovati durante pre-check:**
1. STOP esecuzione immediato
2. Documentare record problematici
3. Richiedere approvazione correzione
4. Ripianificare dopo fix dati

### Rollback Necessario
**Procedura emergenza:**
1. Eseguire script rollback specifico
2. Ripristinare backup database
3. Verificare funzionalità applicazione
4. Post-mortem e lessons learned

### Contatti Emergenza
- **Admin Database**: [DA DEFINIRE]
- **Team Backend**: [DA DEFINIRE]
- **On-call Support**: [DA DEFINIRE]

---

## 📊 METRICHE SUCCESSO

### Performance Target
- **Query supplier**: Miglioramento 50-80%
- **Query type**: Miglioramento 60-90%
- **Query user_id**: Miglioramento 70-95%

### Qualità Dati
- **Zero record** con price ≤ 0
- **Zero record** con inventory < 0
- **Zero record** con minStock < 0
- **Enum conformità**: 100% valori wine_type

### Stabilità Sistema
- **Uptime**: 99.9% nelle 24h post-migrazione
- **Error rate**: <0.1% operazioni database
- **Response time**: Mantenuto o migliorato

---

## 📝 DOCUMENTAZIONE POST-ESECUZIONE

### File da Aggiornare
1. **LOG_DB_MIGRATIONS.txt** - Risultati effettivi
2. **REPORT_ULTIMA_MODIFICA.md** - Sezione migrazioni
3. **Schema documentation** - Nuove strutture
4. **Performance benchmarks** - Metriche before/after

### Comunicazione Team
- **Slack/Teams**: Notifica completamento
- **Email**: Report esecutivo management
- **Wiki**: Aggiornamento documentazione tecnica

---

## 🔄 PROSSIME ITERAZIONI

### Monitoraggio Continuo
- **Performance dashboard** per query critiche
- **Alert automatici** su soglie performance
- **Review mensile** ottimizzazioni database

### Miglioramenti Futuri
- **Indici aggiuntivi** basati su usage patterns
- **Partitioning** per tabelle grandi
- **Archiving** dati storici

---

**⚠️ IMPORTANTE**: Questo playbook è completo e pronto. L'esecuzione richiede solo coordinamento team e accesso amministrativo Supabase.

**Preparato da**: Cascade AI Assistant  
**Versione**: 1.0  
**Ultimo aggiornamento**: 28/09/2025 01:55

# 🔧 Sistema di Recovery Automatico - WineNode

## 📋 Panoramica

Il sistema di recovery automatico permette di **riprendere le modifiche** ogni volta che il lavoro viene interrotto per qualsiasi motivo (errori di connessione, crash, interruzioni, etc.).

## 🚀 Comandi Disponibili

### Salvataggio Manuale
```bash
npm run recovery:save
```
Salva lo stato corrente del progetto con:
- File modificati
- Branch attivo
- Ultimo commit
- Task in corso
- Report recenti

### Ripristino Automatico
```bash
npm run recovery:restore
```
Ripristina l'ultimo stato salvato automaticamente.

### Lista Punti di Recovery
```bash
npm run recovery
```
Mostra tutti i punti di recovery disponibili con date e task.

### Modalità Automatica
```bash
npm run recovery:auto
```
Attiva il salvataggio automatico ogni 5 minuti. Perfetto per sessioni di lavoro lunghe.

## 🔄 Workflow Tipico

### 1. Inizio Sessione
```bash
# Salva lo stato iniziale
npm run recovery:save
```

### 2. Durante il Lavoro
```bash
# Attiva modalità automatica (opzionale)
npm run recovery:auto
```

### 3. In Caso di Interruzione
```bash
# Ripristina l'ultimo stato
npm run recovery:restore
```

## 📁 Struttura File

```
.recovery/
├── current-state.json      # Stato corrente
└── snapshots/              # Snapshot dei file
    ├── recovery-2025-09-25T22-31-00/
    ├── recovery-2025-09-25T22-36-00/
    └── ...
```

## 🎯 Casi d'Uso

### Errore di Connessione
```bash
# Dopo un errore "Model provider unreachable"
npm run recovery:restore
# Continua dal punto esatto dove ti eri fermato
```

### Crash dell'IDE
```bash
# Riapri il terminale e ripristina
npm run recovery:restore
```

### Cambio di Sessione
```bash
# Prima di chiudere
npm run recovery:save

# Alla riapertura
npm run recovery:restore
```

## 🛡️ Sicurezza

- **Non sovrascrive mai** file senza conferma
- **Mantiene cronologia** di tutti i punti di recovery
- **Compatibile con Git** - non interferisce con il version control
- **Backup automatico** prima di ogni ripristino

## 📊 Informazioni Salvate

Per ogni punto di recovery:
- ✅ **File modificati** (src/, scripts/, reports/)
- ✅ **Branch Git attivo**
- ✅ **Ultimo commit**
- ✅ **Task in corso** (dedotto dai report)
- ✅ **Timestamp preciso**
- ✅ **Report recenti**

## 🔍 Esempio Output

```bash
$ npm run recovery

📋 Punti di recovery disponibili:

1. recovery-2025-09-25T22-31-00
   📅 25/09/2025, 22:31:00
   📝 Rimozione icone Gestisci Ordini

2. recovery-2025-09-25T22-24-00
   📅 25/09/2025, 22:24:00
   📝 Centralizzazione labels

3. recovery-2025-09-25T22-18-00
   📅 25/09/2025, 22:18:00
   📝 Rinomina pulsanti
```

## ⚡ Tips

1. **Usa modalità auto** per sessioni lunghe
2. **Salva manualmente** prima di modifiche rischiose
3. **Lista recovery** per vedere la cronologia
4. **Ripristina sempre** dopo interruzioni impreviste

## 🚨 Recovery di Emergenza

Se tutto va storto:
```bash
# 1. Lista tutti i recovery point
npm run recovery

# 2. Ripristina l'ultimo stato buono
npm run recovery:restore

# 3. Verifica che tutto funzioni
npm run dev
```

---

**Il sistema di recovery ti permette di non perdere mai il lavoro e riprendere esattamente da dove ti eri fermato! 🎯**

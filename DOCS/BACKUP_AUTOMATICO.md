# 💾 SISTEMA BACKUP AUTOMATICO WINENODE

## 📋 PANORAMICA

Il sistema di backup automatico di WineNode crea archivi compressi `.tar.gz` del progetto con rotazione automatica per mantenere solo i backup più recenti.

## 🚀 UTILIZZO

### Creare un Backup

```bash
npm run backup
```

Questo comando:
1. Crea un archivio `backup_YYYYMMDD-HHMMSS.tar.gz` nella cartella `Backup_Automatico/`
2. Include: `src/`, `public/`, `DOCS/`, `package.json`, `tsconfig.json`, `vite.config.ts`
3. Esclude: `node_modules`, `.git`, `dist`, file temporanei e cache
4. Applica rotazione automatica (max 3 backup)

### Esempio Output

```
ℹ️ [02/10/2025, 02:35:00] 🔄 Avvio backup automatico...
✅ [02/10/2025, 02:35:02] ✅ Backup completato con successo

📋 BACKUP DISPONIBILI DOPO ROTAZIONE:

📦 backup_20251002-023502.tar.gz (2.1 MB) - 02/10/2025, 02:35:02
📦 backup_20251001-143021.tar.gz (2.0 MB) - 01/10/2025, 14:30:21
📦 backup_20250930-091545.tar.gz (1.9 MB) - 30/09/2025, 09:15:45
```

## 🔄 ROTAZIONE AUTOMATICA

- **Limite**: Massimo 3 backup mantenuti
- **Strategia**: Quando viene creato il 4° backup, il più vecchio viene eliminato automaticamente
- **Ordinamento**: Per data di creazione (più recente → più vecchio)

## 📂 STRUTTURA BACKUP

### File Inclusi
- `src/` - Codice sorgente completo
- `public/` - Asset pubblici
- `DOCS/` - Documentazione
- `package.json` - Dipendenze e configurazione
- `tsconfig.json` - Configurazione TypeScript
- `vite.config.ts` - Configurazione Vite

### File Esclusi
- `node_modules/` - Dipendenze (ricostruibili con `npm install`)
- `.git/` - Repository Git
- `dist/` - Build artifacts
- `Backup_Automatico/` - Altri backup (evita ricorsione)
- File temporanei (`.DS_Store`, `*.log`, `*.tmp`)
- File di configurazione locale (`.env`, `.cache`)

## 🔧 COMANDI AGGIUNTIVI

### Listare Backup Disponibili

```bash
npm run backup:list
```

### Ripristinare da Backup

```bash
npm run backup:restore
```

**⚠️ ATTENZIONE**: Il ripristino sovrascriverà i file esistenti. Assicurati di aver committato le modifiche importanti prima del ripristino.

### Confermare Ripristino

```bash
npm run restore-confirm
```

## 🛡️ ROLLBACK - RIPRISTINO DA BACKUP

### Procedura di Ripristino

1. **Backup di sicurezza** (opzionale ma raccomandato):
   ```bash
   npm run backup
   ```

2. **Lista backup disponibili**:
   ```bash
   npm run backup:list
   ```

3. **Avvia ripristino**:
   ```bash
   npm run backup:restore
   ```

4. **Seleziona backup** dalla lista interattiva

5. **Conferma ripristino** quando richiesto

6. **Reinstalla dipendenze**:
   ```bash
   npm install
   ```

### Ripristino dal Backup più Recente

Per ripristinare rapidamente dall'ultimo backup:

1. Il sistema mostrerà automaticamente il backup più recente come prima opzione
2. Seleziona il primo backup nella lista
3. Conferma l'operazione
4. Reinstalla le dipendenze

## 📊 INFORMAZIONI TECNICHE

### Formato Nome File
```
backup_YYYYMMDD-HHMMSS.tar.gz
```

- `YYYY`: Anno (4 cifre)
- `MM`: Mese (2 cifre)
- `DD`: Giorno (2 cifre)
- `HH`: Ora (2 cifre, formato 24h)
- `MM`: Minuti (2 cifre)
- `SS`: Secondi (2 cifre)

### Compressione
- **Formato**: TAR + GZIP
- **Livello compressione**: Standard
- **Dimensione tipica**: 1.5-3 MB (dipende dal progetto)

### Sicurezza
- I backup non contengono file sensibili (`.env` escluso)
- Nessuna informazione di autenticazione inclusa
- Safe per condivisione e archiviazione

## 🔍 TROUBLESHOOTING

### Errore "Spazio insufficiente"
- Libera spazio su disco
- I backup vengono ruotati automaticamente per limitare l'uso dello spazio

### Errore "Permessi negati"
- Verifica i permessi di scrittura nella cartella `Backup_Automatico/`
- Su macOS/Linux: `chmod 755 Backup_Automatico/`

### Backup corrotto
- Usa `npm run backup:list` per verificare i backup disponibili
- I backup corrotti vengono automaticamente esclusi dalla lista

---

**📝 Nota**: Il sistema di backup è progettato per essere sicuro e non distruttivo. Tutti i backup sono verificati per integrità prima dell'uso.

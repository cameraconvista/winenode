# 🔄 Sistema Backup Automatico

## Panoramica

Sistema di backup automatico integrato per il progetto WineNode che garantisce sicurezza dei dati e possibilità di ripristino rapido.

## Architettura

### Script Principale
- **File**: `/scripts/backup-system.js`
- **Tipo**: Modulo ES6 Node.js
- **Dipendenze**: Node.js built-in (fs, path, child_process)

### Directory Backup
- **Percorso**: `/Backup_Automatico/`
- **Formato**: File compressi `.tar.gz`
- **Rotazione**: Massimo 3 copie

## Funzionalità

### 1. Creazione Backup
```bash
npm run backup
```
- Compressione automatica con `tar -czf`
- Naming formato: `backup_ddMMyyyy_HHmmss.tar.gz`
- Esclusione pattern configurabili
- Verifica integrità post-creazione
- Logging con timestamp italiano

### 2. Gestione Rotazione
- Mantiene massimo 3 backup
- Elimina automaticamente i più vecchi
- Ordinamento per data di modifica

### 3. Lista e Anteprima
```bash
npm run backup:list           # Lista tutti i backup
npm run backup:restore <nome> # Anteprima contenuto
```

### 4. Ripristino Sicuro
```bash
npm run restore-confirm <nome>
```
- Anteprima obbligatoria prima del ripristino
- Backup di sicurezza automatico
- Verifica integrità pre-ripristino

## Configurazione

### Pattern Esclusione
```javascript
const EXCLUDED_PATTERNS = [
    'node_modules',
    '.git',
    'dist',
    '.DS_Store',
    '*.log',
    '.env',
    '.env.*',
    'Backup_Automatico',
    'attached_assets',
    '*.tmp',
    '*.temp',
    '.cache',
    '.vscode',
    '.idea'
];
```

### Parametri Sistema
- **MAX_BACKUPS**: 3 (modificabile)
- **BACKUP_DIR**: `/Backup_Automatico/`
- **TIMEZONE**: Europe/Rome

## Sicurezza

### Procedura Backup
1. Verifica directory esistente
2. Rotazione backup precedenti
3. Creazione file temporaneo `.tmp`
4. Compressione con esclusioni
5. Verifica integrità
6. Rinomina da `.tmp` a finale
7. Cleanup file temporanei

### Procedura Ripristino
1. Verifica esistenza backup
2. Controllo integrità
3. Creazione backup di sicurezza
4. Anteprima obbligatoria
5. Conferma esplicita utente
6. Ripristino con sovrascrittura

## Logging

### Formato
```
[EMOJI] [DD/MM/YYYY, HH:MM:SS] MESSAGGIO
```

### Tipi Log
- `ℹ️` INFO: Operazioni normali
- `✅` SUCCESS: Operazioni completate
- `❌` ERROR: Errori e fallimenti

## Integrazione NPM

### Script Package.json
```json
{
  "backup": "node scripts/backup-system.js create",
  "backup:list": "node scripts/backup-system.js list", 
  "backup:restore": "node scripts/backup-system.js restore",
  "restore-confirm": "node scripts/backup-system.js restore-confirm"
}
```

## Performance

### Dimensioni Tipiche
- **Progetto originale**: ~6-8 MB
- **Backup compresso**: ~3.6 MB (40-60% riduzione)
- **Tempo creazione**: 1-2 secondi

### Ottimizzazioni
- Compressione gzip integrata
- Esclusione intelligente file non necessari
- Verifica integrità rapida
- Gestione memoria efficiente

## Monitoraggio

### Metriche Disponibili
- Dimensione backup
- Tempo creazione
- Numero file inclusi
- Rapporto compressione

### Log Operazioni
- Timestamp preciso (secondi)
- Stato operazioni
- Errori dettagliati
- Statistiche backup

## Manutenzione

### Pulizia Manuale
```bash
# Rimuovi tutti i backup
rm -rf Backup_Automatico/backup_*.tar.gz

# Mantieni solo README
find Backup_Automatico/ -name "*.tar.gz" -delete
```

### Modifica Configurazione
- Editare `/scripts/backup-system.js`
- Modificare `MAX_BACKUPS` per cambiare rotazione
- Aggiungere pattern a `EXCLUDED_PATTERNS`

## Troubleshooting

### Errori Comuni

1. **"Directory non trovata"**
   - Verificare permessi scrittura
   - Controllare spazio disco

2. **"Backup corrotto"**
   - Verificare integrità con `tar -tzf`
   - Ricreare backup

3. **"Rotazione non funziona"**
   - Controllare permessi file
   - Verificare timestamp file

### Recovery
In caso di problemi gravi:
1. Verificare backup più recente
2. Usare anteprima per controllo
3. Ripristinare backup funzionante
4. Ricreare ambiente se necessario

---
*Documentazione Sistema Backup WineNode v1.0*

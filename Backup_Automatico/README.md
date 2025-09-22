# 🔄 Sistema Backup Automatico WineNode

Questa directory contiene i backup automatici del progetto WineNode.

## 📋 Caratteristiche

- **Formato**: File compressi `.tar.gz`
- **Naming**: `backup_ddMMyyyy_HHmmss.tar.gz`
- **Rotazione**: Massimo 3 copie (elimina automaticamente i più vecchi)
- **Compressione**: ~40-60% della dimensione originale
- **Esclusioni**: `node_modules`, `.git`, `dist`, cache e file temporanei

## 🚀 Comandi Disponibili

```bash
# Crea nuovo backup
npm run backup

# Lista backup disponibili
npm run backup:list

# Anteprima contenuto backup (sicuro)
npm run backup:restore <nome_backup>

# Conferma ripristino (ATTENZIONE: sovrascrive file!)
npm run restore-confirm <nome_backup>
```

## 📝 Esempi

```bash
# Crea backup
npm run backup

# Vedi tutti i backup
npm run backup:list

# Anteprima backup specifico
npm run backup:restore backup_22092025_025941.tar.gz

# Ripristina backup (dopo anteprima)
npm run restore-confirm backup_22092025_025941.tar.gz
```

## ⚠️ Note Importanti

1. **Sicurezza**: Il ripristino crea automaticamente un backup di sicurezza prima di procedere
2. **Anteprima Obbligatoria**: Devi sempre visualizzare l'anteprima prima del ripristino
3. **Rotazione Automatica**: I backup più vecchi vengono eliminati automaticamente
4. **Integrità**: Ogni backup viene verificato per integrità prima del salvataggio

## 📊 File Esclusi dal Backup

- `node_modules/`
- `.git/`
- `dist/`
- `.DS_Store`
- `*.log`
- `.env*`
- `Backup_Automatico/`
- `attached_assets/`
- File temporanei (`.tmp`, `.temp`)
- Cache e IDE files

---
*Sistema creato per garantire sicurezza e continuità del progetto WineNode*

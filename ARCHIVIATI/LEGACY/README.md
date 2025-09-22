# 📁 ARCHIVIATI/LEGACY - File Storici WineNode

## 📅 Data Archiviazione: 22/09/2025 04:35

Questa directory contiene file storici e obsoleti spostati durante le operazioni chirurgiche di pulizia del progetto WineNode.

## 📂 Struttura

### `/sql_schemas/` - Schema Database Storici
File SQL per setup e migrazioni database (non più utilizzati):
- `setup-giacenza-complete.sql` - Setup iniziale giacenze
- `supabase-ordini-schema.sql` - Schema ordini
- `supabase-schema-final.sql` - Schema finale
- `supabase-schema-fix.sql` - Fix schema
- `add_stato_column.sql` - Aggiunta colonna stato
- `add-contenuto-ricevuto-column.sql` - Colonna contenuto ricevuto
- `add-contenuto-ricevuto-fix.sql` - Fix contenuto ricevuto
- `add-missing-ordini-columns.sql` - Colonne mancanti ordini
- `fix-contenuto-ricevuto.sql` - Fix contenuto ricevuto
- `fix-missing-colore-column.sql` - Fix colonna colore

### `/scripts/` - Script e Componenti Obsoleti
- `AuthManager.ts` - Gestore autenticazione (rimosso)
- `cleanup-project.js` - Script pulizia one-shot
- `google-apps-script.js` - Script Google Apps (12KB)

### `/utils_stubs/` - Utility Stub (74 bytes ciascuno)
File stub vuoti con commenti di migrazione:
- `analyzeBianchi.ts` - Migrato in useWineData.ts
- `cleanupDatabase.ts` - Non più utilizzato
- `csvArchiver.ts` - Non più utilizzato
- `listBollicinieFrancesi.ts` - Non più utilizzato
- `listRossi.ts` - Non più utilizzato
- `listViniDolci.ts` - Non più utilizzato
- `showWinesFromCsv.ts` - Non più utilizzato
- `testGoogleSheets.ts` - Non più utilizzato

## ⚠️ Importante

- **NON ELIMINARE** questi file - potrebbero contenere riferimenti storici utili
- Tutti i file sono stati verificati come non referenziati nel codice attivo
- Per ripristino, consultare il backup: `backup_22092025_042848.tar.gz`

## 🔄 Rollback

Se necessario ripristinare un file:
1. Copiare dalla directory appropriata
2. Verificare compatibilità con codice corrente
3. Aggiornare import/referenze se necessario

---
*Archiviazione eseguita durante operazioni chirurgiche STEP 2*

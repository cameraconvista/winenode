# PIANO MIGRAZIONE NAMING - supplier/fornitore

**Stato Attuale:** PREPARAZIONE (SH-01 Fase Safe)  
**Obiettivo:** Normalizzazione terminologia su "supplier" in tutto il progetto

## SITUAZIONE CORRENTE

### Schema Database (shared/)
- ✅ **Campo**: `supplier` (PostgreSQL column)
- ✅ **Tipi**: `Wine.supplier`, `InsertWine.supplier`
- ✅ **Validazioni**: Zod schema usa `supplier`

### Server (server/)
- ✅ **Terminologia**: `supplier` (coerente con schema)
- ✅ **Compatibility Layer**: Attivo per mapping automatico
- ✅ **API**: Endpoint usano `supplier` internamente

### Frontend (src/)
- ❌ **Terminologia**: `fornitore` (27 file coinvolti)
- ❌ **Disallineamento**: Usa terminologia italiana
- ❌ **Mapping**: Dipende da compatibility layer server

## STRATEGIA MIGRAZIONE

### FASE 1: Preparazione (✅ COMPLETATA - SH-01)
- [x] Aggiunta commenti TODO nel schema
- [x] Creati alias types per compatibilità
- [x] Documentazione piano migrazione
- [x] Zero breaking changes

### FASE 2: Frontend Migration (FUTURA)
- [ ] Rinomina `fornitore` → `supplier` in tutti i 27 file src/
- [ ] Aggiorna interfacce TypeScript
- [ ] Modifica labels UI (opzionale, può rimanere "Fornitore")
- [ ] Test completi frontend/server integration

### FASE 3: Cleanup (FUTURA)
- [ ] Rimozione compatibility layer server
- [ ] Rimozione alias types deprecated
- [ ] Pulizia commenti TODO
- [ ] Documentazione finale

## RISCHI E MITIGAZIONI

### Rischi Alto
- **Breaking Change Massivo**: 27 file frontend da modificare
- **Regressioni UI**: Possibili errori in componenti complessi
- **Inconsistenza Temporanea**: Durante migrazione graduale

### Mitigazioni
- **Feature Flag**: Abilitare/disabilitare nuova terminologia
- **Rollback Plan**: Compatibility layer mantiene funzionalità
- **Test Automatici**: Verifica integrazione frontend/server
- **Migrazione Graduale**: Un modulo alla volta

## ALIAS TYPES PREPARATORI

```typescript
// Facilitano migrazione graduale
export type WineSupplierField = Wine['supplier'];
export type InsertWineSupplierField = InsertWine['supplier'];
```

## COMPATIBILITY LAYER SERVER

Il server mantiene mapping automatico:
- **Request**: `fornitore` → `supplier` (database)
- **Response**: `supplier` → `fornitore` (frontend)

## PROSSIMI PASSI

1. **Approvazione Team**: Conferma strategia migrazione
2. **Planning Sprint**: Allocazione tempo per FASE 2
3. **Feature Flag**: Implementazione toggle terminologia
4. **Test Suite**: Preparazione test automatici
5. **Migrazione Graduale**: Esecuzione FASE 2 controllata

---

**NOTA CRITICA**: La migrazione completa richiede coordinamento team frontend e testing estensivo. Il compatibility layer garantisce zero downtime durante la transizione.

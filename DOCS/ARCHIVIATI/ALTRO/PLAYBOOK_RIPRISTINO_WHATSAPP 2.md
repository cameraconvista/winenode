# PLAYBOOK RIPRISTINO FUNZIONALITÀ WHATSAPP — WINENODE

## Obiettivo
Reintrodurre la funzione di condivisione ordine via WhatsApp (deep link + testo precomposto), con zero regressioni e compatibilità Supabase.

## Stato attuale
- Funzionalità disattivata; nessun residuo applicativo.
- Colonna DB **data_invio_whatsapp** presente e PRESERVARE (compatibilità futura).
- CI/CD, Husky e backup attivi.

## Flusso funzionale (target)
1. L'app genera il testo d'ordine (solo lato client).
2. Apri WhatsApp via deep link (utente sceglie il destinatario):
   - Formati supportati:
     - `https://wa.me/?text=<TEXT_ENCODED>` 
     - `https://api.whatsapp.com/send?text=<TEXT_ENCODED>` 
     - `whatsapp://send?text=<TEXT_ENCODED>`  (fallback mobile)
3. (Opzionale) logging lato app del timestamp → sincronizzato in `data_invio_whatsapp` .

## Requisiti tecnici minimi
- Funzione pure per comporre il testo d'ordine: `composeOrderText(order)`  (no side-effects).
- Encoder URL sicuro: `encodeURIComponent(text)` .
- Feature flag: `VITE_FEATURE_WHATSAPP=true|false`  (default: false).
- Nessun segreto o PII persistito. Nessun numero precompilato lato app.

## Compliance & sicurezza
- Privacy: il testo NON deve contenere dati sensibili (solo info ordine strettamente necessarie).
- Sicurezza: nessun segreto in client; no phone predefiniti hardcoded.
- A11y/UX: pulsante visibile solo quando `VITE_FEATURE_WHATSAPP`  è `true` .

## Integrazione DB (opzionale)
- Se l'utente conferma l'invio → salva timestamp in `data_invio_whatsapp` .
- Evitare lock schema. Usare service esistente per update con retry.

## Test & QA
- Unit: encoding del testo e formati deep link.
- E2E: apertura link su device reale/emulato.
- CI: linter/tsc/build/test devono passare.

## Piano rilascio
1. PR con implementazione dietro feature flag (false).
2. QA su branch; se OK, abilitazione per ambienti selezionati (flag true).
3. Monitor: feedback utente e dimensione bundle (bundle guard già attivo).

## Rollback
- Disabilitare il flag (false) → pulsante invisibile.
- Nessuna migrazione richiesta.

_Fine Playbook_

/**
 * Feature Flags per WineNode
 * Sistema di controllo per attivazione/disattivazione funzionalità
 */

export const FEATURE_FLAGS = {
  // Conferma ordini con aggiornamento giacenze in "Ordini Creati"
  ORDINI_CONFIRM_IN_CREATI: {
    enabled: true,
    description: "Abilita conferma con giacenze su pulsante verde in Ordini Creati",
    rollbackInstructions: "Impostare enabled: false per ripristinare comportamento precedente"
  },

  // Rimozione tab Storico
  REMOVE_STORICO_TAB: {
    enabled: true,
    description: "Nasconde tab Storico e disabilita codice relativo",
    rollbackInstructions: "Impostare enabled: false per ripristinare tab Storico"
  },

  // FASE 3 - Core Inventory Features
  INVENTORY_TX: {
    enabled: true,
    description: "Abilita aggiornamento giacenze atomico e transazionale",
    rollbackInstructions: "Impostare enabled: false per disabilitare transazioni atomiche"
  },

  IDEMPOTENCY_GUARD: {
    enabled: true,
    description: "Abilita protezione idempotenza per prevenire doppi aggiornamenti",
    rollbackInstructions: "Impostare enabled: false per disabilitare controlli idempotenza"
  },

  AUDIT_LOGS: {
    enabled: true,
    description: "Abilita audit trail per operazioni giacenze (chi/quando/cosa/prima→dopo)",
    rollbackInstructions: "Impostare enabled: false per disabilitare logging audit"
  },

  OPTIMISTIC_LOCKING: {
    enabled: true,
    description: "Abilita lock ottimistico per gestione concorrenza giacenze",
    rollbackInstructions: "Impostare enabled: false per disabilitare lock ottimistico"
  },

  // FASE 3 - UI Ordini Archiviati
  ARCHIVIATI_READONLY: {
    enabled: true,
    description: "Rimuove sezione +/- e pulsante Archivia da Ordini Archiviati (readonly)",
    rollbackInstructions: "Impostare enabled: false per ripristinare controlli modifica"
  },

  ARCHIVIATI_COLLAPSIBLE_BOX: {
    enabled: true,
    description: "Abilita expand/collapse per dettagli ordini archiviati",
    rollbackInstructions: "Impostare enabled: false per mostrare sempre dettagli espansi"
  },

  CREATI_INLINE_GESTISCI: {
    enabled: true,
    description: "Abilita expand inline con picker quantità per pulsante Gestisci in ordini creati",
    rollbackInstructions: "Impostare enabled: false per ripristinare comportamento precedente"
  },

  CREATI_QTY_MODAL: {
    enabled: true,
    description: "Abilita modale quantità (come Home) invece di picker inline per modifica quantità in ordini creati",
    rollbackInstructions: "Impostare enabled: false per ripristinare picker inline"
  },

  QTY_PICKER_0_100: {
    enabled: true,
    description: "Abilita range 0-100 consecutivo nel picker quantità invece del range dinamico",
    rollbackInstructions: "Impostare enabled: false per ripristinare range dinamico"
  },

  CREATI_SMART_FULL_MODAL: {
    enabled: true,
    description: "Abilita modale full-screen smart per pulsante Gestisci con cards compatte",
    rollbackInstructions: "Impostare enabled: false per ripristinare comportamento inline"
  },

  QTY_MODAL_PERSIST_COMMIT: {
    enabled: true,
    description: "Abilita persistenza reale delle quantità modificate nel modale (no reset alla chiusura)",
    rollbackInstructions: "Impostare enabled: false per ripristinare reset automatico"
  },

  QTY_MODAL_CONFIRM_ARCHIVE_FLOW: {
    enabled: true,
    description: "Abilita dialog conferma archiviazione dopo modifica quantità con flusso completo",
    rollbackInstructions: "Impostare enabled: false per disabilitare dialog archiviazione"
  }
} as const;

// Helper per verificare se una feature è abilitata
export const isFeatureEnabled = (featureName: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[featureName].enabled;
};

// Type helper per garantire type safety
export type FeatureFlagName = keyof typeof FEATURE_FLAGS;

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
  }
} as const;

// Helper per verificare se una feature è abilitata
export const isFeatureEnabled = (featureName: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[featureName].enabled;
};

// Type helper per garantire type safety
export type FeatureFlagName = keyof typeof FEATURE_FLAGS;

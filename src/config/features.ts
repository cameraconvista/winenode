/**
 * Feature flags per WineNode
 * Controllo granulare delle funzionalità
 */

export const features = {
  // Ricerca lente in Home - filtro locale per nome vino
  searchLens: true,
  
  // Altre feature flags esistenti possono essere aggiunte qui
  // advancedFilters: false,
  // exportData: false,
} as const;

export type FeatureFlags = typeof features;

/**
 * Verifica se una feature è abilitata
 */
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return features[feature] === true;
};

// ============================================
// WINENODE - COSTANTI APPLICAZIONE
// Data: 2025-09-22T00:35:23+02:00
// ============================================

/**
 * SERVICE_USER_ID - UUID fisso per tenant unico
 * Utilizzato dopo rimozione autenticazione (Fase 2)
 * Sostituisce tutti i user_id dinamici
 */
export const SERVICE_USER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Configurazione applicazione
 */
export const APP_CONFIG = {
  // Modalità tenant unico (post auth removal)
  SINGLE_TENANT_MODE: true,
  
  // User ID fisso di servizio
  SERVICE_USER_ID,
  
  // Versione schema database
  SCHEMA_VERSION: '2.0.0-auth-removed',
  
  // Flag per sviluppo
  DEMO_MODE_AVAILABLE: true
} as const;

/**
 * Utility per compatibilità
 */
export const getUserId = (): string => SERVICE_USER_ID;

/**
 * Verifica se siamo in modalità tenant unico
 */
export const isSingleTenantMode = (): boolean => APP_CONFIG.SINGLE_TENANT_MODE;

/**
 * Environment Variables Validation
 * Valida e configura le variabili d'ambiente richieste dal server
 */

export interface ServerConfig {
  DATABASE_URL: string;
  PORT: number;
}

/**
 * Valida le variabili d'ambiente e restituisce la configurazione
 * @throws Error se variabili obbligatorie mancanti
 */
export function validateEnvironment(): ServerConfig {
  const errors: string[] = [];

  // DATABASE_URL (obbligatoria)
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    errors.push('DATABASE_URL è obbligatoria. Configura la connessione al database.');
  }

  // PORT (opzionale, default 3001)
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
    errors.push('PORT deve essere un numero valido tra 1 e 65535.');
  }

  if (errors.length > 0) {
    console.error('❌ Errori di configurazione ambiente:');
    errors.forEach(error => console.error(`  - ${error}`));
    throw new Error(`Configurazione ambiente non valida: ${errors.join(', ')}`);
  }

  console.log('✅ Configurazione ambiente validata correttamente');
  console.log(`   - DATABASE_URL: ${DATABASE_URL ? '✓ configurata' : '✗ mancante'}`);
  console.log(`   - PORT: ${PORT}`);

  return {
    DATABASE_URL: DATABASE_URL!,
    PORT
  };
}

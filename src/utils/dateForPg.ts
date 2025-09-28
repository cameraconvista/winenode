/**
 * Utility per normalizzazione date per Postgres
 * Converte vari formati in YYYY-MM-DD per compatibilità DB
 */

/**
 * Normalizza una data in formato Postgres (YYYY-MM-DD)
 * @param input - Data in formato DD/MM/YYYY, YYYY-MM-DD, Date object, o undefined
 * @returns Stringa in formato YYYY-MM-DD valida per Postgres
 * @throws Error se la data non è valida
 */
export function normalizeToPgDate(input: string | Date | undefined): string {
  // Se undefined, usa la data di oggi
  if (input === undefined || input === null) {
    const today = new Date();
    return formatDateToPg(today);
  }

  // Se è già un Date object
  if (input instanceof Date) {
    if (isNaN(input.getTime())) {
      throw new Error('INVALID_DATE: Date object non valido');
    }
    return formatDateToPg(input);
  }

  // Se è una stringa, determina il formato
  const dateString = input.trim();
  
  // Regex per formato DD/MM/YYYY
  const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const ddmmyyyyMatch = dateString.match(ddmmyyyyRegex);
  
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Verifica che la data sia valida
    if (isNaN(date.getTime()) || 
        date.getDate() !== parseInt(day) ||
        date.getMonth() !== parseInt(month) - 1 ||
        date.getFullYear() !== parseInt(year)) {
      throw new Error(`INVALID_DATE: Data DD/MM/YYYY non valida: ${dateString}`);
    }
    
    return formatDateToPg(date);
  }

  // Regex per formato YYYY-MM-DD (già corretto)
  const yyyymmddRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  const yyyymmddMatch = dateString.match(yyyymmddRegex);
  
  if (yyyymmddMatch) {
    const [, year, month, day] = yyyymmddMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Verifica che la data sia valida
    if (isNaN(date.getTime()) ||
        date.getDate() !== parseInt(day) ||
        date.getMonth() !== parseInt(month) - 1 ||
        date.getFullYear() !== parseInt(year)) {
      throw new Error(`INVALID_DATE: Data YYYY-MM-DD non valida: ${dateString}`);
    }
    
    return formatDateToPg(date);
  }

  // Regex per formato ISO completo (YYYY-MM-DDTHH:mm:ss.sssZ)
  const isoRegex = /^(\d{4})-(\d{2})-(\d{2})T/;
  const isoMatch = dateString.match(isoRegex);
  
  if (isoMatch) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`INVALID_DATE: Data ISO non valida: ${dateString}`);
    }
    return formatDateToPg(date);
  }

  // Formato non riconosciuto
  throw new Error(`INVALID_DATE: Formato data non supportato: ${dateString}. Formati accettati: DD/MM/YYYY, YYYY-MM-DD`);
}

/**
 * Formatta un Date object in stringa YYYY-MM-DD
 * @param date - Date object valido
 * @returns Stringa in formato YYYY-MM-DD
 */
function formatDateToPg(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Converte data per colonna timestamp Postgres (se necessario)
 * @param input - Data in vari formati
 * @returns Stringa ISO timestamp per Postgres
 */
export function normalizeToPgTimestamp(input: string | Date | undefined): string {
  const pgDate = normalizeToPgDate(input);
  // Converte YYYY-MM-DD in timestamp ISO per mezzanotte UTC
  return new Date(pgDate + 'T00:00:00.000Z').toISOString();
}

/**
 * Utility per testing - verifica se una stringa è una data valida
 * @param dateString - Stringa da testare
 * @returns true se la data è valida e supportata
 */
export function isValidDateString(dateString: string): boolean {
  try {
    normalizeToPgDate(dateString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifica se una stringa è un UUID v4 valido
 * @param uuid - Stringa da verificare
 * @returns true se è un UUID valido
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

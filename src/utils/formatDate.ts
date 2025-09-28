/**
 * Utility per formattazione date in formato italiano
 * Solo per display - non modifica i valori salvati su DB
 */

/**
 * Formatta una data in formato italiano DD/MM/YYYY
 * @param input - Data in formato ISO, Date object, o undefined
 * @returns Stringa in formato DD/MM/YYYY o stringa vuota se invalida
 */
export function formatDateIt(input: string | Date | null | undefined): string {
  if (!input) {
    return '';
  }

  try {
    let date: Date;

    if (input instanceof Date) {
      date = input;
    } else if (typeof input === 'string') {
      // Gestisce formati ISO: YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss.sssZ
      date = new Date(input);
    } else {
      return '';
    }

    // Verifica che la data sia valida
    if (isNaN(date.getTime())) {
      return '';
    }

    // Formatta in DD/MM/YYYY
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.warn('Errore formattazione data:', input, error);
    return '';
  }
}

/**
 * Formatta una data per display con fallback a formato ISO
 * @param input - Data in vari formati
 * @returns Data formattata o input originale se formattazione fallisce
 */
export function formatDateDisplay(input: string | Date | null | undefined): string {
  const formatted = formatDateIt(input);
  if (formatted) {
    return formatted;
  }
  
  // Fallback al valore originale se formattazione fallisce
  return typeof input === 'string' ? input : '';
}

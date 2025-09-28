/**
 * Utility per generazione messaggio WhatsApp ordine vini
 * Esclude sempre i prezzi, include solo dati essenziali
 */

export interface OrderDetail {
  wineName: string;
  vintage?: string;
  quantity: number;
  unit: 'bottiglie' | 'cartoni';
}

/**
 * Costruisce il messaggio WhatsApp per ordine vini
 * @param orderDetails Array dettagli ordine (senza prezzi)
 * @param date Data ordine
 * @returns Stringa formattata per WhatsApp
 */
export function buildWhatsAppMessage(
  orderDetails: OrderDetail[],
  date: Date = new Date()
): string {
  const lines: string[] = [];
  
  // Intestazione fissa - Nuovo ordine
  lines.push('Ordine vini');
  lines.push('');
  lines.push('Camera con Vista');
  lines.push('');
  
  // Data in formato italiano
  const formattedDate = date.toLocaleDateString('it-IT');
  lines.push(formattedDate);
  lines.push('');
  
  // Elenco articoli (solo nome, annata opzionale, quantità, unità)
  orderDetails.forEach(item => {
    let line = `• ${item.wineName}`;
    
    // Aggiungi annata se presente
    if (item.vintage) {
      line += ` ${item.vintage}`;
    }
    
    // Quantità e unità (capitalizza prima lettera)
    const unit = item.unit.charAt(0).toUpperCase() + item.unit.slice(1);
    line += ` — x${item.quantity} ${unit}`;
    
    lines.push(line);
  });
  
  // Normalizza CRLF → LF e trim finale
  const message = lines.join('\n').replace(/\r?\n/g, '\n').trim();
  return message;
}

/**
 * Costruisce URL WhatsApp con messaggio precompilato
 * @param message Testo messaggio
 * @returns URL wa.me con testo encodato
 */
export function buildWhatsAppUrl(message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/?text=${encodedMessage}`;
}

/**
 * Costruisce URL WhatsApp per app mobile (priorità)
 * @param message Testo messaggio
 * @returns URL whatsapp:// con testo encodato
 */
export function buildWhatsAppMobileUrl(message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `whatsapp://send?text=${encodedMessage}`;
}

/**
 * Costruisce URL WhatsApp web fallback
 * @param message Testo messaggio
 * @returns URL web.whatsapp.com con testo encodato
 */
export function buildWhatsAppWebUrl(message: string): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://web.whatsapp.com/send?text=${encodedMessage}`;
}
